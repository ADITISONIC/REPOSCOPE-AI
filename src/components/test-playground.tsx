import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download, 
  Copy, 
  Loader2, 
  Terminal, 
  Code, 
  RefreshCw,
  Zap,
  AlertTriangle,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'

interface TestPlaygroundProps {
  initialTestCode?: string
  initialSourceCode?: string
  language?: 'javascript' | 'typescript' | 'python'
  testFramework?: 'jest' | 'vitest' | 'pytest'
  fileName?: string
  functionName?: string
}

export function TestPlayground({
  initialTestCode = '',
  initialSourceCode = '',
  language = 'javascript',
  testFramework = 'jest',
  fileName = '',
  functionName = ''
}: TestPlaygroundProps) {
  const [testCode, setTestCode] = useState(initialTestCode)
  const [sourceCode, setSourceCode] = useState(initialSourceCode)
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState<string>('')
  const [testResults, setTestResults] = useState<{
    passed: number;
    failed: number;
    total: number;
    duration: number;
  } | null>(null)
  const [activeTab, setActiveTab] = useState<'test' | 'source'>('test')
  const [selectedLanguage, setSelectedLanguage] = useState(language)
  const [selectedFramework, setSelectedFramework] = useState(testFramework)
  const [webcontainer, setWebcontainer] = useState<any>(null)
  const [isWebContainerReady, setIsWebContainerReady] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [webContainerSupported, setWebContainerSupported] = useState(false)
  
  const terminalRef = useRef<HTMLDivElement>(null)
  const terminalInstance = useRef<any>(null)
  const fitAddon = useRef<any>(null)

  // Check WebContainer support and initialize
  useEffect(() => {
    const checkWebContainerSupport = async () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          console.warn('WebContainer requires browser environment')
          setIsInitializing(false)
          return
        }

        // Check for required browser features
        if (!('serviceWorker' in navigator) || !('WebAssembly' in window)) {
          console.warn('WebContainer requires Service Workers and WebAssembly support')
          setIsInitializing(false)
          return
        }

        // Check if we're in a secure context (HTTPS or localhost)
        if (!window.isSecureContext) {
          console.warn('WebContainer requires a secure context (HTTPS or localhost)')
          setIsInitializing(false)
          return
        }

        // Try to dynamically import WebContainer
        try {
          const { WebContainer } = await import('@webcontainer/api')
          
          // Initialize WebContainer
          const container = await WebContainer.boot()
          setWebcontainer(container)
          setWebContainerSupported(true)
          
          // Set up basic project structure
          await setupInitialProject(container, selectedLanguage, selectedFramework)
          
          setIsWebContainerReady(true)
          toast.success('Test sandbox initialized successfully!')
          
        } catch (importError) {
          console.warn('WebContainer API not available:', importError)
          // Fallback to mock implementation
          setupMockEnvironment()
        }
        
      } catch (error) {
        console.error('Failed to initialize WebContainer:', error)
        setupMockEnvironment()
      } finally {
        setIsInitializing(false)
      }
    }

    const setupMockEnvironment = () => {
      setWebContainerSupported(false)
      setIsWebContainerReady(true)
      toast.info('Running in simulation mode - WebContainer not available')
    }

    checkWebContainerSupport()

    return () => {
      // Clean up terminal
      if (terminalInstance.current) {
        terminalInstance.current.dispose()
        terminalInstance.current = null
      }
    }
  }, [])

  // Update project when language or framework changes
  useEffect(() => {
    if (webcontainer && isWebContainerReady && webContainerSupported) {
      setupInitialProject(webcontainer, selectedLanguage, selectedFramework)
    }
  }, [selectedLanguage, selectedFramework, isWebContainerReady, webContainerSupported])

  // Handle window resize for terminal
  useEffect(() => {
    const handleResize = () => {
      if (fitAddon.current) {
        fitAddon.current.fit()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const setupInitialProject = async (container: any, lang: string, framework: string) => {
    if (!webContainerSupported) return

    try {
      // Clear terminal output
      if (terminalInstance.current) {
        terminalInstance.current.clear()
      }
      
      setOutput('')
      setTestResults(null)
      
      // Create basic project structure based on language and framework
      if (lang === 'javascript' || lang === 'typescript') {
        // Create package.json
        const packageJson = {
          name: "test-playground",
          version: "1.0.0",
          type: "module",
          scripts: {
            "test": framework === 'jest' 
              ? "node --experimental-vm-modules node_modules/jest/bin/jest.js" 
              : "vitest run"
          },
          dependencies: {},
          devDependencies: framework === 'jest' 
            ? { "jest": "^29.5.0" } 
            : { "vitest": "^0.34.3" }
        }
        
        await container.fs.writeFile('package.json', JSON.stringify(packageJson, null, 2))
        
        // Create config file
        if (framework === 'jest') {
          await container.fs.writeFile('jest.config.js', `
export default {
  transform: {},
  extensionsToTreatAsEsm: ['.js', '.jsx', '.ts', '.tsx'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironment: 'node',
}`)
        } else {
          await container.fs.writeFile('vitest.config.js', `
export default {
  test: {
    environment: 'node',
  },
}`)
        }
        
        // Create source and test directories
        await container.fs.mkdir('src', { recursive: true })
        await container.fs.mkdir('tests', { recursive: true })
        
        // Install dependencies
        if (terminalInstance.current) {
          terminalInstance.current.writeln('Installing dependencies...')
        }
        const installProcess = await container.spawn('npm', ['install'])
        installProcess.output.pipeTo(new WritableStream({
          write(data) {
            if (terminalInstance.current) {
              terminalInstance.current.write(data)
            }
          }
        }))
        
        const exitCode = await installProcess.exit
        if (exitCode !== 0) {
          if (terminalInstance.current) {
            terminalInstance.current.writeln('\r\nFailed to install dependencies')
          }
          return
        }
        
        if (terminalInstance.current) {
          terminalInstance.current.writeln('\r\nDependencies installed successfully')
          terminalInstance.current.writeln('Test sandbox ready!')
        }
      } else if (lang === 'python') {
        // Create Python project structure
        await container.fs.mkdir('src', { recursive: true })
        await container.fs.mkdir('tests', { recursive: true })
        
        // Create requirements.txt
        await container.fs.writeFile('requirements.txt', framework === 'pytest' ? 'pytest==7.3.1' : 'unittest2==1.1.0')
        
        // Create __init__.py files
        await container.fs.writeFile('src/__init__.py', '')
        await container.fs.writeFile('tests/__init__.py', '')
        
        if (terminalInstance.current) {
          terminalInstance.current.writeln('Python environment ready!')
          terminalInstance.current.writeln('Note: Python testing is simulated in this environment')
        }
      }
      
      // Write initial source and test files
      await updateSourceFile(container, sourceCode, selectedLanguage)
      await updateTestFile(container, testCode, selectedLanguage, selectedFramework)
      
    } catch (error) {
      console.error('Error setting up project:', error)
      if (terminalInstance.current) {
        terminalInstance.current.writeln(`\r\nError setting up project: ${error}`)
      }
    }
  }

  const updateSourceFile = async (container: any, code: string, lang: string) => {
    if (!webContainerSupported) return

    const extension = lang === 'typescript' ? '.ts' : lang === 'python' ? '.py' : '.js'
    const sourcePath = `src/${functionName || 'index'}${extension}`
    
    try {
      await container.fs.writeFile(sourcePath, code || getDefaultSourceCode(lang, functionName))
    } catch (error) {
      console.error('Error updating source file:', error)
    }
  }

  const updateTestFile = async (container: any, code: string, lang: string, framework: string) => {
    if (!webContainerSupported) return

    let extension = '.js'
    let testPath = ''
    
    if (lang === 'typescript') {
      extension = '.ts'
    } else if (lang === 'python') {
      extension = '.py'
    }
    
    if (framework === 'jest') {
      testPath = `tests/${functionName || 'index'}.test${extension}`
    } else if (framework === 'vitest') {
      testPath = `tests/${functionName || 'index'}.test${extension}`
    } else if (framework === 'pytest') {
      testPath = `tests/test_${functionName || 'main'}${extension}`
    }
    
    try {
      await container.fs.writeFile(testPath, code || getDefaultTestCode(lang, framework, functionName))
    } catch (error) {
      console.error('Error updating test file:', error)
    }
  }

  const getDefaultSourceCode = (lang: string, funcName = 'example'): string => {
    if (lang === 'javascript' || lang === 'typescript') {
      return `// ${funcName}.js
export function ${funcName}(a, b) {
  return a + b;
}
`
    } else if (lang === 'python') {
      return `# ${funcName}.py
def ${funcName}(a, b):
    return a + b
`
    }
    return ''
  }

  const getDefaultTestCode = (lang: string, framework: string, funcName = 'example'): string => {
    if ((lang === 'javascript' || lang === 'typescript') && framework === 'jest') {
      return `// ${funcName}.test.js
import { ${funcName} } from '../src/${funcName}.js';

describe('${funcName}', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(${funcName}(1, 2)).toBe(3);
  });
  
  test('adds -1 + 1 to equal 0', () => {
    expect(${funcName}(-1, 1)).toBe(0);
  });
});
`
    } else if ((lang === 'javascript' || lang === 'typescript') && framework === 'vitest') {
      return `// ${funcName}.test.js
import { describe, it, expect } from 'vitest';
import { ${funcName} } from '../src/${funcName}.js';

describe('${funcName}', () => {
  it('adds 1 + 2 to equal 3', () => {
    expect(${funcName}(1, 2)).toBe(3);
  });
  
  it('adds -1 + 1 to equal 0', () => {
    expect(${funcName}(-1, 1)).toBe(0);
  });
});
`
    } else if (lang === 'python' && framework === 'pytest') {
      return `# test_${funcName}.py
import pytest
from src.${funcName} import ${funcName}

def test_addition():
    assert ${funcName}(1, 2) == 3
    
def test_negative_numbers():
    assert ${funcName}(-1, 1) == 0
`
    }
    return ''
  }

  const runTests = async () => {
    if (!isWebContainerReady) {
      toast.error('Test environment not ready')
      return
    }
    
    setIsRunning(true)
    setOutput('')
    setTestResults(null)
    
    try {
      if (webContainerSupported && webcontainer) {
        // Update source and test files
        await updateSourceFile(webcontainer, sourceCode, selectedLanguage)
        await updateTestFile(webcontainer, testCode, selectedLanguage, selectedFramework)
        
        // Clear terminal
        if (terminalInstance.current) {
          terminalInstance.current.clear()
        }
        
        let command = ''
        let args: string[] = []
        
        if (selectedLanguage === 'javascript' || selectedLanguage === 'typescript') {
          command = 'npm'
          args = ['test']
        } else if (selectedLanguage === 'python') {
          command = 'python'
          args = ['-m', 'pytest', 'tests/']
        }
        
        const startTime = Date.now()
        
        // Run tests
        if (terminalInstance.current) {
          terminalInstance.current.writeln(`Running ${selectedFramework} tests...\r\n`)
        }
        const process = await webcontainer.spawn(command, args)
        
        let outputText = ''
        
        process.output.pipeTo(new WritableStream({
          write(data) {
            outputText += data
            if (terminalInstance.current) {
              terminalInstance.current.write(data)
            }
          }
        }))
        
        const exitCode = await process.exit
        const endTime = Date.now()
        const duration = (endTime - startTime) / 1000
        
        // Parse test results
        const results = parseTestResults(outputText, selectedFramework)
        
        setOutput(outputText)
        setTestResults({
          ...results,
          duration
        })
        
        if (exitCode === 0) {
          toast.success('All tests passed!')
        } else {
          toast.error('Some tests failed')
        }
      } else {
        // Mock test execution for environments without WebContainer
        const startTime = Date.now()
        
        // Simulate test execution
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const endTime = Date.now()
        const duration = (endTime - startTime) / 1000
        
        // Mock results
        const mockOutput = `Running ${selectedFramework} tests...

✓ Test 1: Basic functionality
✓ Test 2: Edge cases

Tests: 2 passed, 2 total
Time: ${duration.toFixed(2)}s`
        
        setOutput(mockOutput)
        setTestResults({
          passed: 2,
          failed: 0,
          total: 2,
          duration
        })
        
        toast.success('Mock tests completed!')
      }
      
    } catch (error) {
      console.error('Error running tests:', error)
      setOutput(`Error running tests: ${error}`)
      toast.error('Failed to run tests')
    } finally {
      setIsRunning(false)
    }
  }

  const parseTestResults = (output: string, framework: string) => {
    let passed = 0
    let failed = 0
    let total = 0
    
    if (framework === 'jest' || framework === 'vitest') {
      // Parse Jest/Vitest output
      const passedMatch = output.match(/(\d+)\s+passed/i)
      const failedMatch = output.match(/(\d+)\s+failed/i)
      const totalMatch = output.match(/(\d+)\s+total/i)
      
      passed = passedMatch ? parseInt(passedMatch[1]) : 0
      failed = failedMatch ? parseInt(failedMatch[1]) : 0
      total = totalMatch ? parseInt(totalMatch[1]) : (passed + failed)
    } else if (framework === 'pytest') {
      // Parse Pytest output
      const passedMatch = output.match(/(\d+)\s+passed/i)
      const failedMatch = output.match(/(\d+)\s+failed/i)
      
      passed = passedMatch ? parseInt(passedMatch[1]) : 0
      failed = failedMatch ? parseInt(failedMatch[1]) : 0
      total = passed + failed
    }
    
    return { passed, failed, total, duration: 0 }
  }

  const copyToClipboard = async (text: string, type: 'test' | 'source') => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${type === 'test' ? 'Test' : 'Source'} code copied to clipboard!`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success(`${filename} downloaded!`)
  }

  const getLanguageExtension = () => {
    if (selectedLanguage === 'typescript') return '.ts'
    if (selectedLanguage === 'python') return '.py'
    return '.js'
  }

  const getTestFilename = () => {
    const baseName = functionName || 'example'
    const ext = getLanguageExtension()
    
    if (selectedFramework === 'pytest') {
      return `test_${baseName}${ext}`
    }
    return `${baseName}.test${ext}`
  }

  const getSourceFilename = () => {
    const baseName = functionName || 'example'
    return `${baseName}${getLanguageExtension()}`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Terminal className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>Live Testing Playground</span>
                  <Badge variant="secondary" className="ml-2">
                    <Zap className="w-3 h-3 mr-1" />
                    {webContainerSupported ? 'Browser Sandbox' : 'Simulation Mode'}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {webContainerSupported 
                    ? 'Run and test your code directly in the browser'
                    : 'Code editor with simulated test execution'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedFramework} onValueChange={(value) => setSelectedFramework(value as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jest">Jest</SelectItem>
                  <SelectItem value="vitest">Vitest</SelectItem>
                  <SelectItem value="pytest">PyTest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isInitializing ? (
            <div className="flex items-center justify-center py-12">
              <motion.div className="text-center space-y-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"
                />
                <div>
                  <p className="font-medium">Initializing Test Environment</p>
                  <p className="text-sm text-muted-foreground">
                    {webContainerSupported ? 'Setting up WebContainer sandbox...' : 'Preparing simulation mode...'}
                  </p>
                </div>
              </motion.div>
            </div>
          ) : (
            <>
              {/* Code Editor Tabs */}
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'test' | 'source')}>
                <div className="flex items-center justify-between mb-2">
                  <TabsList>
                    <TabsTrigger value="test" className="flex items-center space-x-2">
                      <Code className="w-4 h-4" />
                      <span>Test Code</span>
                    </TabsTrigger>
                    <TabsTrigger value="source" className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Source Code</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={runTests}
                      disabled={isRunning || !isWebContainerReady}
                      className="flex items-center space-x-2"
                    >
                      {isRunning ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      <span>{isRunning ? 'Running...' : 'Run Tests'}</span>
                    </Button>
                  </div>
                </div>

                <TabsContent value="test" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium">
                        {getTestFilename()}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {selectedFramework}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(testCode, 'test')}
                      >
                        <Copy className="w-3 h-3 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(testCode, getTestFilename())}
                      >
                        <Download className="w-3 h-3 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-md overflow-hidden">
                    <CodeMirror
                      value={testCode}
                      height="400px"
                      theme={vscodeDark}
                      extensions={[
                        selectedLanguage === 'python' 
                          ? python() 
                          : javascript({ jsx: true, typescript: selectedLanguage === 'typescript' })
                      ]}
                      onChange={setTestCode}
                      className="text-sm"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="source" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium">
                        {getSourceFilename()}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {selectedLanguage}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(sourceCode, 'source')}
                      >
                        <Copy className="w-3 h-3 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(sourceCode, getSourceFilename())}
                      >
                        <Download className="w-3 h-3 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-md overflow-hidden">
                    <CodeMirror
                      value={sourceCode}
                      height="400px"
                      theme={vscodeDark}
                      extensions={[
                        selectedLanguage === 'python' 
                          ? python() 
                          : javascript({ jsx: true, typescript: selectedLanguage === 'typescript' })
                      ]}
                      onChange={setSourceCode}
                      className="text-sm"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Test Results */}
              {testResults && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg border-2 border-dashed border-border/50 bg-muted/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Test Results</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{testResults.duration.toFixed(2)}s</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          {testResults.passed} passed
                        </Badge>
                        {testResults.failed > 0 && (
                          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            {testResults.failed} failed
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {testResults.total} total
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <Terminal className="w-4 h-4" />
                        <h4 className="text-sm font-medium">Test Output</h4>
                      </div>
                      {webContainerSupported ? (
                        <div 
                          ref={terminalRef} 
                          className="bg-black rounded-md h-[200px] overflow-hidden"
                        />
                      ) : (
                        <div className="bg-black text-green-400 p-4 rounded-md h-[200px] overflow-auto font-mono text-sm">
                          <pre>{output}</pre>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <h4 className="text-sm font-medium">Summary</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                          <span className="text-sm">Total Tests</span>
                          <Badge variant="secondary">{testResults.total}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                          <span className="text-sm text-green-800 dark:text-green-300">Passed</span>
                          <Badge variant="outline" className="bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200">
                            {testResults.passed}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-red-100 dark:bg-red-900/30 rounded-md">
                          <span className="text-sm text-red-800 dark:text-red-300">Failed</span>
                          <Badge variant="outline" className="bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200">
                            {testResults.failed}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                          <span className="text-sm text-blue-800 dark:text-blue-300">Duration</span>
                          <Badge variant="outline" className="bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                            {testResults.duration.toFixed(2)}s
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Sandbox Status */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isWebContainerReady ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-sm">
                    {isWebContainerReady 
                      ? (webContainerSupported ? 'Sandbox Ready' : 'Simulation Mode Ready')
                      : 'Initializing...'
                    }
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (webcontainer && isWebContainerReady && webContainerSupported) {
                        setupInitialProject(webcontainer, selectedLanguage, selectedFramework)
                        toast.success('Test environment reset')
                      } else {
                        toast.info('Environment reset (simulation mode)')
                      }
                    }}
                    disabled={!isWebContainerReady}
                  >
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Reset Environment
                  </Button>
                </div>
              </div>

              {/* Limitations Notice */}
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      {webContainerSupported ? 'Sandbox Limitations' : 'Simulation Mode'}
                    </h4>
                    <ul className="text-xs text-yellow-700 dark:text-yellow-400 mt-1 space-y-1 list-disc pl-4">
                      {webContainerSupported ? (
                        <>
                          <li>JavaScript/TypeScript tests run in a real Node.js environment</li>
                          <li>Python support is limited in this browser sandbox</li>
                          <li>Network access is restricted for security</li>
                          <li>File system changes are temporary and will be lost on page refresh</li>
                        </>
                      ) : (
                        <>
                          <li>WebContainer API not available - running in simulation mode</li>
                          <li>Code editing is fully functional</li>
                          <li>Test execution is simulated for demonstration</li>
                          <li>Requires HTTPS, Service Workers, and WebAssembly for full functionality</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
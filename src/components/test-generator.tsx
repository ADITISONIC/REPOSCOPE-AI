import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Code, Copy, CheckCircle, Play, Zap, FileText, TestTube, Loader2, RefreshCw, Download, Sparkles, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RepoData } from '@/types'
import { toast } from 'sonner'
import { TestPlayground } from '@/components/test-playground'

interface TestGeneratorProps {
  repoData: RepoData
}

interface TestResult {
  testFramework: string
  language: string
  functionName: string
  testFileName: string
  testCases: string
  confidence: number
  explanation: string
  edgeCases: string[]
  coverage: string[]
}

interface FunctionInfo {
  name: string
  file: string
  description: string
  complexity: 'Simple' | 'Medium' | 'Complex'
  testable: boolean
}

export function TestGenerator({ repoData }: TestGeneratorProps) {
  const [selectedFile, setSelectedFile] = useState('')
  const [selectedFunction, setSelectedFunction] = useState('')
  const [generatedTests, setGeneratedTests] = useState<TestResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [functions, setFunctions] = useState<FunctionInfo[]>([])
  const [testableFiles, setTestableFiles] = useState<string[]>([])
  const [showPlayground, setShowPlayground] = useState(false)
  const [activeTab, setActiveTab] = useState('tests')

  // Extract testable files from the actual repository structure
  useEffect(() => {
    console.log('Repository structure for test generator:', repoData.structure)
    const files = extractTestableFiles(repoData.structure)
    console.log('Extracted testable files:', files)
    setTestableFiles(files)
  }, [repoData.structure])

  const extractTestableFiles = (structure: any, basePath: string = ''): string[] => {
    const testableFiles: string[] = []
    
    if (!structure || typeof structure !== 'object') {
      console.warn('Invalid structure provided to extractTestableFiles:', structure)
      return testableFiles
    }
    
    for (const [name, node] of Object.entries(structure)) {
      if (!node || typeof node !== 'object') continue
      
      const currentPath = basePath ? `${basePath}/${name}` : name
      
      if ((node as any).type === 'file') {
        const isTestable = ['.ts', '.js', '.tsx', '.jsx', '.py', '.go', '.rs', '.java', '.php', '.rb'].some(ext => 
          name.toLowerCase().endsWith(ext)
        ) && !name.includes('.test.') && !name.includes('.spec.') && !name.includes('.d.ts')
        
        if (isTestable) {
          testableFiles.push(currentPath)
        }
      } else if ((node as any).type === 'folder' && (node as any).children) {
        testableFiles.push(...extractTestableFiles((node as any).children, currentPath))
      }
    }
    
    return testableFiles.slice(0, 50) // Reasonable limit for performance
  }

  // Generate mock functions based on file type and path
  const generateMockFunctions = (filePath: string): FunctionInfo[] => {
    const fileName = filePath.split('/').pop() || filePath
    const extension = fileName.split('.').pop()?.toLowerCase()
    const pathSegments = filePath.split('/')
    
    const functions: FunctionInfo[] = []
    
    if (extension === 'tsx' || extension === 'jsx') {
      // React component
      const componentName = fileName.replace(/\.(tsx|jsx)$/, '')
      functions.push({
        name: componentName,
        file: filePath,
        description: `React component that renders ${componentName.toLowerCase()} interface`,
        complexity: 'Medium',
        testable: true
      })
      
      if (pathSegments.includes('components') || pathSegments.includes('src')) {
        functions.push({
          name: 'handleClick',
          file: filePath,
          description: 'Handles user click interactions and state updates',
          complexity: 'Simple',
          testable: true
        })
        functions.push({
          name: 'useEffect',
          file: filePath,
          description: 'Component lifecycle and side effects management',
          complexity: 'Medium',
          testable: true
        })
        functions.push({
          name: 'handleSubmit',
          file: filePath,
          description: 'Form submission and validation logic',
          complexity: 'Medium',
          testable: true
        })
      }
    } else if (extension === 'ts' || extension === 'js') {
      if (pathSegments.includes('utils') || pathSegments.includes('lib') || pathSegments.includes('helpers')) {
        // Utility functions
        functions.push({
          name: 'processData',
          file: filePath,
          description: 'Processes and transforms input data with validation',
          complexity: 'Medium',
          testable: true
        })
        functions.push({
          name: 'validateInput',
          file: filePath,
          description: 'Validates user input and returns formatted errors',
          complexity: 'Simple',
          testable: true
        })
        functions.push({
          name: 'formatOutput',
          file: filePath,
          description: 'Formats data for display or API response',
          complexity: 'Simple',
          testable: true
        })
        functions.push({
          name: 'calculateResult',
          file: filePath,
          description: 'Performs calculations with error handling',
          complexity: 'Medium',
          testable: true
        })
      } else if (pathSegments.includes('api') || pathSegments.includes('routes') || fileName.includes('api')) {
        // API functions
        functions.push({
          name: 'handleRequest',
          file: filePath,
          description: 'Processes incoming API requests with authentication',
          complexity: 'Complex',
          testable: true
        })
        functions.push({
          name: 'authenticate',
          file: filePath,
          description: 'Handles user authentication and token validation',
          complexity: 'Complex',
          testable: true
        })
        functions.push({
          name: 'validatePayload',
          file: filePath,
          description: 'Validates request payload and sanitizes input',
          complexity: 'Medium',
          testable: true
        })
      } else if (pathSegments.includes('services')) {
        // Service functions
        functions.push({
          name: 'fetchData',
          file: filePath,
          description: 'Fetches data from external APIs with error handling',
          complexity: 'Medium',
          testable: true
        })
        functions.push({
          name: 'cacheResult',
          file: filePath,
          description: 'Caches results with expiration logic',
          complexity: 'Medium',
          testable: true
        })
      } else {
        // General functions
        const baseName = fileName.replace(/\.(ts|js)$/, '')
        functions.push({
          name: baseName,
          file: filePath,
          description: `Main function or class in ${baseName} module`,
          complexity: 'Medium',
          testable: true
        })
        functions.push({
          name: 'initialize',
          file: filePath,
          description: 'Initializes module with configuration options',
          complexity: 'Simple',
          testable: true
        })
      }
    } else if (extension === 'py') {
      // Python functions
      functions.push({
        name: 'main',
        file: filePath,
        description: 'Main entry point function with argument parsing',
        complexity: 'Medium',
        testable: true
      })
      functions.push({
        name: 'process',
        file: filePath,
        description: 'Core processing logic with error handling',
        complexity: 'Complex',
        testable: true
      })
      functions.push({
        name: 'validate_input',
        file: filePath,
        description: 'Input validation with type checking',
        complexity: 'Simple',
        testable: true
      })
    } else if (extension === 'go') {
      // Go functions
      functions.push({
        name: 'Handler',
        file: filePath,
        description: 'HTTP handler function with middleware support',
        complexity: 'Medium',
        testable: true
      })
      functions.push({
        name: 'Process',
        file: filePath,
        description: 'Core business logic processing',
        complexity: 'Complex',
        testable: true
      })
    } else if (extension === 'java') {
      // Java methods
      const className = fileName.replace(/\.java$/, '')
      functions.push({
        name: className,
        file: filePath,
        description: `Main class constructor and initialization`,
        complexity: 'Medium',
        testable: true
      })
      functions.push({
        name: 'execute',
        file: filePath,
        description: 'Main execution method with exception handling',
        complexity: 'Complex',
        testable: true
      })
    }
    
    return functions.length > 0 ? functions : [{
      name: 'defaultFunction',
      file: filePath,
      description: 'Main function in this file (inferred from filename)',
      complexity: 'Medium',
      testable: true
    }]
  }

  const handleFileSelect = (file: string) => {
    console.log('Selected file for testing:', file)
    setSelectedFile(file)
    setSelectedFunction('')
    const mockFunctions = generateMockFunctions(file)
    console.log('Generated functions for file:', mockFunctions)
    setFunctions(mockFunctions)
    setGeneratedTests(null)
    setShowPlayground(false)
    toast.success(`Selected ${file.split('/').pop()} - Choose a function to test!`)
  }

  const generateTests = async () => {
    if (!selectedFile || !selectedFunction) {
      toast.error('Please select both a file and function')
      return
    }

    setIsGenerating(true)
    
    try {
      // Call the test generator edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-generator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          fileName: selectedFile,
          functionName: selectedFunction,
          fileContent: null, // Would be populated from actual file content
          projectContext: {
            language: repoData.techStackDetailed.language,
            frameworks: [repoData.techStackDetailed.frontend, repoData.techStackDetailed.backend].filter(Boolean),
            testFramework: detectTestFramework()
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate tests')
      }

      const testResult = await response.json()
      setGeneratedTests(testResult)
      toast.success('Test cases generated successfully!')
      
    } catch (error) {
      console.error('Error generating tests:', error)
      
      // Generate intelligent fallback tests
      const fallbackTests = generateIntelligentFallbackTests()
      setGeneratedTests(fallbackTests)
      toast.warning('Using local test generation - AI service unavailable')
      
    } finally {
      setIsGenerating(false)
    }
  }

  const detectTestFramework = (): string => {
    if (repoData.techStackDetailed.infra.includes('Jest')) return 'jest'
    if (repoData.techStackDetailed.infra.includes('Vitest')) return 'vitest'
    if (repoData.techStackDetailed.language === 'Python') return 'pytest'
    if (repoData.techStackDetailed.language === 'Go') return 'go test'
    if (repoData.techStackDetailed.language === 'Java') return 'junit'
    return 'jest' // Default for JavaScript/TypeScript
  }

  const generateIntelligentFallbackTests = (): TestResult => {
    const selectedFunc = functions.find(f => f.name === selectedFunction)
    const framework = detectTestFramework()
    const isReact = selectedFile.includes('.tsx') || selectedFile.includes('.jsx')
    
    let testCases = ''
    let explanation = ''
    let edgeCases: string[] = []
    let coverage: string[] = []

    if (framework === 'jest' || framework === 'vitest') {
      if (isReact) {
        testCases = generateReactTestCases(selectedFunction, selectedFunc?.description || '')
        explanation = 'React component tests using React Testing Library and Jest/Vitest'
        edgeCases = ['Empty props', 'Loading states', 'Error boundaries', 'User interactions']
        coverage = ['Component rendering', 'Props handling', 'Event handlers', 'State changes']
      } else {
        testCases = generateUtilityTestCases(selectedFunction, selectedFunc?.description || '')
        explanation = 'Unit tests for utility functions with comprehensive edge case coverage'
        edgeCases = ['Null/undefined inputs', 'Empty arrays/objects', 'Invalid data types', 'Boundary values']
        coverage = ['Happy path', 'Error handling', 'Input validation', 'Return values']
      }
    } else if (framework === 'pytest') {
      testCases = generatePythonTestCases(selectedFunction, selectedFunc?.description || '')
      explanation = 'Python unit tests using pytest framework with fixtures and parametrization'
      edgeCases = ['None values', 'Empty collections', 'Type errors', 'Value errors']
      coverage = ['Normal execution', 'Exception handling', 'Edge cases', 'Integration points']
    }

    return {
      testFramework: framework,
      language: repoData.techStackDetailed.language,
      functionName: selectedFunction,
      testFileName: `${selectedFunction}.test.${framework === 'pytest' ? 'py' : 'js'}`,
      testCases,
      confidence: 85,
      explanation,
      edgeCases,
      coverage
    }
  }

  const generateReactTestCases = (functionName: string, description: string): string => {
    return `import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ${functionName} } from './${selectedFile.split('/').pop()?.replace('.tsx', '')}'

describe('${functionName}', () => {
  // Basic rendering test
  it('should render without crashing', () => {
    render(<${functionName} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  // Props handling test
  it('should handle props correctly', () => {
    const mockProps = {
      title: 'Test Title',
      onAction: vi.fn()
    }
    render(<${functionName} {...mockProps} />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  // User interaction test
  it('should handle user interactions', async () => {
    const mockHandler = vi.fn()
    render(<${functionName} onAction={mockHandler} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(mockHandler).toHaveBeenCalledTimes(1)
    })
  })

  // Loading state test
  it('should display loading state correctly', () => {
    render(<${functionName} isLoading={true} />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  // Error handling test
  it('should handle errors gracefully', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<${functionName} data={null} />)
    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  // Accessibility test
  it('should maintain accessibility standards', () => {
    render(<${functionName} />)
    const element = screen.getByRole('main')
    expect(element).toHaveAttribute('aria-label')
  })
})`
  }

  const generateUtilityTestCases = (functionName: string, description: string): string => {
    return `import { describe, it, expect, vi } from 'vitest'
import { ${functionName} } from './${selectedFile.split('/').pop()?.replace('.ts', '')}'

describe('${functionName}', () => {
  // Happy path test
  it('should return correct result for valid input', () => {
    const input = { /* valid test data */ }
    const result = ${functionName}(input)
    expect(result).toBeDefined()
    expect(typeof result).toBe('object')
  })

  // Null/undefined handling
  it('should handle null input gracefully', () => {
    expect(() => ${functionName}(null)).not.toThrow()
  })

  it('should handle undefined input gracefully', () => {
    expect(() => ${functionName}(undefined)).not.toThrow()
  })

  // Empty data handling
  it('should handle empty array input', () => {
    const result = ${functionName}([])
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(0)
  })

  it('should handle empty object input', () => {
    const result = ${functionName}({})
    expect(typeof result).toBe('object')
  })

  // Type validation
  it('should throw error for invalid input type', () => {
    expect(() => ${functionName}('invalid')).toThrow()
  })

  // Boundary value testing
  it('should handle boundary values correctly', () => {
    const boundaryInput = { /* boundary test data */ }
    const result = ${functionName}(boundaryInput)
    expect(result).toBeDefined()
  })

  // Async behavior (if applicable)
  it('should handle async operations correctly', async () => {
    const result = await ${functionName}({ async: true })
    expect(result).toBeDefined()
  })

  // Mock external dependencies
  it('should work with mocked dependencies', () => {
    const mockDependency = vi.fn().mockReturnValue('mocked')
    const result = ${functionName}({ dependency: mockDependency })
    expect(mockDependency).toHaveBeenCalled()
    expect(result).toContain('mocked')
  })
})`
  }

  const generatePythonTestCases = (functionName: string, description: string): string => {
    return `import pytest
from unittest.mock import Mock, patch
from ${selectedFile.replace('src/', '').replace('.py', '').replace('/', '.')} import ${functionName}

class Test${functionName.charAt(0).toUpperCase() + functionName.slice(1)}:
    """Test suite for ${functionName} function."""
    
    def test_${functionName}_valid_input(self):
        """Test ${functionName} with valid input."""
        # Arrange
        valid_input = {"key": "value"}
        
        # Act
        result = ${functionName}(valid_input)
        
        # Assert
        assert result is not None
        assert isinstance(result, dict)
    
    def test_${functionName}_none_input(self):
        """Test ${functionName} handles None input gracefully."""
        with pytest.raises(ValueError):
            ${functionName}(None)
    
    def test_${functionName}_empty_input(self):
        """Test ${functionName} with empty input."""
        result = ${functionName}({})
        assert isinstance(result, dict)
    
    @pytest.mark.parametrize("invalid_input", [
        "string",
        123,
        [],
        True
    ])
    def test_${functionName}_invalid_types(self, invalid_input):
        """Test ${functionName} with various invalid input types."""
        with pytest.raises(TypeError):
            ${functionName}(invalid_input)
    
    @patch('external_dependency.method')
    def test_${functionName}_with_mocked_dependency(self, mock_method):
        """Test ${functionName} with mocked external dependency."""
        # Arrange
        mock_method.return_value = "mocked_result"
        test_input = {"dependency": True}
        
        # Act
        result = ${functionName}(test_input)
        
        # Assert
        mock_method.assert_called_once()
        assert "mocked_result" in str(result)
    
    def test_${functionName}_performance(self):
        """Test ${functionName} performance with large input."""
        import time
        large_input = {"data": list(range(1000))}
        
        start_time = time.time()
        result = ${functionName}(large_input)
        end_time = time.time()
        
        assert end_time - start_time < 1.0  # Should complete within 1 second
        assert result is not None`
  }

  const copyToClipboard = async () => {
    if (!generatedTests) return
    
    try {
      await navigator.clipboard.writeText(generatedTests.testCases)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Test cases copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const downloadTestFile = () => {
    if (!generatedTests) return
    
    const blob = new Blob([generatedTests.testCases], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = generatedTests.testFileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Test file downloaded!')
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Simple': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'Complex': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getLanguageFromFile = (filePath: string): 'javascript' | 'typescript' | 'python' => {
    const extension = filePath.split('.').pop()?.toLowerCase()
    
    if (extension === 'py') return 'python'
    if (extension === 'ts' || extension === 'tsx') return 'typescript'
    return 'javascript'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TestTube className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span>AI Test Case Generator</span>
              <Badge variant="secondary" className="ml-2">
                <Zap className="w-3 h-3 mr-1" />
                GPT-4 Powered
              </Badge>
            </div>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Generate comprehensive test cases for any function from your uploaded repository. Select a file and function to get started.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Debug Information */}
          {testableFiles.length === 0 && (
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      No testable files found
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      Make sure you've uploaded a repository with source code files (.js, .ts, .tsx, .jsx, .py, etc.)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* File and Function Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="file-select" className="block text-sm font-medium">
                Select File to Test ({testableFiles.length} available)
              </label>
              <Select value={selectedFile} onValueChange={handleFileSelect}>
                <SelectTrigger>
                  <SelectValue placeholder={
                    testableFiles.length > 0 
                      ? "Choose a file from your repository..." 
                      : "No testable files found"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {testableFiles.length > 0 ? (
                    testableFiles.map((file) => (
                      <SelectItem key={file} value={file}>
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span className="truncate">{file}</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-files" disabled>
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <AlertCircle className="w-4 h-4" />
                        <span>No testable files found</span>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="function-select" className="block text-sm font-medium">
                Select Function to Test
              </label>
              <Select 
                value={selectedFunction} 
                onValueChange={setSelectedFunction}
                disabled={!selectedFile || testableFiles.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    selectedFile 
                      ? "Choose a function..." 
                      : "Select a file first"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {functions.map((func) => (
                    <SelectItem key={func.name} value={func.name}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <Code className="w-4 h-4" />
                          <span>{func.name}</span>
                        </div>
                        <Badge variant="outline" className={`text-xs ml-2 ${getComplexityColor(func.complexity)}`}>
                          {func.complexity}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Function Details */}
          {selectedFunction && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-muted/50 rounded-lg border"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center space-x-2">
                    <span>{selectedFunction}</span>
                    <Badge variant="outline" className={getComplexityColor(functions.find(f => f.name === selectedFunction)?.complexity || 'Simple')}>
                      {functions.find(f => f.name === selectedFunction)?.complexity}
                    </Badge>
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {functions.find(f => f.name === selectedFunction)?.description}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <FileText className="w-3 h-3" />
                    <span>From: {selectedFile}</span>
                  </div>
                </div>
                <Button 
                  onClick={generateTests}
                  disabled={!selectedFile || !selectedFunction || isGenerating || testableFiles.length === 0}
                  className="flex items-center space-x-2"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>{isGenerating ? 'Generating...' : 'Generate Tests'}</span>
                </Button>
              </div>
            </motion.div>
          )}

          {/* Generated Tests */}
          {generatedTests && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="tests">Test Cases</TabsTrigger>
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                    <TabsTrigger value="coverage">Coverage</TabsTrigger>
                    <TabsTrigger value="playground">Live Playground</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {generatedTests.testFramework}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {generatedTests.confidence}% confidence
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="ml-2">{copied ? 'Copied!' : 'Copy'}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadTestFile}
                    >
                      <Download className="w-4 h-4" />
                      <span className="ml-2">Download</span>
                    </Button>
                  </div>
                </div>

                <TabsContent value="tests" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Generated Test Cases</h3>
                      <Badge variant="secondary">{generatedTests.testFileName}</Badge>
                    </div>
                    <Textarea
                      value={generatedTests.testCases}
                      readOnly
                      className="font-mono text-sm min-h-[500px] bg-muted"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Test Strategy</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {generatedTests.explanation}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Edge Cases Covered</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {generatedTests.edgeCases.map((edgeCase, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-primary rounded-full" />
                              <span className="text-sm">{edgeCase}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="coverage" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Test Coverage Areas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {generatedTests.coverage.map((area, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-sm font-medium">{area}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="playground" className="space-y-4">
                  <TestPlayground 
                    initialTestCode={generatedTests.testCases}
                    initialSourceCode=""
                    language={getLanguageFromFile(selectedFile)}
                    testFramework={generatedTests.testFramework as any}
                    fileName={selectedFile}
                    functionName={selectedFunction}
                  />
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
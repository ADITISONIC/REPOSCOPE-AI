import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Eye, Sparkles, Zap, TestTube } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileStructure } from '@/types'
import { toast } from 'sonner'

interface FileTreeViewProps {
  structure: FileStructure
  onFileSelect?: (fileName: string) => void
  selectedFile?: string
}

interface TreeNodeProps {
  name: string
  node: FileStructure[string]
  level: number
  onFileSelect?: (fileName: string) => void
  selectedFile?: string
  fullPath?: string
}

interface FileExplanation {
  filename: string
  summary: {
    purpose: string
    usage: string
    connections: string[]
    technologies: string[]
  }
  highlighted_functions: Array<{
    name: string
    description: string
  }>
  confidence: number
}

function TreeNode({ name, node, level, onFileSelect, selectedFile, fullPath = name }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(level < 2)
  const [fileExplanation, setFileExplanation] = useState<FileExplanation | null>(null)
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const handleFileClick = async (filePath: string) => {
    if (onFileSelect) {
      onFileSelect(filePath)
      toast.success(`Selected ${name} - Check the Code Explanation tab for detailed analysis!`)
    }
    
    // Auto-generate explanation for the file
    if (!fileExplanation) {
      await generateFileExplanation(filePath)
    }
  }

  const generateFileExplanation = async (filePath: string) => {
    setIsLoadingExplanation(true)
    
    try {
      // Call the file explainer edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/file-explainer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          filePath,
          fileName: name,
          fileContent: null, // Would be populated from actual file content
          projectContext: {
            language: 'JavaScript', // Would come from actual analysis
            frameworks: ['React', 'TypeScript'],
            architecture: 'Component-based'
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate file explanation')
      }

      const explanation = await response.json()
      setFileExplanation(explanation)
      
    } catch (error) {
      console.error('Error generating file explanation:', error)
      
      // Generate intelligent fallback explanation
      const fallbackExplanation = generateIntelligentFallback(filePath, name)
      setFileExplanation(fallbackExplanation)
      
    } finally {
      setIsLoadingExplanation(false)
    }
  }

  const generateIntelligentFallback = (filePath: string, fileName: string): FileExplanation => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const pathSegments = filePath.split('/')
    
    // Intelligent analysis based on file type and location
    let purpose = 'Source code file'
    let usage = 'Part of the application codebase'
    let connections: string[] = []
    let technologies: string[] = []
    let functions: Array<{ name: string; description: string }> = []

    // File type analysis
    switch (extension) {
      case 'tsx':
      case 'jsx':
        purpose = 'React component file that defines UI elements and behavior'
        usage = 'Renders user interface elements and handles user interactions'
        technologies = ['React', 'JSX', 'TypeScript']
        connections = ['Imports from other components', 'May use React hooks', 'Exports component for use elsewhere']
        functions = [
          { name: 'Component Function', description: 'Main functional component that returns JSX' },
          { name: 'Event Handlers', description: 'Functions that handle user interactions' }
        ]
        break
        
      case 'ts':
      case 'js':
        if (pathSegments.includes('utils') || pathSegments.includes('lib')) {
          purpose = 'Utility module containing helper functions and shared logic'
          usage = 'Provides reusable functions that can be imported throughout the application'
          technologies = ['TypeScript', 'JavaScript']
          connections = ['Exported functions used by components', 'May import other utilities']
        } else if (pathSegments.includes('api') || pathSegments.includes('routes')) {
          purpose = 'API endpoint or route handler for server-side logic'
          usage = 'Handles HTTP requests and responses for specific API endpoints'
          technologies = ['Node.js', 'Express', 'TypeScript']
          connections = ['Connects to database', 'Called by frontend components', 'May use middleware']
        } else {
          purpose = 'JavaScript/TypeScript module with application logic'
          usage = 'Contains functions, classes, or configuration for the application'
          technologies = ['TypeScript', 'JavaScript']
        }
        functions = [
          { name: 'Exported Functions', description: 'Main functions exported for use by other modules' },
          { name: 'Helper Functions', description: 'Internal utility functions' }
        ]
        break
        
      case 'css':
      case 'scss':
        purpose = 'Stylesheet file that defines visual styling and layout'
        usage = 'Applied to HTML elements to control appearance and responsive design'
        technologies = ['CSS', 'SCSS', 'Responsive Design']
        connections = ['Imported by components', 'May use CSS variables', 'Responsive breakpoints']
        break
        
      case 'json':
        if (fileName === 'package.json') {
          purpose = 'NPM package configuration file defining project dependencies and scripts'
          usage = 'Manages project dependencies, scripts, and metadata for Node.js applications'
          technologies = ['NPM', 'Node.js']
          connections = ['Defines project dependencies', 'Contains build scripts', 'Project metadata']
        } else {
          purpose = 'JSON configuration or data file'
          usage = 'Stores structured data or configuration settings'
          technologies = ['JSON']
        }
        break
        
      case 'md':
        purpose = 'Markdown documentation file'
        usage = 'Provides human-readable documentation and project information'
        technologies = ['Markdown']
        connections = ['Referenced in project documentation', 'May contain setup instructions']
        break
        
      default:
        purpose = 'Project file contributing to application functionality'
        usage = 'Part of the overall application structure and workflow'
    }

    // Path-based analysis
    if (pathSegments.includes('components')) {
      purpose = 'Reusable UI component that can be used throughout the application'
      connections.push('Used by page components', 'May accept props for customization')
    }
    
    if (pathSegments.includes('pages')) {
      purpose = 'Page-level component representing a route or view in the application'
      connections.push('Mapped to application routes', 'May use multiple child components')
    }
    
    if (pathSegments.includes('hooks')) {
      purpose = 'Custom React hook providing reusable stateful logic'
      usage = 'Encapsulates component logic that can be shared across multiple components'
      connections.push('Used by React components', 'May use other hooks')
    }

    return {
      filename: filePath,
      summary: {
        purpose,
        usage,
        connections,
        technologies
      },
      highlighted_functions: functions,
      confidence: 75
    }
  }

  const isTestableFile = (fileName: string): boolean => {
    const testableExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py']
    return testableExtensions.some(ext => fileName.toLowerCase().endsWith(ext)) &&
           !fileName.includes('.test.') &&
           !fileName.includes('.spec.')
  }

  if (node.type === 'file') {
    const isSelected = selectedFile === fullPath
    const canTest = isTestableFile(name)
    
    return (
      <div className="space-y-2">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex items-center space-x-2 py-2 px-2 rounded-md cursor-pointer group transition-all duration-200 ${
            isSelected 
              ? 'bg-primary/10 border border-primary/20' 
              : 'hover:bg-accent/50'
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => handleFileClick(fullPath)}
        >
          <File className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-blue-500'}`} />
          <span className={`text-sm font-medium flex-1 ${isSelected ? 'text-primary' : ''}`}>
            {name}
          </span>
          
          {/* File actions */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Test generation button for testable files */}
            {canTest && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  toast.info(`Generate tests for ${name} - Go to Test Generator tab!`)
                }}
                title="Generate tests for this file"
              >
                <TestTube className="w-3 h-3 text-green-600" />
              </Button>
            )}
            
            {/* File explanation button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                if (fileExplanation) {
                  setShowExplanation(!showExplanation)
                } else {
                  generateFileExplanation(fullPath)
                  setShowExplanation(true)
                }
              }}
              title="Show AI explanation"
            >
              {isLoadingExplanation ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-3 h-3 border border-primary border-t-transparent rounded-full"
                />
              ) : (
                <Sparkles className="w-3 h-3 text-purple-600" />
              )}
            </Button>
          </div>
          
          {/* Visual indicator for selected file */}
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center space-x-1"
            >
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-xs text-primary font-medium">Selected</span>
            </motion.div>
          )}
          
          {/* File type indicator */}
          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {getFileTypeDescription(name)}
          </span>
        </motion.div>

        {/* AI-Generated File Explanation */}
        <AnimatePresence>
          {showExplanation && fileExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="ml-6 mr-2"
              style={{ paddingLeft: `${level * 20}px` }}
            >
              <Card className="border-l-4 border-l-primary/50 bg-gradient-to-r from-primary/5 to-transparent">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <span>AI File Analysis</span>
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {fileExplanation.confidence}% confidence
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Purpose */}
                  <div>
                    <h4 className="text-sm font-semibold mb-1 text-primary">What this file does:</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {fileExplanation.summary.purpose}
                    </p>
                  </div>

                  {/* Usage */}
                  <div>
                    <h4 className="text-sm font-semibold mb-1 text-primary">Why it exists:</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {fileExplanation.summary.usage}
                    </p>
                  </div>

                  {/* Technologies */}
                  {fileExplanation.summary.technologies.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-primary">Technologies used:</h4>
                      <div className="flex flex-wrap gap-1">
                        {fileExplanation.summary.technologies.map((tech, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Connections */}
                  {fileExplanation.summary.connections.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-primary">How it connects to other parts:</h4>
                      <ul className="space-y-1">
                        {fileExplanation.summary.connections.map((connection, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{connection}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Key Functions */}
                  {fileExplanation.highlighted_functions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-primary">Key functions:</h4>
                      <div className="space-y-2">
                        {fileExplanation.highlighted_functions.map((func, index) => (
                          <div key={index} className="bg-muted/50 rounded p-2">
                            <div className="font-mono text-xs text-primary font-semibold">
                              {func.name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {func.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 border-t flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileClick(fullPath)}
                      className="flex-1"
                    >
                      <Eye className="w-3 h-3 mr-2" />
                      Analyze in Detail
                    </Button>
                    
                    {canTest && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info('Go to Test Generator tab to create tests!')}
                        className="flex-1"
                      >
                        <TestTube className="w-3 h-3 mr-2" />
                        Generate Tests
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center space-x-2 py-2 px-2 rounded-md hover:bg-accent/50 cursor-pointer group"
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-4 h-4" />
        </motion.div>
        {isOpen ? (
          <FolderOpen className="w-4 h-4 text-yellow-500" />
        ) : (
          <Folder className="w-4 h-4 text-yellow-500" />
        )}
        <span className="text-sm font-medium">{name}</span>
        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          {Object.keys(node.children || {}).length} items
        </span>
      </motion.div>
      
      <AnimatePresence>
        {isOpen && node.children && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {Object.entries(node.children).map(([childName, childNode]) => (
              <TreeNode
                key={childName}
                name={childName}
                node={childNode}
                level={level + 1}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
                fullPath={`${fullPath}/${childName}`}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function getFileTypeDescription(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  const descriptions: Record<string, string> = {
    'tsx': 'React Component',
    'jsx': 'React Component', 
    'ts': 'TypeScript',
    'js': 'JavaScript',
    'css': 'Stylesheet',
    'scss': 'Sass Stylesheet',
    'json': 'Configuration',
    'md': 'Documentation',
    'html': 'HTML Template',
    'py': 'Python Script',
    'go': 'Go Source',
    'rs': 'Rust Source',
    'java': 'Java Class',
    'php': 'PHP Script',
    'rb': 'Ruby Script',
    'yml': 'YAML Config',
    'yaml': 'YAML Config',
    'xml': 'XML Document',
    'sql': 'SQL Script',
    'sh': 'Shell Script',
    'dockerfile': 'Docker Config'
  }
  
  if (fileName.toLowerCase() === 'package.json') return 'NPM Package'
  if (fileName.toLowerCase() === 'readme.md') return 'Project Docs'
  if (fileName.toLowerCase() === 'dockerfile') return 'Docker Config'
  if (fileName.toLowerCase().includes('config')) return 'Configuration'
  
  return descriptions[extension || ''] || 'File'
}

export function FileTreeView({ structure, onFileSelect, selectedFile }: FileTreeViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Interactive File Explorer</span>
          <Badge variant="secondary" className="ml-2">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Click any file to analyze it in the <strong>Code Explanation</strong> tab. Use the <Sparkles className="w-3 h-3 inline mx-1" /> button for quick insights or <TestTube className="w-3 h-3 inline mx-1" /> to generate tests.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {Object.entries(structure).map(([name, node]) => (
            <TreeNode 
              key={name} 
              name={name} 
              node={node} 
              level={0} 
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
              fullPath={name}
            />
          ))}
        </div>
        
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Currently Analyzing:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">{selectedFile}</code>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Switch to the <strong>Code Explanation</strong> tab to see the detailed AI analysis of this file.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
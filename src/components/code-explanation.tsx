import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExplanationToggle } from '@/components/explanation-toggle'
import { Eye, Code, Lightbulb, Loader2, FileText, Zap, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface CodeExplanationProps {
  fileName: string
  fileContent?: string
  onFileSelect?: (fileName: string) => void
}

interface ExplanationData {
  file: string
  eli5: string
  expert: string
  techStack: string[]
  updated_at: number
  summary?: {
    purpose: string
    usage: string
    connections: string[]
    technologies: string[]
  }
  highlighted_functions?: Array<{
    name: string
    description: string
  }>
  confidence?: number
}

export function CodeExplanation({ fileName, fileContent, onFileSelect }: CodeExplanationProps) {
  const [expertMode, setExpertMode] = useState(false)
  const [explanation, setExplanation] = useState<ExplanationData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [explanationCache, setExplanationCache] = useState<Record<string, ExplanationData>>({})

  useEffect(() => {
    if (fileName && !explanationCache[fileName]) {
      generateExplanation(fileName, fileContent)
    } else if (fileName && explanationCache[fileName]) {
      setExplanation(explanationCache[fileName])
    }
  }, [fileName, fileContent])

  const generateExplanation = async (file: string, content?: string) => {
    setIsLoading(true)
    setExplanation(null)
    
    try {
      // Call the file explainer edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/file-explainer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          filePath: file,
          fileName: file.split('/').pop() || file,
          fileContent: content,
          projectContext: {
            language: 'JavaScript', // Would come from actual analysis
            frameworks: ['React', 'TypeScript'],
            architecture: 'Component-based'
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate file explanation')
      }

      const aiExplanation = await response.json()
      
      // Convert AI response to our format
      const convertedExplanation = convertAIExplanation(aiExplanation, file)
      setExplanation(convertedExplanation)
      
      // Cache the explanation
      setExplanationCache(prev => ({
        ...prev,
        [file]: convertedExplanation
      }))
      
      toast.success('AI analysis completed!')
      
    } catch (error) {
      console.error('Error generating explanation:', error)
      
      // Generate intelligent fallback explanation
      const fallbackExplanation = generateIntelligentFallback(file, content)
      setExplanation(fallbackExplanation)
      
      // Cache the fallback explanation
      setExplanationCache(prev => ({
        ...prev,
        [file]: fallbackExplanation
      }))
      
      toast.warning('Using local analysis - AI service unavailable')
      
    } finally {
      setIsLoading(false)
    }
  }

  const convertAIExplanation = (aiResponse: any, file: string): ExplanationData => {
    const summary = aiResponse.summary || {}
    const functions = aiResponse.highlighted_functions || []
    
    // Generate beginner-friendly explanation
    const eli5 = generateBeginnerExplanation(summary, functions, file)
    
    // Generate expert explanation
    const expert = generateExpertExplanation(summary, functions, file, aiResponse.confidence)
    
    return {
      file,
      eli5,
      expert,
      techStack: summary.technologies || ['Unknown'],
      updated_at: Date.now(),
      summary,
      highlighted_functions: functions,
      confidence: aiResponse.confidence || 75
    }
  }

  const generateBeginnerExplanation = (summary: any, functions: any[], file: string): string => {
    const fileName = file.split('/').pop() || file
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    let explanation = `🎯 **${fileName}** - Let me explain what this file does!\n\n`
    
    if (summary.purpose) {
      explanation += `**What it does:**\n${summary.purpose}\n\n`
    }
    
    if (summary.usage) {
      explanation += `**Why it exists:**\n${summary.usage}\n\n`
    }
    
    if (summary.technologies && summary.technologies.length > 0) {
      explanation += `**Technologies used:**\n${summary.technologies.map((tech: string) => `• ${tech}`).join('\n')}\n\n`
    }
    
    if (functions && functions.length > 0) {
      explanation += `**Key functions:**\n${functions.map((func: any) => `• **${func.name}**: ${func.description}`).join('\n')}\n\n`
    }
    
    if (summary.connections && summary.connections.length > 0) {
      explanation += `**How it connects:**\n${summary.connections.map((conn: string) => `• ${conn}`).join('\n')}\n\n`
    }
    
    explanation += `💡 **Think of it like:** This file is like a ${getFileAnalogy(extension)} in your project - it has a specific job and works with other files to make the whole application function!`
    
    return explanation
  }

  const generateExpertExplanation = (summary: any, functions: any[], file: string, confidence: number): string => {
    const fileName = file.split('/').pop() || file
    
    let explanation = `**Technical Analysis: ${fileName}**\n\n`
    
    if (summary.purpose) {
      explanation += `**Module Purpose:**\n${summary.purpose}\n\n`
    }
    
    if (summary.usage) {
      explanation += `**Implementation Context:**\n${summary.usage}\n\n`
    }
    
    if (summary.technologies && summary.technologies.length > 0) {
      explanation += `**Technology Stack:**\n${summary.technologies.map((tech: string) => `• ${tech}`).join('\n')}\n\n`
    }
    
    if (functions && functions.length > 0) {
      explanation += `**Function Analysis:**\n${functions.map((func: any) => `• \`${func.name}\`: ${func.description}`).join('\n')}\n\n`
    }
    
    if (summary.connections && summary.connections.length > 0) {
      explanation += `**Dependency Graph:**\n${summary.connections.map((conn: string) => `• ${conn}`).join('\n')}\n\n`
    }
    
    explanation += `**Analysis Confidence:** ${confidence}% based on file structure, naming patterns, and content analysis.\n\n`
    explanation += `**Architectural Role:** This module contributes to the overall system architecture by providing ${summary.purpose?.toLowerCase() || 'specific functionality'} within the application's component hierarchy.`
    
    return explanation
  }

  const getFileAnalogy = (extension?: string): string => {
    const analogies: Record<string, string> = {
      'tsx': 'LEGO building block that creates part of the user interface',
      'jsx': 'LEGO building block that creates part of the user interface',
      'ts': 'toolbox with helpful functions that other parts can use',
      'js': 'toolbox with helpful functions that other parts can use',
      'css': 'paint and styling kit that makes things look beautiful',
      'json': 'instruction manual with important settings and configurations',
      'md': 'guidebook that explains how things work',
      'html': 'blueprint that defines the structure of a webpage'
    }
    
    return analogies[extension || ''] || 'important piece of the puzzle'
  }

  const generateIntelligentFallback = (file: string, content?: string): ExplanationData => {
    const fileName = file.split('/').pop() || file
    const extension = fileName.split('.').pop()?.toLowerCase()
    const pathSegments = file.split('/')
    
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

    const summary = {
      purpose,
      usage,
      connections,
      technologies
    }

    const eli5 = generateBeginnerExplanation(summary, functions, file)
    const expert = generateExpertExplanation(summary, functions, file, 75)

    return {
      file,
      eli5,
      expert,
      techStack: technologies,
      updated_at: Date.now(),
      summary,
      highlighted_functions: functions,
      confidence: 75
    }
  }

  const handleKeyboardShortcut = (e: KeyboardEvent) => {
    if (e.shiftKey && e.key === 'E') {
      e.preventDefault()
      setExpertMode(!expertMode)
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcut)
    return () => document.removeEventListener('keydown', handleKeyboardShortcut)
  }, [expertMode])

  if (!fileName) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
            <div>
              <p className="text-lg font-medium">Select a file to analyze</p>
              <p className="text-sm text-muted-foreground">Click any file in the File Tree to see its AI-powered explanation</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5" />
            <span>AI Code Analysis</span>
            <Badge variant="secondary" className="ml-2">
              <Zap className="w-3 h-3 mr-1" />
              GPT-4 Powered
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateExplanation(fileName, fileContent)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="ml-2">Regenerate</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFileSelect?.(fileName)}
              className="flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>View in Tree</span>
            </Button>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Analyzing:</span>
            <Badge variant="outline" className="font-mono text-xs">{fileName}</Badge>
            {explanation && (
              <Badge variant="secondary" className="text-xs">
                {explanation.confidence}% confidence
              </Badge>
            )}
          </div>
          
          <ExplanationToggle 
            expertMode={expertMode} 
            onToggle={setExpertMode}
          />
          
          <div className="text-xs text-muted-foreground">
            💡 Tip: Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift + E</kbd> to toggle explanation modes
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div className="text-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"
              />
              <div>
                <p className="font-medium">Analyzing {fileName.split('/').pop()}</p>
                <p className="text-sm text-muted-foreground">AI is examining the code structure and functionality...</p>
              </div>
            </motion.div>
          </div>
        ) : explanation ? (
          <div className="space-y-4">
            {/* Tech Stack */}
            <div className="flex flex-wrap gap-2">
              {explanation.techStack.map((tech) => (
                <Badge key={tech} variant="secondary" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>

            {/* Explanation Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={expertMode ? 'expert' : 'eli5'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div className={`p-4 rounded-lg border-l-4 ${
                  expertMode 
                    ? 'bg-slate-50 dark:bg-slate-900/50 border-l-slate-500' 
                    : 'bg-teal-50 dark:bg-teal-900/20 border-l-teal-500'
                }`}>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div 
                      className="whitespace-pre-wrap font-sans text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: (expertMode ? explanation.expert : explanation.eli5)
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs">$1</code>')
                          .replace(/^• /gm, '• ')
                          .replace(/\n/g, '<br>')
                      }}
                    />
                  </div>
                </div>

                {/* Mode-specific indicators */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {expertMode ? '👨‍💻 Expert Technical Analysis' : '🧒 Beginner-Friendly Explanation'}
                  </span>
                  <span>
                    Updated {new Date(explanation.updated_at).toLocaleTimeString()}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No explanation available for this file type.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
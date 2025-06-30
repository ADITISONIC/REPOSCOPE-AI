import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Play, 
  Terminal, 
  Folder, 
  Lightbulb, 
  CheckCircle,
  Copy,
  Download,
  RefreshCw,
  Loader2,
  Zap,
  ArrowRight,
  Code,
  Globe,
  Settings,
  FileText,
  ExternalLink,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RepoData } from '@/types'
import { toast } from 'sonner'

interface TutorialGeneratorProps {
  repoData: RepoData
}

interface TutorialWalkthrough {
  id: string
  title: string
  description: string
  estimatedTime: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  prerequisites: string[]
  sections: TutorialSection[]
  troubleshooting: TroubleshootingItem[]
  additionalResources: Resource[]
  generatedAt: Date
}

interface TutorialSection {
  id: string
  title: string
  description: string
  steps: TutorialStep[]
  icon: string
}

interface TutorialStep {
  id: string
  title: string
  description: string
  commands?: string[]
  codeSnippets?: CodeSnippet[]
  notes?: string[]
  expectedOutput?: string
  troubleshooting?: string[]
}

interface CodeSnippet {
  language: string
  code: string
  filename?: string
}

interface TroubleshootingItem {
  problem: string
  solution: string
  commands?: string[]
}

interface Resource {
  title: string
  url: string
  description: string
}

const TUTORIAL_STORAGE_KEY = 'tutorial_walkthrough_cache'

export function TutorialGenerator({ repoData }: TutorialGeneratorProps) {
  const [tutorial, setTutorial] = useState<TutorialWalkthrough | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedStep, setCopiedStep] = useState<string | null>(null)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [activeSection, setActiveSection] = useState<string>('')

  // Load cached tutorial on mount
  useEffect(() => {
    loadCachedTutorial()
  }, [repoData])

  // Auto-generate tutorial if not cached
  useEffect(() => {
    if (!tutorial && !isGenerating) {
      generateTutorial()
    }
  }, [tutorial, isGenerating])

  const loadCachedTutorial = () => {
    try {
      const cacheKey = `${TUTORIAL_STORAGE_KEY}_${repoData.owner}_${repoData.name}`
      const cached = localStorage.getItem(cacheKey)
      
      if (cached) {
        const parsedTutorial = JSON.parse(cached)
        // Check if cache is less than 24 hours old
        const cacheAge = Date.now() - new Date(parsedTutorial.generatedAt).getTime()
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours
        
        if (cacheAge < maxAge) {
          setTutorial({
            ...parsedTutorial,
            generatedAt: new Date(parsedTutorial.generatedAt)
          })
          
          // Load completed steps
          const completedKey = `${cacheKey}_completed`
          const completedSteps = localStorage.getItem(completedKey)
          if (completedSteps) {
            setCompletedSteps(new Set(JSON.parse(completedSteps)))
          }
          
          return
        }
      }
    } catch (error) {
      console.error('Failed to load cached tutorial:', error)
    }
  }

  const saveTutorialToCache = (tutorialData: TutorialWalkthrough) => {
    try {
      const cacheKey = `${TUTORIAL_STORAGE_KEY}_${repoData.owner}_${repoData.name}`
      localStorage.setItem(cacheKey, JSON.stringify(tutorialData))
    } catch (error) {
      console.error('Failed to save tutorial to cache:', error)
    }
  }

  const saveCompletedSteps = (steps: Set<string>) => {
    try {
      const cacheKey = `${TUTORIAL_STORAGE_KEY}_${repoData.owner}_${repoData.name}_completed`
      localStorage.setItem(cacheKey, JSON.stringify(Array.from(steps)))
    } catch (error) {
      console.error('Failed to save completed steps:', error)
    }
  }

  const generateTutorial = async () => {
    setIsGenerating(true)
    
    try {
      // Call the tutorial generator edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutorial-generator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          repoData: {
            name: repoData.name,
            owner: repoData.owner,
            description: repoData.description,
            techStack: repoData.techStack,
            techStackDetailed: repoData.techStackDetailed,
            structure: repoData.structure,
            analysis: repoData.analysis
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate tutorial')
      }

      const tutorialData = await response.json()
      setTutorial(tutorialData)
      saveTutorialToCache(tutorialData)
      
      toast.success('Tutorial walkthrough generated successfully!')
      
    } catch (error) {
      console.error('Error generating tutorial:', error)
      
      // Generate intelligent fallback tutorial
      const fallbackTutorial = generateFallbackTutorial()
      setTutorial(fallbackTutorial)
      saveTutorialToCache(fallbackTutorial)
      
      toast.warning('Using local tutorial generation - AI service unavailable')
      
    } finally {
      setIsGenerating(false)
    }
  }

  const generateFallbackTutorial = (): TutorialWalkthrough => {
    const { techStackDetailed } = repoData
    
    const sections: TutorialSection[] = [
      {
        id: 'setup',
        title: 'Environment Setup',
        description: 'Install required dependencies and tools',
        icon: '🛠️',
        steps: [
          {
            id: 'install-node',
            title: 'Install Node.js',
            description: 'Install Node.js and npm package manager',
            commands: ['# Download from https://nodejs.org/', 'node --version', 'npm --version'],
            notes: ['Ensure Node.js version 16 or higher', 'npm comes bundled with Node.js']
          },
          {
            id: 'clone-repo',
            title: 'Clone Repository',
            description: 'Clone the project repository to your local machine',
            commands: [`git clone ${repoData.url}`, `cd ${repoData.name}`],
            expectedOutput: 'Repository cloned successfully'
          }
        ]
      },
      {
        id: 'dependencies',
        title: 'Install Dependencies',
        description: 'Install project dependencies and packages',
        icon: '📦',
        steps: [
          {
            id: 'install-deps',
            title: 'Install NPM Dependencies',
            description: 'Install all required packages listed in package.json',
            commands: ['npm install'],
            expectedOutput: 'Dependencies installed successfully',
            troubleshooting: [
              'If installation fails, try: npm cache clean --force',
              'For permission errors on macOS/Linux: sudo npm install'
            ]
          }
        ]
      },
      {
        id: 'development',
        title: 'Development Server',
        description: 'Start the development environment',
        icon: '🚀',
        steps: [
          {
            id: 'start-dev',
            title: 'Start Development Server',
            description: 'Launch the development server with hot reload',
            commands: ['npm run dev'],
            expectedOutput: 'Development server running on http://localhost:3000',
            notes: ['Server will automatically reload when you make changes']
          }
        ]
      }
    ]

    // Add framework-specific sections
    if (techStackDetailed.frontend) {
      sections.push({
        id: 'frontend',
        title: 'Frontend Development',
        description: `Working with ${techStackDetailed.frontend}`,
        icon: '🎨',
        steps: [
          {
            id: 'open-browser',
            title: 'Open in Browser',
            description: 'View the application in your web browser',
            commands: ['# Open http://localhost:3000 in your browser'],
            notes: ['The page should load and display the application interface']
          }
        ]
      })
    }

    if (techStackDetailed.backend) {
      sections.push({
        id: 'backend',
        title: 'Backend Development',
        description: `Working with ${techStackDetailed.backend}`,
        icon: '⚙️',
        steps: [
          {
            id: 'test-api',
            title: 'Test API Endpoints',
            description: 'Verify backend API is working correctly',
            commands: ['curl http://localhost:3000/api/health'],
            expectedOutput: '{"status": "ok"}'
          }
        ]
      })
    }

    return {
      id: `tutorial_${Date.now()}`,
      title: `${repoData.name} - Development Guide`,
      description: `Complete walkthrough for setting up and running ${repoData.name} locally`,
      estimatedTime: '15-30 minutes',
      difficulty: 'Beginner',
      prerequisites: [
        'Basic command line knowledge',
        'Git installed on your system',
        'Text editor or IDE'
      ],
      sections,
      troubleshooting: [
        {
          problem: 'Port already in use error',
          solution: 'Kill the process using the port or use a different port',
          commands: ['lsof -ti:3000 | xargs kill -9', 'npm run dev -- --port 3001']
        },
        {
          problem: 'Module not found errors',
          solution: 'Reinstall dependencies and clear cache',
          commands: ['rm -rf node_modules package-lock.json', 'npm install']
        }
      ],
      additionalResources: [
        {
          title: 'Project Documentation',
          url: `${repoData.url}#readme`,
          description: 'Official project README and documentation'
        },
        {
          title: `${techStackDetailed.language} Documentation`,
          url: techStackDetailed.language === 'TypeScript' ? 'https://www.typescriptlang.org/docs/' : 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
          description: `Official ${techStackDetailed.language} documentation and guides`
        }
      ],
      generatedAt: new Date()
    }
  }

  const copyToClipboard = async (text: string, stepId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStep(stepId)
      setTimeout(() => setCopiedStep(null), 2000)
      toast.success('Copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const toggleStepCompletion = (stepId: string) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId)
    } else {
      newCompleted.add(stepId)
    }
    setCompletedSteps(newCompleted)
    saveCompletedSteps(newCompleted)
  }

  const downloadTutorial = () => {
    if (!tutorial) return
    
    const tutorialText = generateTutorialMarkdown(tutorial)
    const blob = new Blob([tutorialText], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${repoData.name}-tutorial.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Tutorial downloaded as Markdown!')
  }

  const generateTutorialMarkdown = (tutorial: TutorialWalkthrough): string => {
    let markdown = `# ${tutorial.title}\n\n`
    markdown += `${tutorial.description}\n\n`
    markdown += `**Estimated Time:** ${tutorial.estimatedTime}\n`
    markdown += `**Difficulty:** ${tutorial.difficulty}\n\n`
    
    markdown += `## Prerequisites\n\n`
    tutorial.prerequisites.forEach(prereq => {
      markdown += `- ${prereq}\n`
    })
    markdown += '\n'
    
    tutorial.sections.forEach(section => {
      markdown += `## ${section.icon} ${section.title}\n\n`
      markdown += `${section.description}\n\n`
      
      section.steps.forEach((step, index) => {
        markdown += `### Step ${index + 1}: ${step.title}\n\n`
        markdown += `${step.description}\n\n`
        
        if (step.commands) {
          markdown += '```bash\n'
          step.commands.forEach(cmd => {
            markdown += `${cmd}\n`
          })
          markdown += '```\n\n'
        }
        
        if (step.notes) {
          markdown += '**Notes:**\n'
          step.notes.forEach(note => {
            markdown += `- ${note}\n`
          })
          markdown += '\n'
        }
      })
    })
    
    return markdown
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getProgressPercentage = () => {
    if (!tutorial) return 0
    const totalSteps = tutorial.sections.reduce((total, section) => total + section.steps.length, 0)
    return totalSteps > 0 ? (completedSteps.size / totalSteps) * 100 : 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>Tutorial Walkthrough</span>
                  <Badge variant="secondary" className="ml-2">
                    <Zap className="w-3 h-3 mr-1" />
                    AI-Generated
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Step-by-step guide to build and run this project locally
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={generateTutorial}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="ml-2">{isGenerating ? 'Generating...' : 'Regenerate'}</span>
              </Button>
              
              {tutorial && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTutorial}
                >
                  <Download className="w-4 h-4" />
                  <span className="ml-2">Download</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Loading State */}
      {isGenerating && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <motion.div className="text-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"
              />
              <div>
                <p className="font-medium">Generating Tutorial Walkthrough</p>
                <p className="text-sm text-muted-foreground">
                  Creating step-by-step instructions for {repoData.name}...
                </p>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      )}

      {/* Tutorial Content */}
      {tutorial && !isGenerating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Tutorial Overview */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{tutorial.title}</h2>
                    <p className="text-muted-foreground">{tutorial.description}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>{tutorial.estimatedTime}</span>
                    </div>
                    <Badge variant="outline" className={getDifficultyColor(tutorial.difficulty)}>
                      {tutorial.difficulty}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{completedSteps.size} of {tutorial.sections.reduce((total, section) => total + section.steps.length, 0)} steps completed</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(getProgressPercentage())}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-primary h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgressPercentage()}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Prerequisites</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {tutorial.prerequisites.map((prereq, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-3 h-3 mt-1 text-green-500" />
                          <span>{prereq}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tutorial Sections */}
          <Tabs value={activeSection || tutorial.sections[0]?.id} onValueChange={setActiveSection}>
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              {tutorial.sections.map((section) => (
                <TabsTrigger key={section.id} value={section.id} className="flex items-center space-x-2">
                  <span>{section.icon}</span>
                  <span className="hidden sm:inline">{section.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {tutorial.sections.map((section) => (
              <TabsContent key={section.id} value={section.id} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span className="text-2xl">{section.icon}</span>
                      <span>{section.title}</span>
                    </CardTitle>
                    <p className="text-muted-foreground">{section.description}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {section.steps.map((step, stepIndex) => (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: stepIndex * 0.1 }}
                        className={`p-6 rounded-lg border-2 transition-all ${
                          completedSteps.has(step.id) 
                            ? 'border-green-200 bg-green-50 dark:bg-green-950/30' 
                            : 'border-border bg-card'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              completedSteps.has(step.id)
                                ? 'bg-green-500 text-white'
                                : 'bg-primary text-primary-foreground'
                            }`}>
                              {completedSteps.has(step.id) ? '✓' : stepIndex + 1}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{step.title}</h3>
                              <p className="text-muted-foreground">{step.description}</p>
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleStepCompletion(step.id)}
                            className={completedSteps.has(step.id) ? 'bg-green-100 text-green-800' : ''}
                          >
                            {completedSteps.has(step.id) ? 'Completed' : 'Mark Complete'}
                          </Button>
                        </div>
                        
                        {/* Commands */}
                        {step.commands && (
                          <div className="space-y-2">
                            <h4 className="font-medium flex items-center space-x-2">
                              <Terminal className="w-4 h-4" />
                              <span>Commands</span>
                            </h4>
                            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                              {step.commands.map((command, cmdIndex) => (
                                <div key={cmdIndex} className="flex items-center justify-between group">
                                  <code className="flex-1">{command}</code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => copyToClipboard(command, `${step.id}_${cmdIndex}`)}
                                  >
                                    {copiedStep === `${step.id}_${cmdIndex}` ? (
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Expected Output */}
                        {step.expectedOutput && (
                          <div className="space-y-2">
                            <h4 className="font-medium flex items-center space-x-2">
                              <Play className="w-4 h-4" />
                              <span>Expected Output</span>
                            </h4>
                            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                              <code className="text-sm text-green-800 dark:text-green-200">
                                {step.expectedOutput}
                              </code>
                            </div>
                          </div>
                        )}
                        
                        {/* Notes */}
                        {step.notes && (
                          <div className="space-y-2">
                            <h4 className="font-medium flex items-center space-x-2">
                              <Lightbulb className="w-4 h-4" />
                              <span>Notes</span>
                            </h4>
                            <ul className="space-y-1">
                              {step.notes.map((note, noteIndex) => (
                                <li key={noteIndex} className="flex items-start space-x-2 text-sm">
                                  <ArrowRight className="w-3 h-3 mt-1 text-blue-500" />
                                  <span>{note}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Troubleshooting */}
                        {step.troubleshooting && (
                          <div className="space-y-2">
                            <h4 className="font-medium flex items-center space-x-2">
                              <Settings className="w-4 h-4" />
                              <span>Troubleshooting</span>
                            </h4>
                            <ul className="space-y-1">
                              {step.troubleshooting.map((tip, tipIndex) => (
                                <li key={tipIndex} className="flex items-start space-x-2 text-sm text-yellow-700 dark:text-yellow-300">
                                  <ArrowRight className="w-3 h-3 mt-1 text-yellow-500" />
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Troubleshooting Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Common Issues & Solutions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tutorial.troubleshooting.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-red-600 mb-2">Problem: {item.problem}</h4>
                    <p className="text-sm mb-3">{item.solution}</p>
                    {item.commands && (
                      <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm">
                        {item.commands.map((cmd, cmdIndex) => (
                          <div key={cmdIndex}>{cmd}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ExternalLink className="w-5 h-5" />
                <span>Additional Resources</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tutorial.additionalResources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <h4 className="font-semibold mb-1">{resource.title}</h4>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
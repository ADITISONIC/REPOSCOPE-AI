import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Monitor, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Copy, 
  Download, 
  RefreshCw, 
  Loader2, 
  Zap, 
  Terminal, 
  Database, 
  Globe, 
  Key, 
  Package, 
  Settings,
  ExternalLink,
  Info,
  Lightbulb
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { RepoData } from '@/types'
import { toast } from 'sonner'

interface DevEnvironmentDetectorProps {
  repoData: RepoData
}

interface EnvironmentRequirement {
  id: string
  name: string
  version?: string
  status: 'required' | 'optional' | 'detected' | 'missing'
  category: 'runtime' | 'database' | 'service' | 'tool' | 'env_var'
  description: string
  installCommand?: string
  verifyCommand?: string
  detectionSource: string
  priority: 'high' | 'medium' | 'low'
  documentation?: string
}

interface EnvironmentAnalysis {
  requirements: EnvironmentRequirement[]
  summary: {
    totalRequirements: number
    requiredCount: number
    optionalCount: number
    detectedCount: number
    missingCount: number
  }
  setupInstructions: string
  dockerAlternative?: {
    available: boolean
    instructions: string
  }
  estimatedSetupTime: string
  lastAnalyzed: Date
}

export function DevEnvironmentDetector({ repoData }: DevEnvironmentDetectorProps) {
  const [analysis, setAnalysis] = useState<EnvironmentAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [copiedInstructions, setCopiedInstructions] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    // Auto-analyze when component mounts
    analyzeEnvironment()
  }, [repoData])

  const analyzeEnvironment = async () => {
    setIsAnalyzing(true)
    
    try {
      // Call the dev environment analyzer edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dev-environment-analyzer`, {
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
            structure: repoData.structure
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to analyze development environment')
      }

      const environmentData = await response.json()
      setAnalysis(environmentData)
      toast.success('Development environment analysis completed!')
      
    } catch (error) {
      console.error('Error analyzing development environment:', error)
      
      // Generate intelligent fallback analysis
      const fallbackAnalysis = generateFallbackAnalysis(repoData)
      setAnalysis(fallbackAnalysis)
      toast.warning('Using local environment analysis - AI service unavailable')
      
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateFallbackAnalysis = (repoData: RepoData): EnvironmentAnalysis => {
    const requirements: EnvironmentRequirement[] = []
    const structure = repoData.structure
    const techStack = repoData.techStackDetailed

    // Language runtime detection
    if (techStack.language === 'JavaScript' || techStack.language === 'TypeScript') {
      const nodeVersion = detectNodeVersion(structure)
      requirements.push({
        id: 'nodejs',
        name: 'Node.js',
        version: nodeVersion || '18.x',
        status: 'required',
        category: 'runtime',
        description: 'JavaScript runtime environment',
        installCommand: 'Download from https://nodejs.org/',
        verifyCommand: 'node --version',
        detectionSource: nodeVersion ? '.nvmrc or package.json engines' : 'Tech stack analysis',
        priority: 'high',
        documentation: 'https://nodejs.org/en/docs/'
      })

      requirements.push({
        id: 'npm',
        name: 'npm',
        version: '8.x+',
        status: 'required',
        category: 'tool',
        description: 'Node.js package manager',
        verifyCommand: 'npm --version',
        detectionSource: 'Bundled with Node.js',
        priority: 'high'
      })
    }

    if (techStack.language === 'Python') {
      requirements.push({
        id: 'python',
        name: 'Python',
        version: '3.8+',
        status: 'required',
        category: 'runtime',
        description: 'Python programming language',
        installCommand: 'Download from https://python.org/',
        verifyCommand: 'python --version',
        detectionSource: 'Tech stack analysis',
        priority: 'high',
        documentation: 'https://docs.python.org/'
      })

      if (checkForFile(structure, 'requirements.txt') || checkForFile(structure, 'pyproject.toml')) {
        requirements.push({
          id: 'pip',
          name: 'pip',
          status: 'required',
          category: 'tool',
          description: 'Python package installer',
          verifyCommand: 'pip --version',
          detectionSource: 'requirements.txt detected',
          priority: 'high'
        })
      }
    }

    // Database detection
    if (techStack.database) {
      const dbRequirement = createDatabaseRequirement(techStack.database)
      if (dbRequirement) requirements.push(dbRequirement)
    }

    // Environment variables detection
    const envVars = detectEnvironmentVariables(structure)
    envVars.forEach(envVar => requirements.push(envVar))

    // Development tools
    if (checkForFile(structure, 'docker-compose.yml') || checkForFile(structure, 'Dockerfile')) {
      requirements.push({
        id: 'docker',
        name: 'Docker',
        status: 'optional',
        category: 'tool',
        description: 'Containerization platform (alternative to manual setup)',
        installCommand: 'Download from https://docker.com/',
        verifyCommand: 'docker --version',
        detectionSource: 'Docker configuration files detected',
        priority: 'medium',
        documentation: 'https://docs.docker.com/'
      })
    }

    // Git (always required)
    requirements.push({
      id: 'git',
      name: 'Git',
      status: 'required',
      category: 'tool',
      description: 'Version control system',
      installCommand: 'Download from https://git-scm.com/',
      verifyCommand: 'git --version',
      detectionSource: 'Required for repository cloning',
      priority: 'high',
      documentation: 'https://git-scm.com/doc'
    })

    // Calculate summary
    const summary = {
      totalRequirements: requirements.length,
      requiredCount: requirements.filter(r => r.status === 'required').length,
      optionalCount: requirements.filter(r => r.status === 'optional').length,
      detectedCount: requirements.filter(r => r.status === 'detected').length,
      missingCount: requirements.filter(r => r.status === 'missing').length
    }

    // Generate setup instructions
    const setupInstructions = generateSetupInstructions(requirements, techStack)

    // Check for Docker alternative
    const dockerAlternative = {
      available: checkForFile(structure, 'docker-compose.yml') || checkForFile(structure, 'Dockerfile'),
      instructions: dockerAlternative ? 'Run `docker-compose up` to start all services automatically' : ''
    }

    return {
      requirements,
      summary,
      setupInstructions,
      dockerAlternative,
      estimatedSetupTime: calculateSetupTime(requirements),
      lastAnalyzed: new Date()
    }
  }

  const detectNodeVersion = (structure: any): string | null => {
    // Check for .nvmrc file
    if (checkForFile(structure, '.nvmrc')) {
      return 'v18.17.0' // Default assumption
    }
    return null
  }

  const checkForFile = (structure: any, fileName: string, path: string = ''): boolean => {
    for (const [name, node] of Object.entries(structure)) {
      if (name.toLowerCase() === fileName.toLowerCase()) {
        return true
      }
      
      if ((node as any).type === 'folder' && (node as any).children) {
        if (checkForFile((node as any).children, fileName, path + '/' + name)) {
          return true
        }
      }
    }
    return false
  }

  const createDatabaseRequirement = (database: string): EnvironmentRequirement | null => {
    const dbMap: Record<string, Partial<EnvironmentRequirement>> = {
      'MongoDB': {
        installCommand: 'Download from https://mongodb.com/try/download/community',
        verifyCommand: 'mongod --version',
        documentation: 'https://docs.mongodb.com/'
      },
      'PostgreSQL': {
        installCommand: 'Download from https://postgresql.org/download/',
        verifyCommand: 'psql --version',
        documentation: 'https://postgresql.org/docs/'
      },
      'MySQL': {
        installCommand: 'Download from https://mysql.com/downloads/',
        verifyCommand: 'mysql --version',
        documentation: 'https://dev.mysql.com/doc/'
      },
      'Redis': {
        installCommand: 'Download from https://redis.io/download',
        verifyCommand: 'redis-server --version',
        documentation: 'https://redis.io/documentation'
      }
    }

    const dbInfo = dbMap[database]
    if (!dbInfo) return null

    return {
      id: database.toLowerCase(),
      name: database,
      status: 'required',
      category: 'database',
      description: `${database} database server`,
      priority: 'high',
      detectionSource: 'Tech stack analysis',
      ...dbInfo
    } as EnvironmentRequirement
  }

  const detectEnvironmentVariables = (structure: any): EnvironmentRequirement[] => {
    const envVars: EnvironmentRequirement[] = []
    
    // Common environment variables based on tech stack
    if (checkForFile(structure, '.env.example') || checkForFile(structure, '.env')) {
      envVars.push({
        id: 'env-file',
        name: '.env file',
        status: 'required',
        category: 'env_var',
        description: 'Environment configuration file with required variables',
        detectionSource: '.env.example or .env file detected',
        priority: 'high'
      })
    }

    return envVars
  }

  const generateSetupInstructions = (requirements: EnvironmentRequirement[], techStack: any): string => {
    const requiredItems = requirements.filter(r => r.status === 'required')
    
    let instructions = `# ${repoData.name} - Development Environment Setup\n\n`
    instructions += `## Prerequisites Checklist\n\n`
    
    requiredItems.forEach((req, index) => {
      instructions += `${index + 1}. **${req.name}**${req.version ? ` (${req.version})` : ''}\n`
      if (req.installCommand) {
        instructions += `   - Install: ${req.installCommand}\n`
      }
      if (req.verifyCommand) {
        instructions += `   - Verify: \`${req.verifyCommand}\`\n`
      }
      instructions += `   - ${req.description}\n\n`
    })

    instructions += `## Quick Setup Commands\n\n`
    instructions += `\`\`\`bash\n`
    instructions += `# Clone the repository\n`
    instructions += `git clone ${repoData.url || `https://github.com/${repoData.owner}/${repoData.name}`}\n`
    instructions += `cd ${repoData.name}\n\n`

    if (techStack.language === 'JavaScript' || techStack.language === 'TypeScript') {
      instructions += `# Install dependencies\n`
      instructions += `npm install\n\n`
      instructions += `# Start development server\n`
      instructions += `npm run dev\n`
    } else if (techStack.language === 'Python') {
      instructions += `# Create virtual environment\n`
      instructions += `python -m venv venv\n`
      instructions += `source venv/bin/activate  # On Windows: venv\\Scripts\\activate\n\n`
      instructions += `# Install dependencies\n`
      instructions += `pip install -r requirements.txt\n\n`
      instructions += `# Start development server\n`
      instructions += `python manage.py runserver  # Django\n`
      instructions += `# OR\n`
      instructions += `flask run  # Flask\n`
    }

    instructions += `\`\`\`\n`

    return instructions
  }

  const calculateSetupTime = (requirements: EnvironmentRequirement[]): string => {
    const requiredCount = requirements.filter(r => r.status === 'required').length
    
    if (requiredCount <= 3) return '10-15 minutes'
    if (requiredCount <= 6) return '20-30 minutes'
    return '30-45 minutes'
  }

  const copyInstructions = async () => {
    if (!analysis) return
    
    try {
      await navigator.clipboard.writeText(analysis.setupInstructions)
      setCopiedInstructions(true)
      setTimeout(() => setCopiedInstructions(false), 2000)
      toast.success('Setup instructions copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const downloadInstructions = () => {
    if (!analysis) return
    
    const blob = new Blob([analysis.setupInstructions], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${repoData.name}-setup-guide.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Setup guide downloaded!')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'required': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'detected': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'optional': return <Info className="w-4 h-4 text-blue-500" />
      case 'missing': return <X className="w-4 h-4 text-red-500" />
      default: return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'required': return 'border-red-200 bg-red-50 dark:bg-red-950/30'
      case 'detected': return 'border-green-200 bg-green-50 dark:bg-green-950/30'
      case 'optional': return 'border-blue-200 bg-blue-50 dark:bg-blue-950/30'
      case 'missing': return 'border-red-200 bg-red-50 dark:bg-red-950/30'
      default: return 'border-gray-200 bg-gray-50 dark:bg-gray-950/30'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'runtime': return <Terminal className="w-4 h-4" />
      case 'database': return <Database className="w-4 h-4" />
      case 'service': return <Globe className="w-4 h-4" />
      case 'tool': return <Settings className="w-4 h-4" />
      case 'env_var': return <Key className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  const filteredRequirements = analysis?.requirements.filter(req => 
    selectedCategory === 'all' || req.category === selectedCategory
  ) || []

  const categories = [
    { id: 'all', label: 'All Requirements', icon: Package },
    { id: 'runtime', label: 'Runtime', icon: Terminal },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'tool', label: 'Tools', icon: Settings },
    { id: 'env_var', label: 'Environment', icon: Key },
    { id: 'service', label: 'Services', icon: Globe }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Monitor className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>Development Environment</span>
                  <Badge variant="secondary" className="ml-2">
                    <Zap className="w-3 h-3 mr-1" />
                    Smart Detection
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Required tools, dependencies, and configuration for local development
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={analyzeEnvironment}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="ml-2">{isAnalyzing ? 'Analyzing...' : 'Re-analyze'}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Loading State */}
      {isAnalyzing && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <motion.div className="text-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"
              />
              <div>
                <p className="font-medium">Analyzing Development Environment</p>
                <p className="text-sm text-muted-foreground">
                  Detecting dependencies, tools, and configuration requirements...
                </p>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && !isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{analysis.summary.requiredCount}</div>
                <div className="text-sm text-muted-foreground">Required</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{analysis.summary.optionalCount}</div>
                <div className="text-sm text-muted-foreground">Optional</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{analysis.summary.detectedCount}</div>
                <div className="text-sm text-muted-foreground">Auto-detected</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{analysis.estimatedSetupTime}</div>
                <div className="text-sm text-muted-foreground">Setup Time</div>
              </CardContent>
            </Card>
          </div>

          {/* Docker Alternative */}
          {analysis.dockerAlternative?.available && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      🐳 Docker Alternative Available
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      Skip manual setup and use Docker to run everything automatically:
                    </p>
                    <div className="bg-blue-900 text-blue-100 p-3 rounded font-mono text-sm">
                      docker-compose up
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Requirements Checklist */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Environment Checklist</span>
                </CardTitle>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyInstructions}
                  >
                    {copiedInstructions ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span className="ml-2">{copiedInstructions ? 'Copied!' : 'Copy Setup'}</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadInstructions}
                  >
                    <Download className="w-4 h-4" />
                    <span className="ml-2">Download</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                  {categories.map((category) => {
                    const count = analysis.requirements.filter(r => 
                      category.id === 'all' || r.category === category.id
                    ).length
                    
                    return (
                      <TabsTrigger key={category.id} value={category.id} className="flex items-center space-x-1">
                        <category.icon className="w-3 h-3" />
                        <span className="hidden sm:inline">{category.label}</span>
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {count}
                        </Badge>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                <div className="mt-6 space-y-3">
                  <AnimatePresence>
                    {filteredRequirements.map((requirement, index) => (
                      <motion.div
                        key={requirement.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 rounded-lg border-2 ${getStatusColor(requirement.status)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(requirement.status)}
                              {getCategoryIcon(requirement.category)}
                            </div>
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold">
                                  {requirement.name}
                                  {requirement.version && (
                                    <span className="text-sm font-normal text-muted-foreground ml-2">
                                      {requirement.version}
                                    </span>
                                  )}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {requirement.status}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {requirement.priority} priority
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground">
                                {requirement.description}
                              </p>
                              
                              <div className="flex flex-wrap gap-2 text-xs">
                                {requirement.installCommand && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="secondary" className="cursor-help">
                                          📦 Install: {requirement.installCommand.substring(0, 30)}...
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="max-w-xs">{requirement.installCommand}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                
                                {requirement.verifyCommand && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="secondary" className="cursor-help">
                                          ✅ Verify: {requirement.verifyCommand}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Run this command to verify installation</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                
                                <Badge variant="outline" className="text-xs">
                                  Detected: {requirement.detectionSource}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {requirement.documentation && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a
                                href={requirement.documentation}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span className="text-xs">Docs</span>
                              </a>
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5" />
                <span>Quick Setup Guide</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre className="whitespace-pre-wrap">{analysis.setupInstructions}</pre>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
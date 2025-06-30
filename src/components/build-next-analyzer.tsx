import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Lightbulb, 
  TestTube, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Code, 
  GitBranch, 
  Settings, 
  Trash2,
  Filter,
  BarChart3,
  Loader2,
  RefreshCw,
  Eye,
  ArrowRight,
  Target,
  Zap,
  Bug,
  Shield,
  Rocket,
  BookOpen,
  Wrench
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { RepoData } from '@/types'
import { BuildNextKanban } from '@/components/build-next-kanban'
import { toast } from 'sonner'

interface BuildNextAnalyzerProps {
  repoData: RepoData
}

interface BuildSuggestion {
  id: string
  title: string
  description: string
  category: 'tests' | 'ci-cd' | 'cleanup' | 'todos' | 'documentation' | 'security' | 'performance'
  priority: 'high' | 'medium' | 'low'
  effort: 'small' | 'medium' | 'large'
  impact: 'high' | 'medium' | 'low'
  files: string[]
  reasoning: string
  actionItems: string[]
  estimatedTime: string
  status: 'todo' | 'in-progress' | 'done'
}

interface AnalysisResult {
  suggestions: BuildSuggestion[]
  summary: {
    totalIssues: number
    highPriority: number
    estimatedHours: number
    categories: Record<string, number>
  }
  codeHealth: {
    score: number
    breakdown: {
      testCoverage: number
      documentation: number
      codeQuality: number
      maintenance: number
    }
  }
}

export function BuildNextAnalyzer({ repoData }: BuildNextAnalyzerProps) {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [selectedSuggestion, setSelectedSuggestion] = useState<BuildSuggestion | null>(null)

  useEffect(() => {
    // Auto-analyze when component mounts
    analyzeRepository()
  }, [repoData])

  const analyzeRepository = async () => {
    setIsAnalyzing(true)
    
    try {
      // Simulate analysis - in real implementation, this would call an edge function
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockAnalysis = generateMockAnalysis(repoData)
      setAnalysisResult(mockAnalysis)
      
      toast.success(`Found ${mockAnalysis.suggestions.length} improvement suggestions!`)
      
    } catch (error) {
      console.error('Error analyzing repository:', error)
      toast.error('Failed to analyze repository')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateMockAnalysis = (repoData: RepoData): AnalysisResult => {
    const suggestions: BuildSuggestion[] = []
    
    // Analyze file structure for missing tests
    const sourceFiles = extractSourceFiles(repoData.structure)
    const testFiles = extractTestFiles(repoData.structure)
    
    // Generate test-related suggestions
    sourceFiles.forEach((file, index) => {
      if (index < 3 && !hasCorrespondingTest(file, testFiles)) {
        suggestions.push({
          id: `test-${index}`,
          title: `Add unit tests for ${file.split('/').pop()}`,
          description: `No tests found for critical source file. This file contains important business logic that should be tested.`,
          category: 'tests',
          priority: file.includes('api') || file.includes('utils') ? 'high' : 'medium',
          effort: 'medium',
          impact: 'high',
          files: [file],
          reasoning: `Testing is crucial for maintaining code quality and preventing regressions. This file appears to contain important logic based on its location and naming.`,
          actionItems: [
            `Create test file: ${file.replace(/\.(ts|js|tsx|jsx)$/, '.test.$1')}`,
            'Write unit tests for main functions',
            'Add edge case testing',
            'Ensure 80%+ code coverage'
          ],
          estimatedTime: '2-4 hours',
          status: 'todo'
        })
      }
    })

    // Check for CI/CD
    if (!hasCI(repoData.structure)) {
      suggestions.push({
        id: 'ci-cd-setup',
        title: 'Set up CI/CD pipeline',
        description: 'No continuous integration detected. Adding CI/CD will improve code quality and deployment reliability.',
        category: 'ci-cd',
        priority: 'high',
        effort: 'medium',
        impact: 'high',
        files: ['.github/workflows/ci.yml'],
        reasoning: 'CI/CD is essential for modern development workflows. It ensures code quality, runs tests automatically, and enables reliable deployments.',
        actionItems: [
          'Create GitHub Actions workflow',
          'Add automated testing on PR',
          'Set up build and deployment steps',
          'Configure environment variables'
        ],
        estimatedTime: '3-5 hours',
        status: 'todo'
      })
    }

    // Check for documentation
    if (!hasReadme(repoData.structure)) {
      suggestions.push({
        id: 'readme-docs',
        title: 'Create comprehensive README.md',
        description: 'Missing or incomplete project documentation. Good documentation improves developer onboarding and project maintainability.',
        category: 'documentation',
        priority: 'medium',
        effort: 'small',
        impact: 'medium',
        files: ['README.md'],
        reasoning: 'Documentation is the first thing developers see. A good README explains what the project does, how to set it up, and how to contribute.',
        actionItems: [
          'Add project description and purpose',
          'Include installation instructions',
          'Document API endpoints or usage',
          'Add contributing guidelines'
        ],
        estimatedTime: '1-2 hours',
        status: 'todo'
      })
    }

    // Check for TypeScript configuration
    if (repoData.techStackDetailed.language === 'JavaScript' && !hasTypeScript(repoData.structure)) {
      suggestions.push({
        id: 'typescript-migration',
        title: 'Migrate to TypeScript',
        description: 'Consider migrating to TypeScript for better type safety and developer experience.',
        category: 'cleanup',
        priority: 'medium',
        effort: 'large',
        impact: 'high',
        files: ['tsconfig.json', 'package.json'],
        reasoning: 'TypeScript provides static type checking, better IDE support, and helps catch errors at compile time rather than runtime.',
        actionItems: [
          'Install TypeScript dependencies',
          'Create tsconfig.json configuration',
          'Gradually migrate .js files to .ts',
          'Add type definitions for external libraries'
        ],
        estimatedTime: '8-16 hours',
        status: 'todo'
      })
    }

    // Check for linting
    if (!hasLinting(repoData.structure)) {
      suggestions.push({
        id: 'eslint-setup',
        title: 'Set up ESLint for code quality',
        description: 'No linting configuration detected. ESLint helps maintain consistent code style and catch potential issues.',
        category: 'cleanup',
        priority: 'medium',
        effort: 'small',
        impact: 'medium',
        files: ['.eslintrc.js', 'package.json'],
        reasoning: 'Linting tools help maintain code quality, consistency, and catch potential bugs before they reach production.',
        actionItems: [
          'Install ESLint and relevant plugins',
          'Configure linting rules',
          'Add lint script to package.json',
          'Set up pre-commit hooks'
        ],
        estimatedTime: '1-2 hours',
        status: 'todo'
      })
    }

    // Security suggestions
    suggestions.push({
      id: 'security-audit',
      title: 'Run security audit on dependencies',
      description: 'Regular security audits help identify and fix vulnerabilities in project dependencies.',
      category: 'security',
      priority: 'high',
      effort: 'small',
      impact: 'high',
      files: ['package.json'],
      reasoning: 'Security vulnerabilities in dependencies are a common attack vector. Regular audits help maintain a secure codebase.',
      actionItems: [
        'Run npm audit or yarn audit',
        'Update vulnerable dependencies',
        'Set up automated security scanning',
        'Review and update security policies'
      ],
      estimatedTime: '30 minutes - 2 hours',
      status: 'todo'
    })

    // Performance suggestions
    if (repoData.techStackDetailed.frontend) {
      suggestions.push({
        id: 'performance-optimization',
        title: 'Optimize bundle size and performance',
        description: 'Analyze and optimize application performance, including bundle size, loading times, and runtime performance.',
        category: 'performance',
        priority: 'medium',
        effort: 'medium',
        impact: 'medium',
        files: ['webpack.config.js', 'vite.config.ts'],
        reasoning: 'Performance optimization improves user experience and can significantly impact user engagement and conversion rates.',
        actionItems: [
          'Analyze bundle size with webpack-bundle-analyzer',
          'Implement code splitting and lazy loading',
          'Optimize images and assets',
          'Add performance monitoring'
        ],
        estimatedTime: '4-8 hours',
        status: 'todo'
      })
    }

    // Calculate summary
    const summary = {
      totalIssues: suggestions.length,
      highPriority: suggestions.filter(s => s.priority === 'high').length,
      estimatedHours: suggestions.reduce((total, s) => {
        const hours = s.estimatedTime.match(/(\d+)/g)
        return total + (hours ? parseInt(hours[0]) : 2)
      }, 0),
      categories: suggestions.reduce((acc, s) => {
        acc[s.category] = (acc[s.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    // Calculate code health score
    const codeHealth = {
      score: Math.max(20, 100 - (suggestions.length * 10)),
      breakdown: {
        testCoverage: hasTests(repoData.structure) ? 75 : 30,
        documentation: hasReadme(repoData.structure) ? 80 : 40,
        codeQuality: hasLinting(repoData.structure) ? 85 : 60,
        maintenance: hasCI(repoData.structure) ? 90 : 50
      }
    }

    return { suggestions, summary, codeHealth }
  }

  // Helper functions for analysis
  const extractSourceFiles = (structure: any, basePath: string = ''): string[] => {
    const files: string[] = []
    
    for (const [name, node] of Object.entries(structure)) {
      const currentPath = basePath ? `${basePath}/${name}` : name
      
      if ((node as any).type === 'file') {
        if (['.ts', '.js', '.tsx', '.jsx'].some(ext => name.endsWith(ext)) && 
            !name.includes('.test.') && !name.includes('.spec.')) {
          files.push(currentPath)
        }
      } else if ((node as any).type === 'folder' && (node as any).children) {
        files.push(...extractSourceFiles((node as any).children, currentPath))
      }
    }
    
    return files
  }

  const extractTestFiles = (structure: any, basePath: string = ''): string[] => {
    const files: string[] = []
    
    for (const [name, node] of Object.entries(structure)) {
      const currentPath = basePath ? `${basePath}/${name}` : name
      
      if ((node as any).type === 'file') {
        if (name.includes('.test.') || name.includes('.spec.')) {
          files.push(currentPath)
        }
      } else if ((node as any).type === 'folder' && (node as any).children) {
        files.push(...extractTestFiles((node as any).children, currentPath))
      }
    }
    
    return files
  }

  const hasCorrespondingTest = (sourceFile: string, testFiles: string[]): boolean => {
    const baseName = sourceFile.replace(/\.(ts|js|tsx|jsx)$/, '')
    return testFiles.some(testFile => testFile.includes(baseName))
  }

  const hasCI = (structure: any): boolean => {
    return checkForFile(structure, '.github/workflows') || 
           checkForFile(structure, '.gitlab-ci.yml') ||
           checkForFile(structure, 'azure-pipelines.yml')
  }

  const hasReadme = (structure: any): boolean => {
    return checkForFile(structure, 'README.md') || checkForFile(structure, 'readme.md')
  }

  const hasTypeScript = (structure: any): boolean => {
    return checkForFile(structure, 'tsconfig.json')
  }

  const hasLinting = (structure: any): boolean => {
    return checkForFile(structure, '.eslintrc') || 
           checkForFile(structure, '.eslintrc.js') ||
           checkForFile(structure, '.eslintrc.json')
  }

  const hasTests = (structure: any): boolean => {
    return extractTestFiles(structure).length > 0
  }

  const checkForFile = (structure: any, fileName: string, basePath: string = ''): boolean => {
    for (const [name, node] of Object.entries(structure)) {
      const currentPath = basePath ? `${basePath}/${name}` : name
      
      if (name === fileName || currentPath.includes(fileName)) {
        return true
      }
      
      if ((node as any).type === 'folder' && (node as any).children) {
        if (checkForFile((node as any).children, fileName, currentPath)) {
          return true
        }
      }
    }
    return false
  }

  const filteredSuggestions = analysisResult?.suggestions.filter(suggestion => {
    if (filterCategory !== 'all' && suggestion.category !== filterCategory) return false
    if (filterPriority !== 'all' && suggestion.priority !== filterPriority) return false
    return true
  }) || []

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tests': return TestTube
      case 'ci-cd': return GitBranch
      case 'cleanup': return Wrench
      case 'todos': return Clock
      case 'documentation': return BookOpen
      case 'security': return Shield
      case 'performance': return Rocket
      default: return Lightbulb
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tests': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'ci-cd': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'cleanup': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'todos': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'documentation': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
      case 'security': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'performance': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const updateSuggestionStatus = (suggestionId: string, newStatus: BuildSuggestion['status']) => {
    if (!analysisResult) return
    
    const updatedSuggestions = analysisResult.suggestions.map(s => 
      s.id === suggestionId ? { ...s, status: newStatus } : s
    )
    
    setAnalysisResult({
      ...analysisResult,
      suggestions: updatedSuggestions
    })
    
    toast.success(`Updated suggestion status to ${newStatus}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>What Should I Build Next?</span>
                  <Badge variant="secondary" className="ml-2">
                    <Zap className="w-3 h-3 mr-1" />
                    AI-Powered
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Intelligent analysis of your repository to identify improvement opportunities
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={analyzeRepository}
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
                <p className="font-medium">Analyzing Repository Structure</p>
                <p className="text-sm text-muted-foreground">
                  Scanning for improvement opportunities...
                </p>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {analysisResult && !isAnalyzing && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{analysisResult.summary.totalIssues}</p>
                    <p className="text-sm text-muted-foreground">Total Suggestions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Bug className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold">{analysisResult.summary.highPriority}</p>
                    <p className="text-sm text-muted-foreground">High Priority</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{analysisResult.summary.estimatedHours}h</p>
                    <p className="text-sm text-muted-foreground">Estimated Work</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{analysisResult.codeHealth.score}%</p>
                    <p className="text-sm text-muted-foreground">Code Health</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Code Health Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Code Health Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(analysisResult.codeHealth.breakdown).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span>{value}%</span>
                    </div>
                    <Progress value={value} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Filters and View Toggle */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filters:</span>
                  </div>
                  
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="tests">Tests</SelectItem>
                      <SelectItem value="ci-cd">CI/CD</SelectItem>
                      <SelectItem value="cleanup">Code Cleanup</SelectItem>
                      <SelectItem value="documentation">Documentation</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    List View
                  </Button>
                  <Button
                    variant={viewMode === 'kanban' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('kanban')}
                  >
                    Kanban Board
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suggestions Display */}
          {viewMode === 'list' ? (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredSuggestions.map((suggestion, index) => {
                  const CategoryIcon = getCategoryIcon(suggestion.category)
                  
                  return (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center space-x-3">
                                <CategoryIcon className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold text-lg">{suggestion.title}</h3>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className={getCategoryColor(suggestion.category)}>
                                    {suggestion.category}
                                  </Badge>
                                  <Badge variant="outline" className={getPriorityColor(suggestion.priority)}>
                                    {suggestion.priority} priority
                                  </Badge>
                                  <Badge variant="outline">
                                    {suggestion.effort} effort
                                  </Badge>
                                </div>
                              </div>
                              
                              <p className="text-muted-foreground">{suggestion.description}</p>
                              
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {suggestion.estimatedTime}
                                </span>
                                <span className="flex items-center">
                                  <FileText className="w-4 h-4 mr-1" />
                                  {suggestion.files.length} file(s)
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap gap-2">
                                {suggestion.files.slice(0, 3).map((file) => (
                                  <Badge key={file} variant="secondary" className="text-xs">
                                    {file}
                                  </Badge>
                                ))}
                                {suggestion.files.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{suggestion.files.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedSuggestion(suggestion)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Details
                              </Button>
                              
                              <Select
                                value={suggestion.status}
                                onValueChange={(value) => updateSuggestionStatus(suggestion.id, value as BuildSuggestion['status'])}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="todo">To Do</SelectItem>
                                  <SelectItem value="in-progress">In Progress</SelectItem>
                                  <SelectItem value="done">Done</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              
              {filteredSuggestions.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <h3 className="text-lg font-semibold mb-2">No suggestions found!</h3>
                    <p className="text-muted-foreground">
                      {filterCategory !== 'all' || filterPriority !== 'all' 
                        ? 'Try adjusting your filters to see more suggestions.'
                        : 'Your repository looks great! All major areas are well covered.'
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <BuildNextKanban 
              suggestions={filteredSuggestions}
              onUpdateStatus={updateSuggestionStatus}
              onSelectSuggestion={setSelectedSuggestion}
            />
          )}

          {/* Suggestion Detail Modal */}
          {selectedSuggestion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedSuggestion(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-background rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">{selectedSuggestion.title}</h2>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSuggestion(null)}>
                      ×
                    </Button>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">{selectedSuggestion.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Reasoning</h3>
                    <p className="text-muted-foreground">{selectedSuggestion.reasoning}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Action Items</h3>
                    <ul className="space-y-2">
                      {selectedSuggestion.actionItems.map((item, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <ArrowRight className="w-4 h-4 mt-0.5 text-primary" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Affected Files</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSuggestion.files.map((file) => (
                        <Badge key={file} variant="secondary">
                          {file}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Estimated: {selectedSuggestion.estimatedTime}</span>
                      <span>Impact: {selectedSuggestion.impact}</span>
                      <span>Effort: {selectedSuggestion.effort}</span>
                    </div>
                    
                    <Select
                      value={selectedSuggestion.status}
                      onValueChange={(value) => {
                        updateSuggestionStatus(selectedSuggestion.id, value as BuildSuggestion['status'])
                        setSelectedSuggestion({ ...selectedSuggestion, status: value as BuildSuggestion['status'] })
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
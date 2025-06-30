import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  Shield, 
  TestTube, 
  FileText, 
  Settings, 
  GitBranch,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap,
  Target,
  RefreshCw,
  Loader2,
  Award,
  BarChart3,
  Lightbulb
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RepoData } from '@/types'
import { toast } from 'sonner'

interface RepoHealthAnalyzerProps {
  repoData: RepoData
}

interface HealthScore {
  overall: number
  breakdown: {
    testCoverage: number
    readmeQuality: number
    linterPresence: number
    ciCdPresence: number
    codeQuality: number
    security: number
  }
  summary: {
    testCoverage: string
    readme: string
    linter: string
    ciCd: string
    codeQuality: string
    security: string
  }
  aiTips: string[]
  lastUpdated: Date
}

export function RepoHealthAnalyzer({ repoData }: RepoHealthAnalyzerProps) {
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Auto-analyze when component mounts
    analyzeRepoHealth()
  }, [repoData])

  const analyzeRepoHealth = async () => {
    setIsAnalyzing(true)
    setError(null)
    
    try {
      // Call the repo health analyzer edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/repo-health-analyzer`, {
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
        throw new Error(errorData.error || 'Failed to analyze repository health')
      }

      const healthData = await response.json()
      setHealthScore(healthData)
      toast.success('Repository health analysis completed!')
      
    } catch (error) {
      console.error('Error analyzing repository health:', error)
      
      // Generate intelligent fallback analysis
      const fallbackHealth = generateFallbackHealthScore(repoData)
      setHealthScore(fallbackHealth)
      toast.warning('Using local health analysis - AI service unavailable')
      
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateFallbackHealthScore = (repoData: RepoData): HealthScore => {
    const structure = repoData.structure
    const techStack = repoData.techStackDetailed
    
    // Analyze test coverage
    const hasTests = checkForTests(structure)
    const testCoverage = hasTests ? 75 : 25
    const testSummary = hasTests ? 
      'Good — Test files detected in project structure' : 
      'Low — No test files found, consider adding unit tests'

    // Analyze README quality
    const hasReadme = checkForReadme(structure)
    const readmeQuality = hasReadme ? 85 : 30
    const readmeSummary = hasReadme ? 
      'Excellent — README.md found with project documentation' : 
      'Poor — No README.md found, add project documentation'

    // Analyze linter presence
    const hasLinter = checkForLinter(structure)
    const linterPresence = hasLinter ? 90 : 40
    const linterSummary = hasLinter ? 
      'Excellent — Code linting configuration detected' : 
      'Missing — Add ESLint or similar linting tools'

    // Analyze CI/CD presence
    const hasCiCd = checkForCiCd(structure)
    const ciCdPresence = hasCiCd ? 95 : 20
    const ciCdSummary = hasCiCd ? 
      'Excellent — CI/CD pipeline configuration found' : 
      'Missing — Set up GitHub Actions or similar CI/CD'

    // Analyze code quality
    const hasTypeScript = techStack.language === 'TypeScript'
    const codeQuality = hasTypeScript ? 80 : 60
    const codeQualitySummary = hasTypeScript ? 
      'Good — TypeScript provides type safety' : 
      'Fair — Consider TypeScript for better type safety'

    // Analyze security
    const hasSecurityConfig = checkForSecurity(structure)
    const security = hasSecurityConfig ? 70 : 50
    const securitySummary = hasSecurityConfig ? 
      'Good — Security configurations detected' : 
      'Fair — Consider adding security scanning and policies'

    // Calculate overall score
    const overall = Math.round(
      (testCoverage + readmeQuality + linterPresence + ciCdPresence + codeQuality + security) / 6
    )

    // Generate AI tips
    const aiTips = generateHealthTips(
      hasTests, hasReadme, hasLinter, hasCiCd, hasTypeScript, hasSecurityConfig, techStack
    )

    return {
      overall,
      breakdown: {
        testCoverage,
        readmeQuality,
        linterPresence,
        ciCdPresence,
        codeQuality,
        security
      },
      summary: {
        testCoverage: testSummary,
        readme: readmeSummary,
        linter: linterSummary,
        ciCd: ciCdSummary,
        codeQuality: codeQualitySummary,
        security: securitySummary
      },
      aiTips,
      lastUpdated: new Date()
    }
  }

  const checkForTests = (structure: any): boolean => {
    return checkStructureForPatterns(structure, ['test', 'spec', '__tests__', 'cypress', 'e2e'])
  }

  const checkForReadme = (structure: any): boolean => {
    return checkStructureForFiles(structure, ['README.md', 'readme.md', 'README.txt'])
  }

  const checkForLinter = (structure: any): boolean => {
    return checkStructureForFiles(structure, [
      '.eslintrc', '.eslintrc.js', '.eslintrc.json', '.eslintrc.yml',
      '.prettierrc', '.prettierrc.js', '.prettierrc.json',
      'tslint.json', '.jshintrc'
    ])
  }

  const checkForCiCd = (structure: any): boolean => {
    return checkStructureForPatterns(structure, ['.github/workflows', '.gitlab-ci', 'azure-pipelines', 'jenkins', '.circleci'])
  }

  const checkForSecurity = (structure: any): boolean => {
    return checkStructureForFiles(structure, [
      '.nvmrc', 'SECURITY.md', '.snyk', 'dependabot.yml',
      '.github/dependabot.yml', '.github/security.yml'
    ])
  }

  const checkStructureForPatterns = (structure: any, patterns: string[], path: string = ''): boolean => {
    for (const [name, node] of Object.entries(structure)) {
      const currentPath = path ? `${path}/${name}` : name
      
      if (patterns.some(pattern => currentPath.toLowerCase().includes(pattern.toLowerCase()))) {
        return true
      }
      
      if ((node as any).type === 'folder' && (node as any).children) {
        if (checkStructureForPatterns((node as any).children, patterns, currentPath)) {
          return true
        }
      }
    }
    return false
  }

  const checkStructureForFiles = (structure: any, files: string[]): boolean => {
    for (const [name] of Object.entries(structure)) {
      if (files.some(file => name.toLowerCase() === file.toLowerCase())) {
        return true
      }
    }
    return false
  }

  const generateHealthTips = (
    hasTests: boolean,
    hasReadme: boolean,
    hasLinter: boolean,
    hasCiCd: boolean,
    hasTypeScript: boolean,
    hasSecurityConfig: boolean,
    techStack: any
  ): string[] => {
    const tips = []

    if (!hasTests) {
      tips.push('Add unit tests using Jest, Vitest, or your preferred testing framework')
      tips.push('Aim for at least 70% code coverage on critical business logic')
    }

    if (!hasReadme) {
      tips.push('Create a comprehensive README.md with setup instructions and usage examples')
      tips.push('Include badges for build status, coverage, and version information')
    }

    if (!hasLinter) {
      tips.push('Set up ESLint and Prettier for consistent code formatting')
      tips.push('Add pre-commit hooks to enforce code quality standards')
    }

    if (!hasCiCd) {
      tips.push('Implement GitHub Actions for automated testing and deployment')
      tips.push('Set up branch protection rules requiring CI checks to pass')
    }

    if (!hasTypeScript && (techStack.language === 'JavaScript')) {
      tips.push('Consider migrating to TypeScript for better type safety and developer experience')
    }

    if (!hasSecurityConfig) {
      tips.push('Enable Dependabot for automated dependency updates')
      tips.push('Add security scanning with tools like Snyk or GitHub Security')
    }

    // Framework-specific tips
    if (techStack.frontend === 'React') {
      tips.push('Consider using React Testing Library for component testing')
      tips.push('Implement error boundaries for better error handling')
    }

    if (techStack.backend) {
      tips.push('Add API documentation using OpenAPI/Swagger')
      tips.push('Implement proper error handling and logging')
    }

    return tips.slice(0, 8) // Limit to 8 tips
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreGrade = (score: number): string => {
    if (score >= 90) return 'A+'
    if (score >= 80) return 'A'
    if (score >= 70) return 'B'
    if (score >= 60) return 'C'
    if (score >= 50) return 'D'
    return 'F'
  }

  const getScoreDescription = (score: number): string => {
    if (score >= 90) return 'Excellent - Production ready with best practices'
    if (score >= 80) return 'Very Good - Well maintained with minor improvements needed'
    if (score >= 70) return 'Good - Solid foundation with some areas for improvement'
    if (score >= 60) return 'Fair - Basic setup with several improvement opportunities'
    if (score >= 50) return 'Poor - Needs significant improvements for production use'
    return 'Critical - Major issues that need immediate attention'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>Repository Health Score</span>
                  <Badge variant="secondary" className="ml-2">
                    <Zap className="w-3 h-3 mr-1" />
                    AI-Powered Analysis
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Comprehensive analysis of code quality, testing, and best practices
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={analyzeRepoHealth}
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
                <p className="font-medium">Analyzing Repository Health</p>
                <p className="text-sm text-muted-foreground">
                  Evaluating code quality, testing, and best practices...
                </p>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      )}

      {/* Health Score Results */}
      {healthScore && !isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Overall Score */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-purple/10 rounded-full -translate-y-16 translate-x-16" />
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Overall Health Score</h2>
                  <p className="text-muted-foreground">
                    Last updated: {healthScore.lastUpdated.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getScoreColor(healthScore.overall)}`}>
                    {healthScore.overall}
                  </div>
                  <div className="text-lg font-semibold text-muted-foreground">
                    Grade: {getScoreGrade(healthScore.overall)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2 max-w-xs">
                    {getScoreDescription(healthScore.overall)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'testCoverage', label: 'Test Coverage', icon: TestTube, color: 'text-green-600' },
              { key: 'readmeQuality', label: 'Documentation', icon: FileText, color: 'text-blue-600' },
              { key: 'linterPresence', label: 'Code Quality', icon: Settings, color: 'text-purple-600' },
              { key: 'ciCdPresence', label: 'CI/CD Pipeline', icon: GitBranch, color: 'text-orange-600' },
              { key: 'codeQuality', label: 'Type Safety', icon: Shield, color: 'text-indigo-600' },
              { key: 'security', label: 'Security', icon: Shield, color: 'text-red-600' }
            ].map(({ key, label, icon: Icon, color }) => {
              const score = healthScore.breakdown[key as keyof typeof healthScore.breakdown]
              const summary = healthScore.summary[key as keyof typeof healthScore.summary]
              
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800`}>
                          <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{label}</h3>
                          <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                            {score}%
                          </div>
                        </div>
                      </div>
                      
                      <Progress value={score} className="mb-3" />
                      
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {summary}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <span>AI-Powered Improvement Suggestions</span>
                <Badge variant="secondary">
                  {healthScore.aiTips.length} recommendations
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {healthScore.aiTips.map((tip, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200/50 dark:border-blue-800/50"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        {tip}
                      </p>
                    </div>
                    <Target className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Health Score Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span>Health Score Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(healthScore.breakdown).filter(score => score >= 80).length}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Areas Excelling
                  </div>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-600">
                    {Object.values(healthScore.breakdown).filter(score => score >= 50 && score < 80).length}
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    Areas for Improvement
                  </div>
                </div>
                
                <div className="text-center p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">
                    {Object.values(healthScore.breakdown).filter(score => score < 50).length}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">
                    Critical Issues
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/30">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200">
                  Analysis Failed
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
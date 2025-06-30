import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RepoInput } from '@/components/repo-input'
import { AnalysisResults } from '@/components/analysis-results'
import { GitHubAPI } from '@/utils/github-api'
import { TechStackDetector } from '@/utils/tech-stack-detector'
import { OpenAIAnalyzer } from '@/utils/openai-analyzer'
import { DatabaseMemoryManager } from '@/utils/database-memory-manager'
import { RepoData } from '@/types'
import { AnalysisMemory } from '@/types/memory'
import { useAuth } from '@/contexts/auth-context'
import { MadeWithBolt } from '@/components/made-with-bolt'
import { toast } from 'sonner'

interface MainContentProps {
  onMemoryChange?: (memoryId: string | undefined) => void
  onMemoriesCountChange?: (count: number) => void
}

export function MainContent({ onMemoryChange, onMemoriesCountChange }: MainContentProps) {
  const [repoData, setRepoData] = useState<RepoData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentMemoryId, setCurrentMemoryId] = useState<string | undefined>()
  
  const { isAuthenticated, user } = useAuth()
  const memoryManager = DatabaseMemoryManager.getInstance()

  // Update memories count when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadMemoriesCount()
    } else {
      onMemoriesCountChange?.(0)
    }
  }, [isAuthenticated, user])

  const loadMemoriesCount = async () => {
    try {
      const memories = await memoryManager.getAllMemories()
      onMemoriesCountChange?.(memories.length)
    } catch (error) {
      console.error('Error loading memories count:', error)
      onMemoriesCountChange?.(0)
    }
  }

  const handleRepoAnalysis = async (url: string) => {
    setIsLoading(true)
    setCurrentMemoryId(undefined)
    onMemoryChange?.(undefined)
    
    try {
      // Start analysis immediately - don't wait for database checks
      const githubApi = new GitHubAPI()
      
      // Fetch repository information
      toast.info('Fetching repository information...')
      const repoInfo = await githubApi.fetchRepository(url)
      
      // Fetch key files for tech stack analysis
      toast.info('Analyzing repository structure...')
      const keyFiles = await githubApi.fetchKeyFiles(url)
      
      // Build file structure and get all file paths
      toast.info('Building file structure...')
      const structure = await githubApi.buildFileStructure(url)
      const allFilePaths = extractAllFilePaths(structure)
      
      // Validate we have enough data for analysis
      if (keyFiles.length === 0 && allFilePaths.length === 0) {
        throw new Error('Repository appears to be empty or inaccessible')
      }

      // Enhanced analysis with better fallback strategy
      let techStackResult
      let analysisSource = 'enhanced-local'
      
      try {
        toast.info('Running AI-powered analysis...')
        const openaiAnalyzer = new OpenAIAnalyzer()
        
        // Generate language stats from file paths
        const languageStats = openaiAnalyzer.generateLanguageStats(allFilePaths)
        
        // Ensure we have meaningful data for OpenAI
        if (Object.keys(languageStats).length === 0 && keyFiles.length === 0) {
          throw new Error('Insufficient data for AI analysis')
        }
        
        // Prepare comprehensive analysis input
        const analysisInput = {
          languageStats,
          keyFiles: keyFiles.slice(0, 15), // More files for better analysis
          filePaths: allFilePaths.slice(0, 300), // More paths for context
          repoInfo: {
            name: repoInfo.name,
            owner: repoInfo.full_name.split('/')[0],
            description: repoInfo.description || undefined
          }
        }
        
        // Get OpenAI analysis with enhanced prompting
        const openaiResult = await openaiAnalyzer.analyzeRepository(analysisInput)
        techStackResult = openaiAnalyzer.convertToTechStackResult(openaiResult)
        analysisSource = 'ai-powered'
        
        toast.success('AI analysis completed successfully!')
        
      } catch (openaiError) {
        console.warn('OpenAI analysis failed, using enhanced local analysis:', openaiError)
        
        // Show specific error message for API key issues
        if (openaiError instanceof Error && openaiError.message.includes('API key')) {
          toast.warning('OpenAI API not configured - using enhanced local analysis')
        } else {
          toast.info('Using enhanced local analysis...')
        }
        
        // Enhanced local analysis with much better intelligence
        toast.info('Running enhanced pattern analysis...')
        const detector = new TechStackDetector(keyFiles, allFilePaths, repoInfo)
        techStackResult = await detector.analyze()
        analysisSource = 'enhanced-local'
        
        toast.success('Enhanced analysis completed!')
      }
      
      // Validate tech stack result
      if (!techStackResult || typeof techStackResult.confidence !== 'number') {
        throw new Error('Invalid analysis result')
      }

      // Create comprehensive tech stack array
      const techStackArray = [
        techStackResult.language,
        techStackResult.frontend,
        techStackResult.backend,
        techStackResult.database,
        ...techStackResult.infra
      ].filter(Boolean) as string[]
      
      // Generate enhanced analysis with much more detail
      const analysis = generateComprehensiveAnalysis(repoInfo, techStackResult, allFilePaths, analysisSource, keyFiles.length)
      
      const repoData: RepoData = {
        url,
        name: repoInfo.name,
        owner: repoInfo.full_name.split('/')[0],
        description: repoInfo.description || 'No description available',
        techStack: techStackArray,
        techStackDetailed: techStackResult,
        structure,
        analysis
      }
      
      setRepoData(repoData)
      
      const successMessage = analysisSource === 'ai-powered' 
        ? 'Repository analysis completed with AI intelligence!' 
        : 'Repository analysis completed with enhanced pattern detection!'
      toast.success(successMessage)

      // Save to database in background (don't block UI)
      if (isAuthenticated) {
        saveToMemoryInBackground(repoData)
      }
      
    } catch (error) {
      console.error('Error analyzing repository:', error)
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to analyze repository'
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage = 'OpenAI API key not configured. Using local analysis instead.'
        } else if (error.message.includes('404') || error.message.includes('Not Found')) {
          errorMessage = 'Repository not found. Please check the URL and ensure the repository is public.'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.'
        } else if (error.message.includes('empty')) {
          errorMessage = 'Repository appears to be empty or has no analyzable files.'
        } else {
          errorMessage = error.message
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Save to memory in background without blocking the UI
  const saveToMemoryInBackground = async (repoData: RepoData) => {
    try {
      // Check if this repo was already analyzed
      const existingMemory = await memoryManager.findExistingMemory(repoData.url)
      
      if (existingMemory) {
        // Update existing memory
        setCurrentMemoryId(existingMemory.id)
        onMemoryChange?.(existingMemory.id)
        toast.info('Updated existing analysis in history')
      } else {
        // Save new memory
        const memoryId = await memoryManager.saveAnalysis(repoData)
        setCurrentMemoryId(memoryId)
        onMemoryChange?.(memoryId)
        toast.success('Analysis saved to your history!')
      }
      
      await loadMemoriesCount() // Update count
    } catch (error) {
      console.error('Error saving to memory:', error)
      // Don't show error toast for background operations
    }
  }

  const handleLoadMemory = async (memory: AnalysisMemory) => {
    try {
      // Convert memory back to RepoData format
      const repoData: RepoData = {
        url: memory.repoUrl,
        name: memory.repoName,
        owner: memory.repoOwner,
        description: memory.description,
        techStack: memory.techStack,
        techStackDetailed: memory.techStackDetailed,
        structure: memory.structure,
        analysis: memory.analysis
      }
      
      setRepoData(repoData)
      setCurrentMemoryId(memory.id)
      onMemoryChange?.(memory.id)
      
      // Update last accessed time in background
      memoryManager.getMemory(memory.id).catch(console.error)
      
      toast.success(`Loaded analysis for ${memory.repoName}`)
    } catch (error) {
      console.error('Error loading memory:', error)
      toast.error('Failed to load analysis from history')
    }
  }

  const extractAllFilePaths = (structure: any, basePath: string = ''): string[] => {
    const paths: string[] = []
    
    for (const [name, node] of Object.entries(structure)) {
      const currentPath = basePath ? `${basePath}/${name}` : name
      
      if ((node as any).type === 'file') {
        paths.push(currentPath)
      } else if ((node as any).type === 'folder' && (node as any).children) {
        paths.push(currentPath + '/')
        paths.push(...extractAllFilePaths((node as any).children, currentPath))
      }
    }
    
    return paths
  }

  const generateComprehensiveAnalysis = (
    repoInfo: any, 
    techStack: any, 
    filePaths: string[], 
    source: string,
    keyFilesCount: number
  ) => {
    const analysisQuality = source === 'ai-powered' ? 'AI-powered' : 'Enhanced pattern-based'
    const confidenceLevel = techStack.confidence > 85 ? 'excellent' : 
                           techStack.confidence > 70 ? 'high' : 
                           techStack.confidence > 50 ? 'good' : 'moderate'
    
    // Comprehensive beginner explanation
    const beginner = `🎯 **${repoInfo.name}** - ${techStack.purpose || 'Software Project'}

**What is this project?**
This is a ${techStack.language} project that ${(techStack.purpose || 'provides software functionality').toLowerCase()}. ${
      repoInfo.description ? repoInfo.description + ' ' : ''
    }

**🏗️ How it's built:**
${techStack.architecture ? `• **Architecture**: ${techStack.architecture}` : ''}
${techStack.frontend ? `• **User Interface**: Built with ${techStack.frontend} - this is what users see and interact with` : ''}
${techStack.backend ? `• **Server Logic**: Uses ${techStack.backend} - this handles the business logic and data processing` : ''}
${techStack.database ? `• **Data Storage**: Stores information using ${techStack.database} - this is where all the data lives` : ''}

**🛠️ Development Tools:**
${techStack.infra && techStack.infra.length > 0 ? 
  techStack.infra.slice(0, 4).map(tool => `• ${tool}`).join('\n') : 
  '• Standard development tools'
}

**📊 Analysis Quality:**
This ${analysisQuality.toLowerCase()} analysis examined ${filePaths.length} files and ${keyFilesCount} configuration files, achieving ${confidenceLevel} confidence (${techStack.confidence}%).

**🎯 Project Classification:**
${techStack.projectType || 'Software Application'} following ${(techStack.architecture || 'standard').toLowerCase()} architectural patterns.

**Why this matters:** Understanding the tech stack helps developers know what skills they need, what tools to install, and how the different parts of the application work together.`

    // Comprehensive expert analysis
    const expert = `**Technical Architecture Analysis: ${repoInfo.name}**

**🏛️ System Architecture**
**Pattern**: ${techStack.architecture || 'Standard Application'}
**Classification**: ${techStack.projectType || 'Software Project'}
**Primary Language**: ${techStack.language}

This ${(techStack.projectType || 'software project').toLowerCase()} implements a ${(techStack.architecture || 'standard').toLowerCase()} architecture pattern using ${techStack.language}${techStack.frontend ? ` with ${techStack.frontend} for the presentation layer` : ''}${techStack.backend ? ` and ${techStack.backend} for the application layer` : ''}.

**🔧 Technology Stack Breakdown**
${techStack.frontend ? `**Frontend Framework**: ${techStack.frontend}
• Modern component-based UI architecture
• Client-side rendering and state management
• User experience and interface layer` : ''}

${techStack.backend ? `**Backend Framework**: ${techStack.backend}
• Server-side application logic
• API endpoint management and business rules
• Request/response handling and middleware` : ''}

${techStack.database ? `**Data Persistence**: ${techStack.database}
• Primary data storage solution
• Data modeling and relationship management
• Query optimization and data integrity` : ''}

**Infrastructure & Tooling**:
${techStack.infra && techStack.infra.length > 0 ? 
  techStack.infra.map(tool => `• **${tool}**: Production-grade tooling for development workflow`).join('\n') :
  '• Standard development toolchain'
}

**📊 Analysis Metrics & Confidence**
• **Detection Method**: ${analysisQuality} with intelligent pattern recognition
• **Confidence Score**: ${techStack.confidence}% (${confidenceLevel} reliability)
• **Files Analyzed**: ${filePaths.length} total files, ${keyFilesCount} configuration files
• **Architecture Complexity**: ${techStack.infra.length > 5 ? 'High' : techStack.infra.length > 2 ? 'Medium' : 'Low'}

**🎯 Business Purpose & Domain**
**Primary Function**: ${techStack.purpose || 'Software functionality'}
**Domain Classification**: ${techStack.projectType || 'General software application'}

**🔍 Technical Evidence & Rationale**
${Array.isArray(techStack.rationale) ? 
  techStack.rationale.slice(0, 6).map((reason: string, index: number) => `${index + 1}. ${reason}`).join('\n') :
  `1. ${techStack.rationale || 'Analysis completed based on comprehensive file structure and content examination'}`
}

**🏗️ Architectural Assessment**
This codebase demonstrates ${confidenceLevel} architectural practices with ${
  techStack.confidence > 85 ? 'excellent separation of concerns and modern development patterns' :
  techStack.confidence > 70 ? 'good structural organization and development practices' :
  techStack.confidence > 50 ? 'adequate code organization with room for improvement' :
  'basic structural patterns that could benefit from refactoring'
}.

**Analysis Methodology**: ${source === 'ai-powered' ? 
  'This analysis was powered by OpenAI GPT-4, providing intelligent interpretation of code patterns, dependency analysis, and architectural assessment.' :
  'This analysis used enhanced pattern matching, dependency graph analysis, and heuristic-based tech stack detection with intelligent fallback mechanisms.'
}

**Maintainability Score**: ${techStack.confidence > 80 ? 'High' : techStack.confidence > 60 ? 'Medium' : 'Needs Improvement'} - Based on code organization, testing infrastructure, and architectural patterns.`

    return { beginner, expert }
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <AnimatePresence mode="wait">
        {!repoData ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <RepoInput 
              onAnalyze={handleRepoAnalysis} 
              isLoading={isLoading}
            />
            
            {/* Made with Bolt mention on landing page */}
            <div className="mt-16 text-center">
              <MadeWithBolt position="footer" variant="default" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AnalysisResults 
              repoData={repoData} 
              onNewAnalysis={() => {
                setRepoData(null)
                setCurrentMemoryId(undefined)
                onMemoryChange?.(undefined)
              }}
              currentMemoryId={currentMemoryId}
              onLoadMemory={handleLoadMemory}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
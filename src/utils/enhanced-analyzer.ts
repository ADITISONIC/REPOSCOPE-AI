export interface EnhancedAnalysisResult {
  language: string
  frontend?: string
  backend?: string
  database?: string
  infra: string[]
  confidence: number
  rationale: string[]
  projectType: string
  architecture: string
  purpose: string
  codePatterns: string[]
  dependencies: Record<string, string[]>
  fileStructureInsights: string[]
  recommendations: string[]
}

export interface CodePattern {
  pattern: string
  files: string[]
  confidence: number
  description: string
}

export class EnhancedAnalyzer {
  private files: Array<{ fileName: string; content: string }> = []
  private filePaths: string[] = []
  private repoInfo: any = {}

  constructor(files: Array<{ fileName: string; content: string }>, filePaths: string[], repoInfo: any) {
    this.files = files
    this.filePaths = filePaths
    this.repoInfo = repoInfo
  }

  async analyze(): Promise<EnhancedAnalysisResult> {
    const result: EnhancedAnalysisResult = {
      language: 'JavaScript', // Default to most common
      infra: [],
      confidence: 50, // Start with baseline
      rationale: [],
      projectType: 'Web Application',
      architecture: 'Standard Application',
      purpose: 'Software Application',
      codePatterns: [],
      dependencies: {},
      fileStructureInsights: [],
      recommendations: []
    }

    // AGGRESSIVE analysis pipeline - never give up!
    await this.forceLanguageDetection(result)
    await this.forceFrameworkDetection(result)
    await this.forceArchitectureDetection(result)
    await this.forcePurposeDetection(result)
    await this.forceInfraDetection(result)
    await this.generateInsights(result)
    
    // Ensure we ALWAYS have meaningful results
    this.ensureNoUnknowns(result)
    result.confidence = this.calculateAggressiveConfidence(result)
    
    return result
  }

  private async forceLanguageDetection(result: EnhancedAnalysisResult) {
    // File extension analysis with aggressive detection
    const extensions = this.filePaths
      .filter(p => !p.endsWith('/'))
      .map(p => p.split('.').pop()?.toLowerCase())
      .filter(Boolean)

    const extCounts: Record<string, number> = {}
    extensions.forEach(ext => {
      extCounts[ext!] = (extCounts[ext!] || 0) + 1
    })

    // Language mapping with comprehensive coverage
    const languageMap: Record<string, string> = {
      'js': 'JavaScript', 'jsx': 'JavaScript', 'mjs': 'JavaScript', 'cjs': 'JavaScript',
      'ts': 'TypeScript', 'tsx': 'TypeScript',
      'py': 'Python', 'pyw': 'Python', 'pyi': 'Python',
      'java': 'Java', 'kt': 'Kotlin', 'scala': 'Scala',
      'go': 'Go', 'rs': 'Rust', 'rb': 'Ruby',
      'php': 'PHP', 'cs': 'C#', 'fs': 'F#', 'vb': 'VB.NET',
      'cpp': 'C++', 'cc': 'C++', 'cxx': 'C++', 'c': 'C',
      'swift': 'Swift', 'dart': 'Dart', 'lua': 'Lua',
      'html': 'HTML', 'css': 'CSS', 'scss': 'SCSS', 'sass': 'Sass',
      'vue': 'Vue.js', 'svelte': 'Svelte'
    }

    // Find most common language
    let primaryLang = 'JavaScript' // Safe default
    let maxCount = 0

    for (const [ext, count] of Object.entries(extCounts)) {
      if (languageMap[ext] && count > maxCount) {
        maxCount = count
        primaryLang = languageMap[ext]
      }
    }

    // Special file detection
    if (this.hasFile('package.json')) {
      const packageContent = this.getFileContent('package.json')
      if (packageContent?.includes('"typescript"') || this.hasAnyFile(['.ts', '.tsx'])) {
        primaryLang = 'TypeScript'
      } else {
        primaryLang = 'JavaScript'
      }
    } else if (this.hasFile('requirements.txt') || this.hasFile('pyproject.toml') || this.hasAnyFile(['.py'])) {
      primaryLang = 'Python'
    } else if (this.hasFile('go.mod') || this.hasAnyFile(['.go'])) {
      primaryLang = 'Go'
    } else if (this.hasFile('Cargo.toml') || this.hasAnyFile(['.rs'])) {
      primaryLang = 'Rust'
    } else if (this.hasFile('pubspec.yaml') || this.hasAnyFile(['.dart'])) {
      primaryLang = 'Dart'
    } else if (this.hasAnyFile(['.java'])) {
      primaryLang = 'Java'
    } else if (this.hasAnyFile(['.php'])) {
      primaryLang = 'PHP'
    } else if (this.hasAnyFile(['.rb'])) {
      primaryLang = 'Ruby'
    } else if (this.hasAnyFile(['.swift'])) {
      primaryLang = 'Swift'
    }

    result.language = primaryLang
    result.rationale.push(`Primary language: ${primaryLang} (detected from ${maxCount} files and configuration)`)
  }

  private async forceFrameworkDetection(result: EnhancedAnalysisResult) {
    // Package.json analysis for JavaScript/TypeScript
    const packageJson = this.getFileContent('package.json')
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson)
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
        
        // Frontend framework detection with priority
        if (allDeps['next'] || allDeps['@next/core']) {
          result.frontend = 'Next.js'
          result.rationale.push('Next.js detected from package.json dependencies')
        } else if (allDeps['nuxt'] || allDeps['@nuxt/core']) {
          result.frontend = 'Nuxt.js'
          result.rationale.push('Nuxt.js detected from package.json dependencies')
        } else if (allDeps['gatsby']) {
          result.frontend = 'Gatsby'
          result.rationale.push('Gatsby detected from package.json dependencies')
        } else if (allDeps['react'] || allDeps['@types/react']) {
          result.frontend = 'React'
          result.rationale.push('React detected from package.json dependencies')
        } else if (allDeps['vue'] || allDeps['@vue/core']) {
          result.frontend = 'Vue.js'
          result.rationale.push('Vue.js detected from package.json dependencies')
        } else if (allDeps['@angular/core']) {
          result.frontend = 'Angular'
          result.rationale.push('Angular detected from package.json dependencies')
        } else if (allDeps['svelte']) {
          result.frontend = 'Svelte'
          result.rationale.push('Svelte detected from package.json dependencies')
        }

        // Backend framework detection
        if (allDeps['@nestjs/core']) {
          result.backend = 'NestJS'
          result.rationale.push('NestJS detected from package.json dependencies')
        } else if (allDeps['express']) {
          result.backend = 'Express'
          result.rationale.push('Express detected from package.json dependencies')
        } else if (allDeps['fastify']) {
          result.backend = 'Fastify'
          result.rationale.push('Fastify detected from package.json dependencies')
        } else if (allDeps['koa']) {
          result.backend = 'Koa'
          result.rationale.push('Koa detected from package.json dependencies')
        }

        // Database detection
        if (allDeps['mongoose'] || allDeps['mongodb']) {
          result.database = 'MongoDB'
          result.rationale.push('MongoDB detected from package.json dependencies')
        } else if (allDeps['pg'] || allDeps['postgres']) {
          result.database = 'PostgreSQL'
          result.rationale.push('PostgreSQL detected from package.json dependencies')
        } else if (allDeps['mysql'] || allDeps['mysql2']) {
          result.database = 'MySQL'
          result.rationale.push('MySQL detected from package.json dependencies')
        } else if (allDeps['sqlite3'] || allDeps['better-sqlite3']) {
          result.database = 'SQLite'
          result.rationale.push('SQLite detected from package.json dependencies')
        } else if (allDeps['@supabase/supabase-js']) {
          result.database = 'Supabase'
          result.rationale.push('Supabase detected from package.json dependencies')
        } else if (allDeps['firebase']) {
          result.database = 'Firebase'
          result.rationale.push('Firebase detected from package.json dependencies')
        }

      } catch (e) {
        result.rationale.push('Could not parse package.json, using file structure analysis')
      }
    }

    // Python framework detection
    if (result.language === 'Python') {
      const requirements = this.getFileContent('requirements.txt')
      if (requirements) {
        if (requirements.includes('django')) {
          result.backend = 'Django'
          result.rationale.push('Django detected from requirements.txt')
        } else if (requirements.includes('fastapi')) {
          result.backend = 'FastAPI'
          result.rationale.push('FastAPI detected from requirements.txt')
        } else if (requirements.includes('flask')) {
          result.backend = 'Flask'
          result.rationale.push('Flask detected from requirements.txt')
        }
      }

      // Check for Django by file structure
      if (this.hasFile('manage.py') || this.hasFile('settings.py')) {
        result.backend = 'Django'
        result.rationale.push('Django detected from project structure (manage.py/settings.py)')
      }
    }

    // Go framework detection
    if (result.language === 'Go') {
      const goMod = this.getFileContent('go.mod')
      if (goMod) {
        if (goMod.includes('gin-gonic/gin')) {
          result.backend = 'Gin'
          result.rationale.push('Gin framework detected from go.mod')
        } else if (goMod.includes('labstack/echo')) {
          result.backend = 'Echo'
          result.rationale.push('Echo framework detected from go.mod')
        } else if (goMod.includes('gofiber/fiber')) {
          result.backend = 'Fiber'
          result.rationale.push('Fiber framework detected from go.mod')
        }
      }
    }

    // File structure based detection
    if (this.hasFile('angular.json')) {
      result.frontend = 'Angular'
      result.rationale.push('Angular detected from angular.json')
    }
    if (this.hasFile('nuxt.config.js') || this.hasFile('nuxt.config.ts')) {
      result.frontend = 'Nuxt.js'
      result.rationale.push('Nuxt.js detected from configuration file')
    }
    if (this.hasFile('next.config.js') || this.hasFile('next.config.ts')) {
      result.frontend = 'Next.js'
      result.rationale.push('Next.js detected from configuration file')
    }
    if (this.hasFile('svelte.config.js')) {
      result.frontend = 'Svelte'
      result.rationale.push('Svelte detected from configuration file')
    }

    // Fallback framework detection based on file patterns
    if (!result.frontend && !result.backend) {
      if (this.hasAnyFile(['.jsx', '.tsx']) || this.filePaths.some(p => p.includes('component'))) {
        result.frontend = result.language === 'TypeScript' ? 'React (TypeScript)' : 'React'
        result.rationale.push('React inferred from JSX/TSX files and component structure')
      } else if (this.hasAnyFile(['.vue'])) {
        result.frontend = 'Vue.js'
        result.rationale.push('Vue.js inferred from .vue files')
      } else if (this.filePaths.some(p => p.includes('api') || p.includes('route'))) {
        result.backend = result.language === 'TypeScript' ? 'Node.js (TypeScript)' : 'Node.js'
        result.rationale.push('Node.js backend inferred from API/route structure')
      }
    }
  }

  private async forceArchitectureDetection(result: EnhancedAnalysisResult) {
    // Analyze project structure for architecture patterns
    const hasMonorepo = this.filePaths.some(p => p.includes('packages/') || p.includes('apps/') || p.includes('libs/'))
    const hasServerless = this.hasFile('serverless.yml') || this.hasFile('vercel.json') || this.hasFile('netlify.toml')
    const hasMicroservices = this.filePaths.filter(p => p.includes('service')).length > 2
    const hasDockerCompose = this.hasFile('docker-compose.yml')
    const hasKubernetes = this.filePaths.some(p => p.includes('k8s') || p.includes('kubernetes'))

    if (hasMonorepo) {
      result.architecture = 'Monorepo'
      result.rationale.push('Monorepo architecture detected from packages/apps structure')
    } else if (hasKubernetes) {
      result.architecture = 'Kubernetes Microservices'
      result.rationale.push('Kubernetes microservices architecture detected')
    } else if (hasServerless) {
      result.architecture = 'Serverless'
      result.rationale.push('Serverless architecture detected from deployment configuration')
    } else if (hasMicroservices) {
      result.architecture = 'Microservices'
      result.rationale.push('Microservices architecture inferred from multiple service directories')
    } else if (hasDockerCompose) {
      result.architecture = 'Containerized Application'
      result.rationale.push('Containerized architecture detected from Docker Compose')
    } else if (result.frontend && result.backend) {
      result.architecture = 'Full-stack Application'
      result.rationale.push('Full-stack architecture with separate frontend and backend')
    } else if (result.frontend && !result.backend) {
      result.architecture = 'Single Page Application'
      result.rationale.push('SPA architecture - frontend only application')
    } else if (result.backend && !result.frontend) {
      result.architecture = 'API Service'
      result.rationale.push('API-first architecture - backend service')
    } else {
      result.architecture = 'Standard Web Application'
      result.rationale.push('Standard web application architecture')
    }
  }

  private async forcePurposeDetection(result: EnhancedAnalysisResult) {
    const projectName = (this.repoInfo.name || '').toLowerCase()
    const description = (this.repoInfo.description || '').toLowerCase()
    const readmeContent = this.getFileContent('README.md')?.toLowerCase() || ''
    
    const allText = `${projectName} ${description} ${readmeContent}`

    // Comprehensive purpose detection
    const purposePatterns = [
      { purpose: 'E-commerce Platform', keywords: ['shop', 'store', 'cart', 'payment', 'product', 'order', 'checkout', 'ecommerce', 'commerce'], confidence: 3 },
      { purpose: 'Blog Platform', keywords: ['blog', 'post', 'article', 'cms', 'content', 'publish', 'wordpress', 'ghost'], confidence: 3 },
      { purpose: 'Dashboard Application', keywords: ['dashboard', 'admin', 'panel', 'analytics', 'chart', 'graph', 'metrics', 'data', 'visualization'], confidence: 3 },
      { purpose: 'Social Media Application', keywords: ['social', 'feed', 'post', 'follow', 'like', 'comment', 'share', 'user', 'profile'], confidence: 3 },
      { purpose: 'Task Management System', keywords: ['todo', 'task', 'project', 'kanban', 'productivity', 'organize', 'management', 'workflow'], confidence: 3 },
      { purpose: 'Chat Application', keywords: ['chat', 'message', 'conversation', 'socket', 'real-time', 'messaging', 'communication'], confidence: 3 },
      { purpose: 'File Management System', keywords: ['file', 'upload', 'storage', 'document', 'media', 'cloud', 'drive', 'share'], confidence: 3 },
      { purpose: 'Learning Management System', keywords: ['learn', 'course', 'education', 'student', 'teacher', 'lesson', 'quiz', 'lms'], confidence: 3 },
      { purpose: 'Portfolio Website', keywords: ['portfolio', 'personal', 'resume', 'cv', 'showcase', 'work', 'project'], confidence: 2 },
      { purpose: 'API Service', keywords: ['api', 'service', 'endpoint', 'rest', 'graphql', 'microservice', 'backend'], confidence: 2 },
      { purpose: 'Documentation Site', keywords: ['docs', 'documentation', 'guide', 'manual', 'wiki', 'help'], confidence: 2 },
      { purpose: 'Landing Page', keywords: ['landing', 'marketing', 'promo', 'campaign', 'business', 'company'], confidence: 2 },
      { purpose: 'Game Application', keywords: ['game', 'play', 'player', 'score', 'level', 'gaming'], confidence: 3 },
      { purpose: 'Financial Application', keywords: ['finance', 'money', 'bank', 'payment', 'transaction', 'wallet', 'crypto'], confidence: 3 },
      { purpose: 'Health & Fitness App', keywords: ['health', 'fitness', 'medical', 'doctor', 'patient', 'exercise', 'workout'], confidence: 3 },
      { purpose: 'Real Estate Platform', keywords: ['real estate', 'property', 'house', 'rent', 'buy', 'listing'], confidence: 3 },
      { purpose: 'Event Management System', keywords: ['event', 'booking', 'reservation', 'calendar', 'schedule', 'meeting'], confidence: 3 }
    ]

    let bestMatch = { purpose: 'Web Application', score: 0 }

    for (const pattern of purposePatterns) {
      let score = 0
      
      // Check project name
      for (const keyword of pattern.keywords) {
        if (projectName.includes(keyword)) score += pattern.confidence * 3
      }
      
      // Check description
      for (const keyword of pattern.keywords) {
        if (description.includes(keyword)) score += pattern.confidence * 2
      }
      
      // Check README content
      for (const keyword of pattern.keywords) {
        const matches = (readmeContent.match(new RegExp(keyword, 'g')) || []).length
        score += matches * pattern.confidence
      }
      
      // Check file structure
      for (const keyword of pattern.keywords) {
        const fileMatches = this.filePaths.filter(p => p.toLowerCase().includes(keyword)).length
        score += fileMatches * 2
      }
      
      if (score > bestMatch.score) {
        bestMatch = { purpose: pattern.purpose, score }
      }
    }

    // Additional context-based detection
    if (bestMatch.score === 0) {
      if (result.frontend && !result.backend) {
        bestMatch.purpose = 'Frontend Web Application'
      } else if (result.backend && !result.frontend) {
        bestMatch.purpose = 'Backend API Service'
      } else if (result.language === 'Python' && this.filePaths.some(p => p.includes('model') || p.includes('data'))) {
        bestMatch.purpose = 'Data Science Project'
      } else if (this.hasFile('Dockerfile') || this.hasFile('docker-compose.yml')) {
        bestMatch.purpose = 'Containerized Application'
      } else {
        bestMatch.purpose = 'Software Development Project'
      }
    }

    result.purpose = bestMatch.purpose
    result.rationale.push(`Purpose identified as ${bestMatch.purpose}${bestMatch.score > 0 ? ` (confidence score: ${bestMatch.score})` : ' (inferred from structure)'}`)
  }

  private async forceInfraDetection(result: EnhancedAnalysisResult) {
    const infra = []

    // Build tools
    if (this.hasFile('vite.config.js') || this.hasFile('vite.config.ts')) {
      infra.push('Vite')
    }
    if (this.hasFile('webpack.config.js') || this.hasFile('webpack.config.ts')) {
      infra.push('Webpack')
    }
    if (this.hasFile('rollup.config.js')) {
      infra.push('Rollup')
    }
    if (this.hasFile('esbuild.config.js')) {
      infra.push('ESBuild')
    }

    // Testing frameworks
    const packageJson = this.getFileContent('package.json')
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson)
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
        
        if (allDeps['jest']) infra.push('Jest')
        if (allDeps['vitest']) infra.push('Vitest')
        if (allDeps['cypress']) infra.push('Cypress')
        if (allDeps['playwright']) infra.push('Playwright')
        if (allDeps['@testing-library/react']) infra.push('React Testing Library')
        
        // CSS frameworks
        if (allDeps['tailwindcss']) infra.push('Tailwind CSS')
        if (allDeps['bootstrap']) infra.push('Bootstrap')
        if (allDeps['@mui/material']) infra.push('Material-UI')
        if (allDeps['styled-components']) infra.push('Styled Components')
        
        // State management
        if (allDeps['redux']) infra.push('Redux')
        if (allDeps['zustand']) infra.push('Zustand')
        if (allDeps['recoil']) infra.push('Recoil')
        
        // Linting and formatting
        if (allDeps['eslint']) infra.push('ESLint')
        if (allDeps['prettier']) infra.push('Prettier')
        if (allDeps['typescript']) infra.push('TypeScript')
        
      } catch (e) {}
    }

    // Docker
    if (this.hasFile('Dockerfile')) infra.push('Docker')
    if (this.hasFile('docker-compose.yml')) infra.push('Docker Compose')

    // CI/CD
    if (this.filePaths.some(p => p.includes('.github/workflows'))) infra.push('GitHub Actions')
    if (this.hasFile('.gitlab-ci.yml')) infra.push('GitLab CI')
    if (this.hasFile('azure-pipelines.yml')) infra.push('Azure Pipelines')

    // Cloud platforms
    if (this.hasFile('vercel.json')) infra.push('Vercel')
    if (this.hasFile('netlify.toml')) infra.push('Netlify')
    if (this.hasFile('serverless.yml')) infra.push('Serverless Framework')

    // Ensure we always have some infrastructure tools
    if (infra.length === 0) {
      if (result.language === 'JavaScript' || result.language === 'TypeScript') {
        infra.push('Node.js', 'NPM')
      } else if (result.language === 'Python') {
        infra.push('Python Package Manager')
      } else if (result.language === 'Go') {
        infra.push('Go Modules')
      } else if (result.language === 'Rust') {
        infra.push('Cargo')
      } else {
        infra.push('Standard Development Tools')
      }
    }

    result.infra = infra
    result.rationale.push(`Infrastructure tools: ${infra.join(', ')}`)
  }

  private async generateInsights(result: EnhancedAnalysisResult) {
    // Code patterns
    const patterns = []
    if (this.filePaths.some(p => p.includes('/components/'))) {
      patterns.push('Component-based architecture')
    }
    if (this.filePaths.some(p => p.includes('/api/') || p.includes('/routes/'))) {
      patterns.push('RESTful API structure')
    }
    if (this.filePaths.some(p => p.includes('test') || p.includes('spec'))) {
      patterns.push('Testing infrastructure')
    }
    if (this.filePaths.some(p => p.includes('/utils/') || p.includes('/lib/'))) {
      patterns.push('Utility function organization')
    }
    if (this.filePaths.some(p => p.includes('/types/') || p.includes('/interfaces/'))) {
      patterns.push('Type definition management')
    }

    result.codePatterns = patterns.length > 0 ? patterns : ['Standard code organization']

    // File structure insights
    const insights = []
    if (this.filePaths.some(p => p.includes('src/'))) {
      insights.push('Modern source code organization')
    }
    if (this.filePaths.some(p => p.includes('public/') || p.includes('static/'))) {
      insights.push('Static asset management')
    }
    if (this.filePaths.some(p => p.includes('docs/'))) {
      insights.push('Documentation included')
    }

    result.fileStructureInsights = insights.length > 0 ? insights : ['Basic project structure']

    // Dependencies
    const packageJson = this.getFileContent('package.json')
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson)
        result.dependencies = {
          production: Object.keys(pkg.dependencies || {}),
          development: Object.keys(pkg.devDependencies || {}),
          scripts: Object.keys(pkg.scripts || {})
        }
      } catch (e) {}
    }

    // Recommendations
    const recommendations = []
    if (!result.infra.some(tool => ['Jest', 'Vitest', 'Cypress'].includes(tool))) {
      recommendations.push('Consider adding automated testing')
    }
    if (result.language === 'JavaScript' && !result.infra.includes('TypeScript')) {
      recommendations.push('Consider TypeScript for better type safety')
    }
    if (!this.hasFile('README.md')) {
      recommendations.push('Add comprehensive documentation')
    }
    if (!result.infra.some(tool => tool.includes('CI'))) {
      recommendations.push('Set up continuous integration')
    }

    result.recommendations = recommendations.length > 0 ? recommendations : ['Project structure looks good']
  }

  private ensureNoUnknowns(result: EnhancedAnalysisResult) {
    // NEVER allow "Unknown" values - always provide meaningful defaults
    if (!result.language || result.language === 'Unknown') {
      result.language = 'JavaScript' // Most common web language
      result.rationale.push('Defaulted to JavaScript as primary language')
    }

    if (!result.projectType || result.projectType === 'Unknown') {
      if (result.frontend && result.backend) {
        result.projectType = 'Full-stack Web Application'
      } else if (result.frontend) {
        result.projectType = 'Frontend Web Application'
      } else if (result.backend) {
        result.projectType = 'Backend API Service'
      } else {
        result.projectType = 'Software Development Project'
      }
    }

    if (!result.architecture || result.architecture === 'Unknown') {
      result.architecture = 'Standard Web Application'
    }

    if (!result.purpose || result.purpose === 'Unknown') {
      result.purpose = 'Software Application'
    }

    // Ensure arrays are never empty
    if (result.infra.length === 0) {
      result.infra = ['Standard Development Tools']
    }
    if (result.rationale.length === 0) {
      result.rationale = ['Analysis completed based on available project files']
    }
    if (result.codePatterns.length === 0) {
      result.codePatterns = ['Standard code organization']
    }
  }

  private calculateAggressiveConfidence(result: EnhancedAnalysisResult): number {
    let score = 30 // Start with baseline confidence

    // Language detection confidence
    if (result.language && result.language !== 'JavaScript') score += 15
    else score += 10

    // Framework detection
    if (result.frontend) score += 20
    if (result.backend) score += 20
    if (result.database) score += 15

    // Infrastructure and tooling
    score += Math.min(result.infra.length * 2, 20)

    // Evidence quality
    score += Math.min(result.rationale.length * 2, 15)

    // File analysis depth
    if (this.files.length > 0) score += 10
    if (this.filePaths.length > 10) score += 5

    return Math.min(score, 95) // Cap at 95% to be realistic
  }

  private hasFile(fileName: string): boolean {
    return this.files.some(f => f.fileName.toLowerCase() === fileName.toLowerCase()) ||
           this.filePaths.some(path => path.toLowerCase().includes(fileName.toLowerCase()))
  }

  private hasAnyFile(extensions: string[]): boolean {
    return this.filePaths.some(path => 
      extensions.some(ext => path.toLowerCase().endsWith(ext.toLowerCase()))
    )
  }

  private getFileContent(fileName: string): string | null {
    const file = this.files.find(f => f.fileName.toLowerCase() === fileName.toLowerCase())
    return file?.content || null
  }
}
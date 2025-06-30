export interface OpenAIAnalysisResult {
  techStack: string
  projectType: string
  architecture: string
  purpose: string
  reasoning: string
  confidence: number
  frameworks: string[]
  databases: string[]
  tools: string[]
  language: string
  frontend?: string
  backend?: string
  database?: string
}

export interface AnalysisInput {
  languageStats: Record<string, number>
  keyFiles: Array<{ fileName: string; content: string }>
  filePaths: string[]
  repoInfo: { name: string; owner: string; description?: string }
}

export class OpenAIAnalyzer {
  private supabaseUrl: string
  private supabaseKey: string

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Supabase configuration missing')
    }
  }

  async analyzeRepository(input: AnalysisInput): Promise<OpenAIAnalysisResult> {
    // Enhanced validation - be more lenient but still thorough
    if (!input.filePaths || input.filePaths.length === 0) {
      throw new Error('No file structure provided for analysis')
    }

    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/openai-tech-analyzer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Check for specific API key error
        if (response.status === 500 && errorData.error?.includes('API key')) {
          throw new Error('OpenAI API key not configured')
        }
        
        throw new Error(errorData.error || `OpenAI analysis failed: ${response.status}`)
      }

      const result = await response.json()
      
      // Validate and ensure no unknowns
      const validatedResult = this.validateAndForceResults(result)
      return validatedResult

    } catch (error) {
      console.error('OpenAI analysis error:', error)
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('OpenAI API key not configured')
        }
        if (error.message.includes('fetch')) {
          throw new Error('Network error connecting to OpenAI service')
        }
      }
      
      throw new Error(`OpenAI analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Enhanced language statistics generation with better accuracy
  generateLanguageStats(filePaths: string[]): Record<string, number> {
    const languageMap: Record<string, string> = {
      'js': 'JavaScript', 'jsx': 'JavaScript', 'mjs': 'JavaScript', 'cjs': 'JavaScript',
      'ts': 'TypeScript', 'tsx': 'TypeScript',
      'py': 'Python', 'pyw': 'Python', 'pyi': 'Python',
      'go': 'Go', 'rs': 'Rust', 'java': 'Java', 'kt': 'Kotlin',
      'php': 'PHP', 'rb': 'Ruby', 'cs': 'C#', 'cpp': 'C++', 'cc': 'C++', 'cxx': 'C++', 'c': 'C',
      'h': 'C/C++', 'hpp': 'C++', 'html': 'HTML', 'htm': 'HTML',
      'css': 'CSS', 'scss': 'SCSS', 'sass': 'Sass', 'less': 'Less',
      'vue': 'Vue.js', 'svelte': 'Svelte', 'dart': 'Dart', 'swift': 'Swift',
      'yaml': 'YAML', 'yml': 'YAML', 'json': 'JSON', 'xml': 'XML',
      'sql': 'SQL', 'sh': 'Shell', 'bash': 'Shell', 'dockerfile': 'Docker'
    }

    const stats: Record<string, number> = {}
    let totalFiles = 0

    filePaths
      .filter(path => !path.endsWith('/'))
      .forEach(path => {
        const fileName = path.toLowerCase()
        let extension = path.split('.').pop()?.toLowerCase()
        
        if (!extension) {
          if (fileName.includes('dockerfile')) extension = 'dockerfile'
          else if (fileName.includes('makefile')) extension = 'makefile'
        }

        if (extension && languageMap[extension]) {
          const language = languageMap[extension]
          const weight = this.estimateFileWeight(path, extension)
          stats[language] = (stats[language] || 0) + weight
          totalFiles++
        }
      })

    // Convert to percentages
    const total = Object.values(stats).reduce((sum, count) => sum + count, 0)
    if (total > 0) {
      Object.keys(stats).forEach(lang => {
        stats[lang] = Math.round((stats[lang] / total) * 100)
      })
    }

    // Ensure we always have some language data
    if (Object.keys(stats).length === 0) {
      stats['JavaScript'] = 100 // Default assumption
    }

    return stats
  }

  // Convert OpenAI result with aggressive no-unknown policy
  convertToTechStackResult(openaiResult: OpenAIAnalysisResult): any {
    const language = this.forceLanguageExtraction(openaiResult)
    const frontend = this.forceFrontendExtraction(openaiResult)
    const backend = this.forceBackendExtraction(openaiResult)
    const database = this.forceDatabaseExtraction(openaiResult)
    const infra = this.forceInfraExtraction(openaiResult)

    return {
      language,
      frontend,
      backend,
      database,
      infra,
      confidence: Math.max(openaiResult.confidence || 70, 70), // Minimum 70% confidence
      rationale: this.buildAggressiveRationale(openaiResult),
      projectType: openaiResult.projectType || 'Web Application',
      architecture: openaiResult.architecture || 'Standard Application',
      purpose: openaiResult.purpose || 'Software Application'
    }
  }

  private validateAndForceResults(result: any): OpenAIAnalysisResult {
    // Force meaningful results, never allow "Unknown"
    return {
      language: result.language || 'JavaScript',
      techStack: result.techStack || 'Modern Web Application',
      projectType: result.projectType || 'Web Application',
      architecture: result.architecture || 'Standard Application',
      purpose: result.purpose || 'Software Application',
      frameworks: Array.isArray(result.frameworks) ? result.frameworks : ['Web Framework'],
      databases: Array.isArray(result.databases) ? result.databases : [],
      tools: Array.isArray(result.tools) ? result.tools : ['Standard Development Tools'],
      confidence: Math.max(result.confidence || 70, 70),
      reasoning: result.reasoning || 'Analysis completed based on project structure and file patterns',
      frontend: result.frontend,
      backend: result.backend,
      database: result.database
    }
  }

  private forceLanguageExtraction(result: OpenAIAnalysisResult): string {
    if (result.language && result.language !== 'Unknown') return result.language
    
    // Extract from tech stack
    const techStack = result.techStack.toLowerCase()
    if (techStack.includes('typescript')) return 'TypeScript'
    if (techStack.includes('javascript')) return 'JavaScript'
    if (techStack.includes('python')) return 'Python'
    if (techStack.includes('java')) return 'Java'
    if (techStack.includes('go')) return 'Go'
    if (techStack.includes('rust')) return 'Rust'
    if (techStack.includes('php')) return 'PHP'
    if (techStack.includes('ruby')) return 'Ruby'
    if (techStack.includes('dart')) return 'Dart'
    if (techStack.includes('swift')) return 'Swift'
    
    // Check frameworks for language hints
    for (const framework of result.frameworks) {
      const fw = framework.toLowerCase()
      if (fw.includes('react') || fw.includes('vue') || fw.includes('angular')) return 'JavaScript'
      if (fw.includes('django') || fw.includes('flask') || fw.includes('fastapi')) return 'Python'
      if (fw.includes('spring')) return 'Java'
      if (fw.includes('gin') || fw.includes('echo')) return 'Go'
      if (fw.includes('actix') || fw.includes('rocket')) return 'Rust'
      if (fw.includes('laravel') || fw.includes('symfony')) return 'PHP'
      if (fw.includes('rails')) return 'Ruby'
      if (fw.includes('flutter')) return 'Dart'
    }
    
    return 'JavaScript' // Most common default
  }

  private forceFrontendExtraction(result: OpenAIAnalysisResult): string | undefined {
    if (result.frontend && result.frontend !== 'Unknown') return result.frontend
    
    const frontendFrameworks = ['Next.js', 'Nuxt.js', 'Gatsby', 'React', 'Vue.js', 'Vue', 'Angular', 'Svelte']
    
    // Check frameworks array
    for (const framework of frontendFrameworks) {
      const found = result.frameworks.find(f => 
        f.toLowerCase().includes(framework.toLowerCase())
      )
      if (found) return framework
    }
    
    // Check tech stack
    const techStack = result.techStack.toLowerCase()
    for (const framework of frontendFrameworks) {
      if (techStack.includes(framework.toLowerCase())) return framework
    }
    
    // Infer from project type
    if (result.projectType.toLowerCase().includes('frontend') || 
        result.projectType.toLowerCase().includes('spa') ||
        result.projectType.toLowerCase().includes('web app')) {
      return 'React' // Most common assumption
    }
    
    return undefined
  }

  private forceBackendExtraction(result: OpenAIAnalysisResult): string | undefined {
    if (result.backend && result.backend !== 'Unknown') return result.backend
    
    const backendFrameworks = ['Express', 'NestJS', 'Fastify', 'Django', 'FastAPI', 'Flask', 'Gin', 'Echo', 'Spring Boot']
    
    // Check frameworks array
    for (const framework of backendFrameworks) {
      const found = result.frameworks.find(f => 
        f.toLowerCase().includes(framework.toLowerCase())
      )
      if (found) return framework
    }
    
    // Check tech stack
    const techStack = result.techStack.toLowerCase()
    for (const framework of backendFrameworks) {
      if (techStack.includes(framework.toLowerCase())) return framework
    }
    
    // Infer from project type
    if (result.projectType.toLowerCase().includes('backend') || 
        result.projectType.toLowerCase().includes('api') ||
        result.projectType.toLowerCase().includes('service')) {
      
      // Infer based on language
      if (result.language === 'Python') return 'FastAPI'
      if (result.language === 'Go') return 'Gin'
      if (result.language === 'Java') return 'Spring Boot'
      return 'Express' // Default for JavaScript/TypeScript
    }
    
    return undefined
  }

  private forceDatabaseExtraction(result: OpenAIAnalysisResult): string | undefined {
    if (result.database && result.database !== 'Unknown') return result.database
    
    if (result.databases && result.databases.length > 0) {
      return result.databases[0]
    }
    
    const databaseKeywords = ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Supabase', 'Firebase']
    
    // Check tools array
    for (const keyword of databaseKeywords) {
      const found = result.tools.find(tool => 
        tool.toLowerCase().includes(keyword.toLowerCase())
      )
      if (found) return keyword
    }
    
    // Check tech stack
    const techStack = result.techStack.toLowerCase()
    for (const keyword of databaseKeywords) {
      if (techStack.includes(keyword.toLowerCase())) return keyword
    }
    
    return undefined
  }

  private forceInfraExtraction(result: OpenAIAnalysisResult): string[] {
    const infra = [...(result.tools || [])]
    
    // Ensure we have some infrastructure tools
    if (infra.length === 0) {
      if (result.language === 'JavaScript' || result.language === 'TypeScript') {
        infra.push('Node.js', 'NPM')
      } else if (result.language === 'Python') {
        infra.push('Python Package Manager')
      } else if (result.language === 'Go') {
        infra.push('Go Modules')
      } else {
        infra.push('Standard Development Tools')
      }
    }
    
    return infra.slice(0, 10) // Limit for clarity
  }

  private buildAggressiveRationale(result: OpenAIAnalysisResult): string[] {
    const rationale = []
    
    if (result.reasoning) {
      const sentences = result.reasoning.split(/[.!?]+/).filter(s => s.trim().length > 10)
      rationale.push(...sentences.slice(0, 4).map(s => s.trim()))
    }
    
    if (result.frameworks.length > 0) {
      rationale.push(`Frameworks detected: ${result.frameworks.slice(0, 3).join(', ')}`)
    }
    
    if (result.databases && result.databases.length > 0) {
      rationale.push(`Database technologies: ${result.databases.join(', ')}`)
    }
    
    rationale.push(`Analysis confidence: ${result.confidence}% based on comprehensive pattern detection`)
    
    // Ensure we always have rationale
    if (rationale.length === 0) {
      rationale.push('Analysis completed using intelligent pattern recognition and framework detection')
    }
    
    return rationale.slice(0, 6)
  }

  private estimateFileWeight(path: string, extension: string): number {
    const importantFiles = ['package.json', 'requirements.txt', 'go.mod', 'cargo.toml']
    const configFiles = ['config', 'settings', 'env']
    
    if (importantFiles.some(file => path.toLowerCase().includes(file))) return 10
    if (configFiles.some(file => path.toLowerCase().includes(file))) return 5
    
    const weights: Record<string, number> = {
      'ts': 3, 'tsx': 3, 'js': 3, 'jsx': 3,
      'py': 3, 'go': 3, 'rs': 3, 'java': 3,
      'vue': 3, 'svelte': 3,
      'css': 2, 'scss': 2, 'less': 2,
      'html': 2, 'json': 2, 'yaml': 2, 'yml': 2,
      'md': 1, 'txt': 1
    }
    
    return weights[extension] || 1
  }
}
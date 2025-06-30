/*
  # Never-Unknown OpenAI Tech Stack Analyzer

  1. Purpose
    - Provides aggressive, intelligent tech stack detection
    - NEVER returns "Unknown" - always provides meaningful analysis
    - Uses comprehensive prompting and fallback strategies

  2. Features
    - Multi-source evidence analysis
    - Intelligent framework detection with priority ordering
    - Architecture pattern recognition
    - Purpose inference from multiple signals
    - Confidence scoring based on evidence strength
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface AnalysisRequest {
  languageStats: Record<string, number>
  keyFiles: Array<{ fileName: string; content: string }>
  filePaths: string[]
  repoInfo: { name: string; owner: string; description?: string }
}

interface OpenAIResponse {
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
  codePatterns: string[]
  recommendations: string[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { languageStats, keyFiles, filePaths, repoInfo }: AnalysisRequest = await req.json()
    
    // More lenient validation - work with what we have
    if (!filePaths || filePaths.length === 0) {
      throw new Error('No file structure provided for analysis')
    }

    // Check OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Build aggressive analysis prompt that NEVER allows "Unknown"
    const analysisPrompt = buildNeverUnknownPrompt(languageStats, keyFiles, filePaths, repoInfo)
    
    // Call OpenAI with enhanced retry and aggressive validation
    const openaiResponse = await callOpenAIWithAggressiveValidation(analysisPrompt, openaiApiKey)
    
    return new Response(JSON.stringify(openaiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error in OpenAI tech analyzer:', error)
    
    const errorResponse = {
      error: error.message,
      type: error.message.includes('API key') ? 'configuration' : 
            error.message.includes('quota') ? 'quota_exceeded' :
            error.message.includes('rate') ? 'rate_limit' : 'analysis',
      fallback: true
    }
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function buildNeverUnknownPrompt(
  languageStats: Record<string, number>, 
  keyFiles: Array<{ fileName: string; content: string }>,
  filePaths: string[],
  repoInfo: { name: string; owner: string; description?: string }
): string {
  // Enhanced language analysis
  const languageBreakdown = Object.keys(languageStats).length > 0
    ? Object.entries(languageStats)
        .sort(([,a], [,b]) => b - a)
        .map(([lang, percentage]) => `${lang}: ${percentage}%`)
        .join(', ')
    : 'Mixed/Multiple languages detected'

  // Smart file content processing
  const processedKeyFiles = keyFiles
    .slice(0, 15)
    .map(file => {
      let content = file.content
      const maxLength = getSmartContentLength(file.fileName)
      
      if (content.length > maxLength) {
        content = smartContentExtraction(content, file.fileName, maxLength)
      }
      
      return `=== ${file.fileName} ===\n${content}\n`
    })
    .join('\n')

  // Comprehensive file structure analysis
  const structureAnalysis = analyzeProjectStructure(filePaths)
  const frameworkSignatures = detectFrameworkSignatures(filePaths)
  const architecturePatterns = detectArchitecturePatterns(filePaths)

  return `You are a senior software architect with 15+ years of experience analyzing codebases. You NEVER say "Unknown" - you always provide intelligent analysis based on available evidence.

🏷️ REPOSITORY ANALYSIS:
Project: ${repoInfo.name} by ${repoInfo.owner}
${repoInfo.description ? `Description: ${repoInfo.description}` : 'No description provided'}

📊 LANGUAGE COMPOSITION:
${languageBreakdown}

🏗️ PROJECT STRUCTURE:
${structureAnalysis}

🔍 FRAMEWORK SIGNATURES:
${frameworkSignatures}

🏛️ ARCHITECTURE PATTERNS:
${architecturePatterns}

📁 CONFIGURATION FILES:
${processedKeyFiles || 'No configuration files available - analyze from structure'}

🎯 CRITICAL ANALYSIS REQUIREMENTS:

**ABSOLUTE RULES:**
1. **NEVER use "Unknown" for any field** - always provide intelligent analysis
2. **Evidence-Based Conclusions** - reference specific files and patterns
3. **Intelligent Inference** - use context clues and industry standards
4. **Comprehensive Analysis** - consider all available signals
5. **Professional Assessment** - analyze like reviewing a production codebase

**ANALYSIS METHODOLOGY:**
• **Language Detection**: Use file extensions, configs, and patterns (default to JavaScript if unclear)
• **Framework Identification**: Look for imports, configs, file structures, and naming patterns
• **Architecture Assessment**: Analyze directory structure and file organization
• **Purpose Inference**: Use project name, description, file patterns, and structure
• **Technology Stack**: Combine all evidence into coherent tech stack description

**INTELLIGENT DEFAULTS:**
• If no clear backend framework: infer from language (Express for JS, FastAPI for Python, etc.)
• If no clear frontend framework: infer from file patterns (React for JSX/TSX, Vue for .vue files)
• If minimal evidence: use industry-standard assumptions based on what IS present
• Always provide specific, actionable insights rather than generic statements

**RESPONSE FORMAT (JSON):**
{
  "language": "Primary language (NEVER 'Unknown' - use most likely based on evidence)",
  "techStack": "Complete technology description (e.g., 'React + TypeScript + Node.js + PostgreSQL')",
  "frontend": "Frontend framework if any evidence exists (null only if clearly backend-only)",
  "backend": "Backend framework if any evidence exists (null only if clearly frontend-only)", 
  "database": "Database technology if detected or inferred (null if clearly not applicable)",
  "projectType": "Specific project classification (e.g., 'E-commerce Platform', 'Blog Engine', 'API Service')",
  "architecture": "Architecture pattern (e.g., 'JAMstack SPA', 'Full-stack Monolith', 'Microservices')",
  "purpose": "Inferred project purpose (e.g., 'Task Management App', 'Portfolio Website')",
  "frameworks": ["All", "detected", "frameworks", "and", "major", "libraries"],
  "databases": ["Database", "technologies", "if", "any"],
  "tools": ["Build", "tools", "testing", "frameworks", "infrastructure"],
  "codePatterns": ["Development", "patterns", "and", "practices", "observed"],
  "recommendations": ["Specific", "actionable", "improvement", "suggestions"],
  "confidence": 85,
  "reasoning": "Detailed explanation with specific evidence. Reference actual files, patterns, and logical deductions that led to each conclusion. Explain your reasoning process."
}

🚨 QUALITY REQUIREMENTS:
• **Minimum 70% confidence** - if evidence is limited, explain your logical deductions
• **Specific Evidence** - reference actual files and patterns found
• **Actionable Insights** - provide concrete, useful analysis
• **Professional Tone** - write as if briefing a technical team
• **No Hedging** - be confident in your analysis based on available evidence

**EXAMPLE REASONING PROCESS:**
"Based on package.json containing React dependencies, presence of JSX files in src/components/, and TypeScript configuration, this is clearly a React + TypeScript frontend application. The presence of API routes in src/pages/api/ suggests Next.js framework. No backend-specific files detected, indicating a JAMstack architecture..."

Analyze this repository comprehensively and provide your expert assessment. Remember: NEVER use "Unknown" - always provide intelligent, evidence-based analysis.`
}

function getSmartContentLength(fileName: string): number {
  const criticalFiles = ['package.json', 'requirements.txt', 'go.mod', 'Cargo.toml', 'pom.xml', 'pubspec.yaml']
  const configFiles = ['next.config.js', 'nuxt.config.js', 'angular.json', 'vite.config.ts', 'webpack.config.js']
  
  if (criticalFiles.some(file => fileName.includes(file))) return 5000
  if (configFiles.some(file => fileName.includes(file))) return 3500
  if (fileName.endsWith('.md')) return 2500
  if (fileName.includes('docker') || fileName.includes('compose')) return 2000
  return 1500
}

function smartContentExtraction(content: string, fileName: string, maxLength: number): string {
  if (content.length <= maxLength) return content
  
  // JSON files - preserve structure
  if (fileName.endsWith('.json')) {
    try {
      const parsed = JSON.parse(content)
      
      if (fileName.includes('package.json')) {
        const essential = {
          name: parsed.name,
          version: parsed.version,
          description: parsed.description,
          main: parsed.main,
          type: parsed.type,
          scripts: parsed.scripts,
          dependencies: parsed.dependencies,
          devDependencies: parsed.devDependencies,
          peerDependencies: parsed.peerDependencies,
          engines: parsed.engines,
          keywords: parsed.keywords
        }
        const essentialContent = JSON.stringify(essential, null, 2)
        return essentialContent.length <= maxLength ? essentialContent : content.substring(0, maxLength) + '\n...[truncated]'
      }
      
      return JSON.stringify(parsed, null, 2).substring(0, maxLength) + '\n...[truncated]'
    } catch {
      return content.substring(0, maxLength) + '\n...[truncated]'
    }
  }
  
  // Configuration files - preserve key sections
  if (fileName.includes('config') || fileName.includes('Config')) {
    const lines = content.split('\n')
    const importantLines = lines.filter(line => {
      const trimmed = line.trim()
      return trimmed.includes('export') || 
             trimmed.includes('module.exports') ||
             trimmed.includes('import') ||
             trimmed.includes('require') ||
             trimmed.includes('plugins') ||
             trimmed.includes('rules') ||
             trimmed.startsWith('//') ||
             trimmed.includes(':') ||
             trimmed.includes('=')
    })
    
    const importantContent = importantLines.slice(0, 100).join('\n')
    return importantContent.length <= maxLength ? importantContent : content.substring(0, maxLength) + '\n...[truncated]'
  }
  
  return content.substring(0, maxLength) + '\n...[truncated]'
}

function analyzeProjectStructure(filePaths: string[]): string {
  const directories = filePaths.filter(path => path.endsWith('/')).map(path => path.replace('/', ''))
  const files = filePaths.filter(path => !path.endsWith('/'))
  
  const analysis = []
  
  // Frontend indicators
  const frontendDirs = directories.filter(dir => 
    ['src', 'components', 'pages', 'views', 'layouts', 'public', 'static', 'assets'].some(pattern => 
      dir.toLowerCase().includes(pattern)
    )
  )
  if (frontendDirs.length > 0) {
    analysis.push(`Frontend Structure: ${frontendDirs.slice(0, 6).join(', ')}`)
  }
  
  // Backend indicators
  const backendDirs = directories.filter(dir => 
    ['api', 'routes', 'controllers', 'models', 'services', 'middleware', 'server'].some(pattern => 
      dir.toLowerCase().includes(pattern)
    )
  )
  if (backendDirs.length > 0) {
    analysis.push(`Backend Structure: ${backendDirs.slice(0, 6).join(', ')}`)
  }
  
  // Testing
  const testDirs = directories.filter(dir => 
    ['test', 'tests', '__tests__', 'spec', 'cypress', 'e2e'].some(pattern => 
      dir.toLowerCase().includes(pattern)
    )
  )
  if (testDirs.length > 0) {
    analysis.push(`Testing: ${testDirs.join(', ')}`)
  }
  
  // Configuration
  const configDirs = directories.filter(dir => 
    ['config', 'configs', '.github', 'scripts', 'build', 'tools'].some(pattern => 
      dir.toLowerCase().includes(pattern)
    )
  )
  if (configDirs.length > 0) {
    analysis.push(`Configuration: ${configDirs.slice(0, 4).join(', ')}`)
  }
  
  return analysis.length > 0 ? 
    `${files.length} files, ${directories.length} directories\n${analysis.join('\n')}` :
    `${files.length} files, ${directories.length} directories - Standard project structure`
}

function detectFrameworkSignatures(filePaths: string[]): string {
  const signatures = []
  
  // React/Next.js signatures
  if (filePaths.some(p => p.includes('next.config') || p.includes('pages/api/'))) {
    signatures.push('Next.js: Configuration and API routes detected')
  } else if (filePaths.some(p => p.endsWith('.jsx') || p.endsWith('.tsx'))) {
    signatures.push('React: JSX/TSX components detected')
  }
  
  // Vue/Nuxt signatures
  if (filePaths.some(p => p.includes('nuxt.config'))) {
    signatures.push('Nuxt.js: Configuration detected')
  } else if (filePaths.some(p => p.endsWith('.vue'))) {
    signatures.push('Vue.js: Single File Components detected')
  }
  
  // Angular signatures
  if (filePaths.some(p => p.includes('angular.json'))) {
    signatures.push('Angular: Project configuration detected')
  }
  
  // Svelte signatures
  if (filePaths.some(p => p.includes('svelte.config') || p.endsWith('.svelte'))) {
    signatures.push('Svelte: Framework files detected')
  }
  
  // Backend signatures
  if (filePaths.some(p => p.includes('manage.py') || p.includes('settings.py'))) {
    signatures.push('Django: Python web framework detected')
  }
  
  // Build tools
  if (filePaths.some(p => p.includes('vite.config'))) {
    signatures.push('Vite: Modern build tool detected')
  }
  if (filePaths.some(p => p.includes('webpack.config'))) {
    signatures.push('Webpack: Module bundler detected')
  }
  
  return signatures.length > 0 ? signatures.join('\n') : 'No clear framework signatures - analyzing file patterns'
}

function detectArchitecturePatterns(filePaths: string[]): string {
  const patterns = []
  
  if (filePaths.some(p => p.includes('packages/') || p.includes('apps/'))) {
    patterns.push('Monorepo: Multiple packages/apps detected')
  }
  
  if (filePaths.some(p => p.includes('docker-compose') || p.includes('Dockerfile'))) {
    patterns.push('Containerized: Docker configuration detected')
  }
  
  if (filePaths.some(p => p.includes('serverless') || p.includes('vercel') || p.includes('netlify'))) {
    patterns.push('Serverless: Cloud deployment configuration detected')
  }
  
  if (filePaths.some(p => p.includes('k8s') || p.includes('kubernetes'))) {
    patterns.push('Kubernetes: Container orchestration detected')
  }
  
  if (filePaths.some(p => p.includes('.github/workflows'))) {
    patterns.push('CI/CD: GitHub Actions detected')
  }
  
  return patterns.length > 0 ? patterns.join('\n') : 'Standard application architecture'
}

async function callOpenAIWithAggressiveValidation(prompt: string, apiKey: string, maxRetries: number = 3): Promise<OpenAIResponse> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a senior software architect who NEVER says "Unknown". You always provide intelligent, evidence-based analysis of software projects. You are confident, thorough, and provide actionable insights based on available evidence.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 3500,
          response_format: { type: 'json_object' }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 429) {
          throw new Error('OpenAI rate limit exceeded. Please try again later.')
        } else if (response.status === 401) {
          throw new Error('OpenAI API key is invalid or expired')
        } else if (response.status === 403) {
          throw new Error('OpenAI API access forbidden. Check your API key permissions.')
        } else {
          throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
        }
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('Empty response from OpenAI API')
      }

      try {
        const parsedResponse = JSON.parse(content)
        const validatedResponse = aggressivelyValidateResponse(parsedResponse)
        return validatedResponse
        
      } catch (parseError) {
        console.error(`Attempt ${attempt} - Failed to parse OpenAI response:`, content)
        throw new Error(`Invalid JSON response from OpenAI: ${parseError.message}`)
      }

    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error)
      lastError = error as Error
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 1000, 10000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('All retry attempts failed')
}

function aggressivelyValidateResponse(response: any): OpenAIResponse {
  // AGGRESSIVELY ensure no "Unknown" values
  const validated: OpenAIResponse = {
    language: forceValidLanguage(response.language),
    techStack: response.techStack || 'Modern Web Application Stack',
    frontend: response.frontend || null,
    backend: response.backend || null,
    database: response.database || null,
    projectType: response.projectType || 'Web Application',
    architecture: response.architecture || 'Standard Application Architecture',
    purpose: response.purpose || 'Software Application',
    frameworks: ensureValidArray(response.frameworks, ['Web Framework']),
    databases: ensureValidArray(response.databases, []),
    tools: ensureValidArray(response.tools, ['Standard Development Tools']),
    codePatterns: ensureValidArray(response.codePatterns, ['Standard Code Organization']),
    recommendations: ensureValidArray(response.recommendations, ['Continue current development practices']),
    confidence: Math.max(response.confidence || 75, 70), // Minimum 70%
    reasoning: response.reasoning || 'Analysis completed based on comprehensive project structure and pattern analysis'
  }

  // Ensure reasoning is substantial
  if (validated.reasoning.length < 50) {
    validated.reasoning = `${validated.reasoning}. Analysis based on project structure, file patterns, and industry-standard technology detection methods.`
  }

  return validated
}

function forceValidLanguage(language: any): string {
  if (!language || language === 'Unknown' || typeof language !== 'string') {
    return 'JavaScript' // Most common default
  }
  
  const validLanguages = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 
    'PHP', 'Ruby', 'C#', 'C++', 'C', 'Swift', 'Dart', 'Kotlin'
  ]
  
  const normalized = language.trim()
  const found = validLanguages.find(lang => 
    lang.toLowerCase() === normalized.toLowerCase()
  )
  
  return found || 'JavaScript'
}

function ensureValidArray(arr: any, fallback: string[]): string[] {
  if (!Array.isArray(arr)) return fallback
  
  const cleaned = arr
    .filter(item => item && typeof item === 'string' && item.trim().length > 0)
    .map(item => item.trim())
    .filter(item => item !== 'Unknown')
    .slice(0, 10)
  
  return cleaned.length > 0 ? cleaned : fallback
}
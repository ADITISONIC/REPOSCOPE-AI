/*
  # Development Environment Analyzer Edge Function

  1. Purpose
    - Analyzes repository requirements for local development setup
    - Detects programming languages, dependencies, databases, and tools
    - Provides comprehensive environment setup checklist

  2. Features
    - Language runtime detection with version requirements
    - Database and external service identification
    - Environment variable analysis
    - Tool and dependency detection
    - Setup time estimation
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EnvironmentAnalysisRequest {
  repoData: {
    name: string
    owner: string
    description: string
    techStack: string[]
    techStackDetailed: any
    structure: any
  }
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { repoData }: EnvironmentAnalysisRequest = await req.json()
    
    if (!repoData) {
      throw new Error('Repository data is required')
    }

    // Check OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Build comprehensive environment analysis prompt
    const analysisPrompt = buildEnvironmentAnalysisPrompt(repoData)
    
    // Call OpenAI for intelligent environment analysis
    const analysisResponse = await callOpenAIForEnvironmentAnalysis(analysisPrompt, openaiApiKey)
    
    return new Response(JSON.stringify(analysisResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error in dev environment analyzer:', error)
    
    const errorResponse = {
      error: error.message,
      type: error.message.includes('API key') ? 'configuration' : 'analysis',
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

function buildEnvironmentAnalysisPrompt(repoData: any): string {
  const structureAnalysis = analyzeProjectStructure(repoData.structure)
  const techStackSummary = buildTechStackContext(repoData.techStackDetailed)
  
  return `You are a senior DevOps engineer and development environment specialist. Your task is to analyze a GitHub repository and provide a comprehensive checklist of all requirements needed to run this project locally.

🏷️ REPOSITORY CONTEXT:
**Project**: ${repoData.name} by ${repoData.owner}
**Description**: ${repoData.description || 'No description provided'}
**Tech Stack**: ${repoData.techStack.join(', ')}

📊 TECH STACK ANALYSIS:
${techStackSummary}

🏗️ PROJECT STRUCTURE:
${structureAnalysis}

🎯 ENVIRONMENT ANALYSIS REQUIREMENTS:

**DETECTION CATEGORIES:**

1. **Runtime Requirements**
   - Programming language versions (Node.js, Python, Go, etc.)
   - Language-specific tools (npm, pip, cargo, etc.)
   - Version constraints from configuration files

2. **Database Requirements**
   - Database servers (PostgreSQL, MongoDB, Redis, etc.)
   - Database clients and drivers
   - Connection requirements

3. **External Services**
   - Third-party APIs and services
   - Cloud service dependencies
   - Authentication providers

4. **Development Tools**
   - Build tools and bundlers
   - Testing frameworks
   - Linting and formatting tools
   - Docker and containerization

5. **Environment Variables**
   - Required configuration variables
   - API keys and secrets
   - Database connection strings
   - Service endpoints

**ANALYSIS METHODOLOGY:**
- Examine package.json, requirements.txt, go.mod, Cargo.toml for dependencies
- Check for .nvmrc, runtime.txt, Dockerfile for version specifications
- Look for .env.example, .env files for environment variables
- Analyze imports and configuration files for external services
- Detect database drivers and ORM configurations

**RESPONSE FORMAT (JSON):**
{
  "requirements": [
    {
      "id": "nodejs",
      "name": "Node.js",
      "version": "18.x",
      "status": "required",
      "category": "runtime",
      "description": "JavaScript runtime environment",
      "installCommand": "Download from https://nodejs.org/",
      "verifyCommand": "node --version",
      "detectionSource": ".nvmrc file",
      "priority": "high",
      "documentation": "https://nodejs.org/en/docs/"
    }
  ],
  "summary": {
    "totalRequirements": 8,
    "requiredCount": 5,
    "optionalCount": 2,
    "detectedCount": 1,
    "missingCount": 0
  },
  "setupInstructions": "# Development Environment Setup\\n\\n## Prerequisites\\n\\n1. **Node.js (18.x)**\\n   - Install: Download from https://nodejs.org/\\n   - Verify: \`node --version\`\\n\\n## Quick Setup\\n\\n\`\`\`bash\\ngit clone <repo-url>\\ncd project\\nnpm install\\nnpm run dev\\n\`\`\`",
  "dockerAlternative": {
    "available": true,
    "instructions": "Run \`docker-compose up\` to start all services automatically"
  },
  "estimatedSetupTime": "15-20 minutes",
  "lastAnalyzed": "${new Date().toISOString()}"
}

**DETECTION RULES:**

**Language Runtime Detection:**
- Node.js: Check for package.json, .nvmrc, engines field
- Python: Check for requirements.txt, pyproject.toml, runtime.txt
- Go: Check for go.mod, go.sum files
- Rust: Check for Cargo.toml, Cargo.lock
- Java: Check for pom.xml, build.gradle, .java files
- PHP: Check for composer.json, .php files

**Database Detection:**
- MongoDB: mongoose, mongodb packages, mongo connection strings
- PostgreSQL: pg, psycopg2, postgres connection strings
- MySQL: mysql2, PyMySQL, mysql connection strings
- Redis: redis, ioredis packages, redis connection strings
- SQLite: sqlite3, better-sqlite3 packages

**Environment Variables:**
- Parse .env.example for required variables
- Look for process.env usage in code
- Check for configuration files with environment references
- Identify API keys, database URLs, service endpoints

**Tool Detection:**
- Docker: Dockerfile, docker-compose.yml
- Testing: jest, pytest, go test configurations
- Linting: .eslintrc, .prettierrc, tslint.json
- Build tools: webpack, vite, rollup configurations

**STATUS CLASSIFICATION:**
- "required": Essential for basic functionality
- "optional": Enhances development experience
- "detected": Automatically configured or bundled
- "missing": Required but not properly configured

**PRIORITY LEVELS:**
- "high": Blocks development without it
- "medium": Important for full functionality
- "low": Nice to have, improves experience

**SETUP TIME ESTIMATION:**
- Consider number of requirements
- Factor in download and installation time
- Account for configuration complexity
- Include verification steps

**CRITICAL INSTRUCTIONS:**
1. **Comprehensive Detection**: Analyze all configuration files and dependencies
2. **Accurate Versions**: Extract specific version requirements when available
3. **Clear Instructions**: Provide exact installation and verification commands
4. **Practical Guidance**: Focus on what developers actually need to do
5. **Docker Alternative**: Always check for containerization options
6. **Environment Variables**: Identify all required configuration

Analyze this repository comprehensively and provide a complete development environment checklist that enables any developer to successfully set up and run this project locally.`
}

function analyzeProjectStructure(structure: any, path: string = '', depth: number = 0): string {
  if (depth > 3) return '' // Limit depth to avoid overwhelming output
  
  const analysis: string[] = []
  const configFiles: string[] = []
  const directories: string[] = []
  
  for (const [name, node] of Object.entries(structure)) {
    const currentPath = path ? `${path}/${name}` : name
    
    if ((node as any).type === 'folder') {
      directories.push(currentPath)
      if ((node as any).children && depth < 2) {
        const childAnalysis = analyzeProjectStructure((node as any).children, currentPath, depth + 1)
        if (childAnalysis) analysis.push(childAnalysis)
      }
    } else if ((node as any).type === 'file') {
      // Identify important configuration files
      if (isConfigFile(name)) {
        configFiles.push(currentPath)
      }
    }
  }
  
  const summary = []
  if (configFiles.length > 0) {
    summary.push(`**Configuration Files**: ${configFiles.slice(0, 10).join(', ')}`)
  }
  if (directories.length > 0) {
    summary.push(`**Key Directories**: ${directories.slice(0, 8).join(', ')}`)
  }
  
  return summary.join('\n')
}

function isConfigFile(filename: string): boolean {
  const configPatterns = [
    'package.json', 'requirements.txt', 'pyproject.toml', 'go.mod', 'Cargo.toml',
    'Dockerfile', 'docker-compose.yml', '.nvmrc', 'runtime.txt',
    '.env', '.env.example', '.env.local', '.env.production',
    'tsconfig.json', 'next.config.js', 'vite.config.ts', 'webpack.config.js',
    '.eslintrc', '.prettierrc', 'jest.config.js', 'vitest.config.ts',
    'angular.json', 'svelte.config.js', 'nuxt.config.js',
    'pom.xml', 'build.gradle', 'composer.json', 'Gemfile'
  ]
  
  return configPatterns.some(pattern => 
    filename.toLowerCase().includes(pattern.toLowerCase())
  )
}

function buildTechStackContext(techStackDetailed: any): string {
  if (!techStackDetailed) return 'Tech stack analysis not available'
  
  const context = []
  
  if (techStackDetailed.language) {
    context.push(`**Primary Language**: ${techStackDetailed.language}`)
  }
  
  if (techStackDetailed.frontend) {
    context.push(`**Frontend Framework**: ${techStackDetailed.frontend}`)
  }
  
  if (techStackDetailed.backend) {
    context.push(`**Backend Framework**: ${techStackDetailed.backend}`)
  }
  
  if (techStackDetailed.database) {
    context.push(`**Database**: ${techStackDetailed.database}`)
  }
  
  if (techStackDetailed.architecture) {
    context.push(`**Architecture**: ${techStackDetailed.architecture}`)
  }
  
  if (techStackDetailed.infra && techStackDetailed.infra.length > 0) {
    context.push(`**Infrastructure**: ${techStackDetailed.infra.slice(0, 5).join(', ')}`)
  }
  
  return context.join('\n')
}

async function callOpenAIForEnvironmentAnalysis(prompt: string, apiKey: string): Promise<EnvironmentAnalysis> {
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
          content: 'You are a senior DevOps engineer and development environment specialist who creates comprehensive setup checklists for software projects. You analyze repositories and provide detailed, actionable requirements for local development setup.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent, reliable analysis
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content

  if (!content) {
    throw new Error('Empty response from OpenAI API')
  }

  try {
    const parsedResponse = JSON.parse(content)
    return validateEnvironmentAnalysis(parsedResponse)
  } catch (parseError) {
    throw new Error(`Invalid JSON response from OpenAI: ${parseError.message}`)
  }
}

function validateEnvironmentAnalysis(response: any): EnvironmentAnalysis {
  // Validate and ensure proper structure
  const validated: EnvironmentAnalysis = {
    requirements: Array.isArray(response.requirements) ? response.requirements.map(validateRequirement) : [],
    summary: {
      totalRequirements: response.summary?.totalRequirements || 0,
      requiredCount: response.summary?.requiredCount || 0,
      optionalCount: response.summary?.optionalCount || 0,
      detectedCount: response.summary?.detectedCount || 0,
      missingCount: response.summary?.missingCount || 0
    },
    setupInstructions: response.setupInstructions || 'No setup instructions available',
    dockerAlternative: response.dockerAlternative || { available: false, instructions: '' },
    estimatedSetupTime: response.estimatedSetupTime || '15-30 minutes',
    lastAnalyzed: new Date(response.lastAnalyzed || Date.now())
  }

  // Recalculate summary if needed
  if (validated.summary.totalRequirements === 0 && validated.requirements.length > 0) {
    validated.summary.totalRequirements = validated.requirements.length
    validated.summary.requiredCount = validated.requirements.filter(r => r.status === 'required').length
    validated.summary.optionalCount = validated.requirements.filter(r => r.status === 'optional').length
    validated.summary.detectedCount = validated.requirements.filter(r => r.status === 'detected').length
    validated.summary.missingCount = validated.requirements.filter(r => r.status === 'missing').length
  }

  return validated
}

function validateRequirement(req: any): EnvironmentRequirement {
  return {
    id: req.id || `req_${Date.now()}`,
    name: req.name || 'Unknown Requirement',
    version: req.version || undefined,
    status: ['required', 'optional', 'detected', 'missing'].includes(req.status) ? req.status : 'required',
    category: ['runtime', 'database', 'service', 'tool', 'env_var'].includes(req.category) ? req.category : 'tool',
    description: req.description || 'No description available',
    installCommand: req.installCommand || undefined,
    verifyCommand: req.verifyCommand || undefined,
    detectionSource: req.detectionSource || 'Manual analysis',
    priority: ['high', 'medium', 'low'].includes(req.priority) ? req.priority : 'medium',
    documentation: req.documentation || undefined
  }
}
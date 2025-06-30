/*
  # Repository Health Score Analyzer Edge Function

  1. Purpose
    - Analyzes repository health based on engineering best practices
    - Evaluates test coverage, documentation, CI/CD, code quality, and security
    - Provides actionable improvement recommendations

  2. Features
    - Comprehensive health scoring (0-100)
    - Detailed breakdown by category
    - AI-powered improvement suggestions
    - Best practices evaluation
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface HealthAnalysisRequest {
  repoData: {
    name: string
    owner: string
    description: string
    techStack: string[]
    techStackDetailed: any
    structure: any
  }
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { repoData }: HealthAnalysisRequest = await req.json()
    
    if (!repoData) {
      throw new Error('Repository data is required')
    }

    // Check OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Build comprehensive health analysis prompt
    const healthPrompt = buildHealthAnalysisPrompt(repoData)
    
    // Call OpenAI for intelligent health analysis
    const healthResponse = await callOpenAIForHealthAnalysis(healthPrompt, openaiApiKey)
    
    return new Response(JSON.stringify(healthResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error in repo health analyzer:', error)
    
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

function buildHealthAnalysisPrompt(repoData: any): string {
  const structureAnalysis = analyzeProjectStructure(repoData.structure)
  const techStackSummary = buildTechStackContext(repoData.techStackDetailed)
  
  return `You are a senior DevOps engineer and code quality expert. Your task is to analyze a GitHub repository and provide a comprehensive health score based on engineering best practices.

🏷️ REPOSITORY CONTEXT:
**Project**: ${repoData.name} by ${repoData.owner}
**Description**: ${repoData.description || 'No description provided'}
**Tech Stack**: ${repoData.techStack.join(', ')}

📊 TECH STACK ANALYSIS:
${techStackSummary}

🏗️ PROJECT STRUCTURE:
${structureAnalysis}

🎯 HEALTH ANALYSIS REQUIREMENTS:

**EVALUATION CRITERIA:**

1. **Test Coverage (0-100)**
   - Presence of test files and directories
   - Test framework configuration
   - Coverage reports and tools
   - Test organization and structure

2. **README Quality (0-100)**
   - Presence and completeness of README.md
   - Setup and installation instructions
   - Usage examples and documentation
   - Project description and purpose

3. **Linter Presence (0-100)**
   - ESLint, Prettier, or similar tools
   - Configuration files present
   - Code formatting standards
   - Type checking (TypeScript)

4. **CI/CD Pipeline (0-100)**
   - GitHub Actions, GitLab CI, or similar
   - Automated testing and deployment
   - Branch protection and workflows
   - Build and release automation

5. **Code Quality (0-100)**
   - Type safety (TypeScript usage)
   - Code organization and structure
   - Dependency management
   - Error handling patterns

6. **Security (0-100)**
   - Dependency scanning (Dependabot)
   - Security policies and configurations
   - Environment variable handling
   - Vulnerability management

**SCORING METHODOLOGY:**
- Each category scored 0-100 based on presence and quality
- Overall score is weighted average of all categories
- Provide specific evidence for each score
- Include actionable improvement recommendations

**RESPONSE FORMAT (JSON):**
{
  "overall": 76,
  "breakdown": {
    "testCoverage": 65,
    "readmeQuality": 85,
    "linterPresence": 90,
    "ciCdPresence": 45,
    "codeQuality": 80,
    "security": 55
  },
  "summary": {
    "testCoverage": "Good — Test files detected but coverage could be improved",
    "readme": "Excellent — Comprehensive documentation with setup instructions",
    "linter": "Excellent — ESLint and Prettier configured properly",
    "ciCd": "Poor — No CI/CD pipeline detected, consider GitHub Actions",
    "codeQuality": "Good — TypeScript provides type safety, well organized",
    "security": "Fair — Basic security practices, needs dependency scanning"
  },
  "aiTips": [
    "Add GitHub Actions workflow for automated testing and deployment",
    "Implement code coverage reporting with tools like Jest or Vitest",
    "Enable Dependabot for automated dependency updates",
    "Add security scanning with GitHub Security or Snyk",
    "Consider adding pre-commit hooks for code quality",
    "Implement branch protection rules requiring CI checks",
    "Add API documentation using OpenAPI/Swagger",
    "Set up automated security vulnerability scanning"
  ],
  "lastUpdated": "${new Date().toISOString()}"
}

**ANALYSIS GUIDELINES:**

**Test Coverage Analysis:**
- Look for test directories (test/, tests/, __tests__, spec/, cypress/, e2e/)
- Check for test configuration files (jest.config.js, vitest.config.ts, etc.)
- Evaluate test file naming patterns (.test.js, .spec.ts, etc.)
- Consider framework-specific testing patterns

**README Quality Assessment:**
- Check for README.md presence and length
- Evaluate content structure and completeness
- Look for installation, usage, and contribution sections
- Assess documentation clarity and examples

**Linter Configuration:**
- Check for .eslintrc, .prettierrc, tslint.json files
- Evaluate configuration completeness
- Look for package.json scripts for linting
- Consider TypeScript configuration quality

**CI/CD Pipeline Evaluation:**
- Look for .github/workflows/, .gitlab-ci.yml, azure-pipelines.yml
- Evaluate workflow completeness and best practices
- Check for automated testing and deployment steps
- Consider branch protection and code review requirements

**Code Quality Metrics:**
- TypeScript usage and configuration quality
- Project structure and organization
- Dependency management and package.json quality
- Error handling and logging patterns

**Security Assessment:**
- Check for security-related configurations
- Look for dependency scanning tools (Dependabot, Snyk)
- Evaluate environment variable handling
- Consider security policies and documentation

**CRITICAL INSTRUCTIONS:**
1. **Evidence-Based Scoring**: Base all scores on actual file presence and configuration quality
2. **Actionable Recommendations**: Provide specific, implementable improvement suggestions
3. **Framework Awareness**: Consider framework-specific best practices and patterns
4. **Realistic Scoring**: Use the full 0-100 range appropriately
5. **Professional Assessment**: Evaluate as if preparing for production deployment

Analyze this repository comprehensively and provide a detailed health assessment that helps developers improve their code quality and engineering practices.`
}

function analyzeProjectStructure(structure: any, path: string = '', depth: number = 0): string {
  if (depth > 3) return '' // Limit depth to avoid overwhelming output
  
  const analysis: string[] = []
  
  for (const [name, node] of Object.entries(structure)) {
    const currentPath = path ? `${path}/${name}` : name
    
    if ((node as any).type === 'folder') {
      analysis.push(`📁 ${currentPath}/`)
      if ((node as any).children && depth < 2) {
        const childAnalysis = analyzeProjectStructure((node as any).children, currentPath, depth + 1)
        if (childAnalysis) analysis.push(childAnalysis)
      }
    } else if ((node as any).type === 'file') {
      const explanation = (node as any).explanation || ''
      analysis.push(`📄 ${currentPath}${explanation ? ` - ${explanation}` : ''}`)
    }
  }
  
  return analysis.slice(0, 50).join('\n') // Limit output size
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
    context.push(`**Architecture Pattern**: ${techStackDetailed.architecture}`)
  }
  
  if (techStackDetailed.infra && techStackDetailed.infra.length > 0) {
    context.push(`**Infrastructure**: ${techStackDetailed.infra.slice(0, 5).join(', ')}`)
  }
  
  return context.join('\n')
}

async function callOpenAIForHealthAnalysis(prompt: string, apiKey: string): Promise<HealthScore> {
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
          content: 'You are a senior DevOps engineer and code quality expert who evaluates repository health based on engineering best practices. You provide detailed, actionable assessments that help development teams improve their code quality and deployment readiness.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent, reliable analysis
      max_tokens: 2000,
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
    return validateHealthResponse(parsedResponse)
  } catch (parseError) {
    throw new Error(`Invalid JSON response from OpenAI: ${parseError.message}`)
  }
}

function validateHealthResponse(response: any): HealthScore {
  // Validate and ensure proper structure
  const validated: HealthScore = {
    overall: Math.max(Math.min(response.overall || 50, 100), 0),
    breakdown: {
      testCoverage: Math.max(Math.min(response.breakdown?.testCoverage || 50, 100), 0),
      readmeQuality: Math.max(Math.min(response.breakdown?.readmeQuality || 50, 100), 0),
      linterPresence: Math.max(Math.min(response.breakdown?.linterPresence || 50, 100), 0),
      ciCdPresence: Math.max(Math.min(response.breakdown?.ciCdPresence || 50, 100), 0),
      codeQuality: Math.max(Math.min(response.breakdown?.codeQuality || 50, 100), 0),
      security: Math.max(Math.min(response.breakdown?.security || 50, 100), 0)
    },
    summary: {
      testCoverage: response.summary?.testCoverage || 'Analysis not available',
      readme: response.summary?.readme || 'Analysis not available',
      linter: response.summary?.linter || 'Analysis not available',
      ciCd: response.summary?.ciCd || 'Analysis not available',
      codeQuality: response.summary?.codeQuality || 'Analysis not available',
      security: response.summary?.security || 'Analysis not available'
    },
    aiTips: Array.isArray(response.aiTips) ? response.aiTips.slice(0, 10) : [
      'Add comprehensive testing suite',
      'Improve documentation quality',
      'Set up CI/CD pipeline',
      'Implement code quality tools'
    ],
    lastUpdated: new Date(response.lastUpdated || Date.now())
  }

  return validated
}
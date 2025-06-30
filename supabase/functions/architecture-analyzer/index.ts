/*
  # Auto-Architecture Visualizer Edge Function

  1. Purpose
    - Uses OpenAI to generate intelligent Mermaid.js architecture diagrams
    - Analyzes repository structure, dependencies, and configuration files
    - Creates production-ready visual architecture representations

  2. Features
    - Intelligent component identification (frontend, backend, database, services)
    - Framework-aware diagram generation
    - Infrastructure pattern recognition
    - Clean, readable Mermaid syntax output
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ArchitectureRequest {
  languageStats: Record<string, number>
  keyFiles: Array<{ fileName: string; content: string }>
  filePaths: string[]
  repoInfo: { name: string; owner: string; description?: string }
  techStackDetailed: any
}

interface ArchitectureResponse {
  mermaidCode: string
  components: string[]
  architecture: string
  reasoning: string
  confidence: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { languageStats, keyFiles, filePaths, repoInfo, techStackDetailed }: ArchitectureRequest = await req.json()
    
    // Check OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Build comprehensive architecture analysis prompt
    const architecturePrompt = buildArchitecturePrompt(languageStats, keyFiles, filePaths, repoInfo, techStackDetailed)
    
    // Call OpenAI for architecture diagram generation
    const architectureResponse = await callOpenAIForArchitecture(architecturePrompt, openaiApiKey)
    
    return new Response(JSON.stringify(architectureResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error in architecture analyzer:', error)
    
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

function buildArchitecturePrompt(
  languageStats: Record<string, number>, 
  keyFiles: Array<{ fileName: string; content: string }>,
  filePaths: string[],
  repoInfo: { name: string; owner: string; description?: string },
  techStackDetailed: any
): string {
  // Enhanced language analysis
  const languageBreakdown = Object.keys(languageStats).length > 0
    ? Object.entries(languageStats)
        .sort(([,a], [,b]) => b - a)
        .map(([lang, percentage]) => `${lang}: ${percentage}%`)
        .join(', ')
    : 'Mixed languages detected'

  // Directory structure analysis
  const directoryStructure = analyzeDirectoryStructure(filePaths)
  
  // Key configuration files processing
  const processedKeyFiles = keyFiles
    .slice(0, 8)
    .map(file => {
      let content = file.content
      if (content.length > 2000) {
        content = smartConfigExtraction(content, file.fileName)
      }
      return `=== ${file.fileName} ===\n${content}\n`
    })
    .join('\n')

  // Tech stack summary
  const techStackSummary = buildTechStackSummary(techStackDetailed)

  return `You are a senior software architect specializing in system design and architecture visualization.

Your task is to generate a high-level visual architecture diagram in Mermaid.js format for this GitHub repository.

🏷️ REPOSITORY CONTEXT:
Project: ${repoInfo.name} by ${repoInfo.owner}
${repoInfo.description ? `Description: ${repoInfo.description}` : 'No description provided'}

📊 LANGUAGE STATISTICS:
${languageBreakdown}

🏗️ TECH STACK ANALYSIS:
${techStackSummary}

📁 DIRECTORY STRUCTURE:
${directoryStructure}

🔧 KEY CONFIGURATION FILES:
${processedKeyFiles || 'No configuration files available'}

🎯 ARCHITECTURE ANALYSIS REQUIREMENTS:

**IDENTIFICATION TASKS:**
1. **Component Analysis**: Identify if the app has multiple components (frontend/backend/services/database)
2. **Framework Detection**: Identify specific frameworks (React, Django, Express, Next.js, etc.)
3. **Database Systems**: Detect database technologies (PostgreSQL, MongoDB, Redis, etc.)
4. **Infrastructure**: Identify deployment and infrastructure tools (Docker, CI/CD, cloud services)
5. **Communication Patterns**: Understand how components interact

**DIAGRAM GENERATION RULES:**
1. **Format**: Use Mermaid.js flowchart syntax (graph TD or graph LR)
2. **Node Labels**: Include technology names in brackets [Technology Name]
3. **Arrows**: Show communication paths with descriptive labels
4. **Clarity**: Keep diagram clean and readable (max 12-15 nodes)
5. **Accuracy**: Only include technologies that can be reasonably inferred
6. **Styling**: Use appropriate node shapes and colors for different component types

**MERMAID SYNTAX GUIDELINES:**
- Use \`graph TD\` for top-down flow or \`graph LR\` for left-right flow
- Node format: \`NodeID[Display Name]\` or \`NodeID[(Database)]\` for databases
- Arrows: \`A --> B\` or \`A -->|Label| B\` for labeled connections
- Subgraphs: \`subgraph "Group Name"\` for logical groupings
- Comments: Use \`%% Comment\` for additional context

**COMPONENT TYPES TO CONSIDER:**
- **Frontend**: Web UI, Mobile App, Desktop App
- **Backend**: API Server, Application Server, Microservices
- **Database**: Primary DB, Cache, Search Engine
- **External Services**: Third-party APIs, Payment processors, Auth providers
- **Infrastructure**: Load Balancer, CDN, Message Queue, File Storage
- **Development**: CI/CD, Monitoring, Logging

**OUTPUT REQUIREMENTS:**
Provide a JSON response with this exact structure:

{
  "mermaidCode": "Complete Mermaid.js diagram code (NO backticks, NO explanations)",
  "components": ["List", "of", "identified", "components"],
  "architecture": "Architecture pattern description (e.g., 'JAMstack SPA', 'Microservices', 'Monolithic Full-stack')",
  "reasoning": "Detailed explanation of architectural decisions and component relationships",
  "confidence": 85
}

**EXAMPLE MERMAID OUTPUT PATTERNS:**

For a React + Express + MongoDB app:
\`\`\`
graph TD
    Client[Web Browser] --> Frontend[React Frontend]
    Frontend -->|API Calls| Backend[Express.js API]
    Backend -->|Queries| DB[(MongoDB)]
    Backend -->|Auth| Auth[JWT Authentication]
    CI[GitHub Actions] -->|Deploy| Frontend
    CI -->|Deploy| Backend
\`\`\`

For a microservices architecture:
\`\`\`
graph TD
    Client[Client Apps] --> Gateway[API Gateway]
    Gateway --> UserService[User Service]
    Gateway --> OrderService[Order Service]
    Gateway --> PaymentService[Payment Service]
    UserService --> UserDB[(User Database)]
    OrderService --> OrderDB[(Order Database)]
    PaymentService --> PaymentDB[(Payment Database)]
    PaymentService -->|External| Stripe[Stripe API]
\`\`\`

**CRITICAL INSTRUCTIONS:**
1. **NO EXPLANATIONS**: Return only valid Mermaid syntax in the mermaidCode field
2. **NO BACKTICKS**: Do not wrap the Mermaid code in triple backticks
3. **EVIDENCE-BASED**: Base all components on actual evidence from the repository
4. **CLEAN SYNTAX**: Ensure the Mermaid code is syntactically correct and renderable
5. **LOGICAL FLOW**: Show realistic data flow and component interactions
6. **TECHNOLOGY-SPECIFIC**: Use actual framework/technology names, not generic terms

Analyze the repository and generate a comprehensive, accurate architecture diagram that would be valuable for developers understanding this codebase.`
}

function analyzeDirectoryStructure(filePaths: string[]): string {
  const directories = filePaths
    .filter(path => path.endsWith('/'))
    .map(path => path.replace('/', ''))
    .slice(0, 30)

  const files = filePaths.filter(path => !path.endsWith('/'))
  
  const structure = {
    'Frontend Structure': directories.filter(dir => 
      ['src', 'components', 'pages', 'views', 'layouts', 'public', 'static', 'assets', 'styles'].some(pattern => 
        dir.toLowerCase().includes(pattern)
      )
    ),
    'Backend Structure': directories.filter(dir => 
      ['api', 'routes', 'controllers', 'models', 'services', 'middleware', 'server', 'handlers', 'endpoints'].some(pattern => 
        dir.toLowerCase().includes(pattern)
      )
    ),
    'Configuration': directories.filter(dir => 
      ['config', 'configs', '.github', 'scripts', 'build', 'dist', 'tools', 'deployment'].some(pattern => 
        dir.toLowerCase().includes(pattern)
      )
    ),
    'Testing': directories.filter(dir => 
      ['test', 'tests', '__tests__', 'spec', 'cypress', 'e2e', '__mocks__', 'fixtures'].some(pattern => 
        dir.toLowerCase().includes(pattern)
      )
    ),
    'Documentation': directories.filter(dir => 
      ['docs', 'documentation', 'examples', 'demo', 'guides'].some(pattern => 
        dir.toLowerCase().includes(pattern)
      )
    )
  }

  const analysis = Object.entries(structure)
    .filter(([, dirs]) => dirs.length > 0)
    .map(([category, dirs]) => `${category}: ${dirs.slice(0, 5).join(', ')}${dirs.length > 5 ? '...' : ''}`)
    .join('\n')

  return `Total: ${files.length} files, ${directories.length} directories\n${analysis || 'Standard project structure'}`
}

function buildTechStackSummary(techStackDetailed: any): string {
  if (!techStackDetailed) return 'Tech stack analysis not available'
  
  const summary = []
  
  if (techStackDetailed.language) {
    summary.push(`Primary Language: ${techStackDetailed.language}`)
  }
  
  if (techStackDetailed.frontend) {
    summary.push(`Frontend Framework: ${techStackDetailed.frontend}`)
  }
  
  if (techStackDetailed.backend) {
    summary.push(`Backend Framework: ${techStackDetailed.backend}`)
  }
  
  if (techStackDetailed.database) {
    summary.push(`Database: ${techStackDetailed.database}`)
  }
  
  if (techStackDetailed.infra && techStackDetailed.infra.length > 0) {
    summary.push(`Infrastructure: ${techStackDetailed.infra.slice(0, 5).join(', ')}`)
  }
  
  if (techStackDetailed.architecture) {
    summary.push(`Architecture Pattern: ${techStackDetailed.architecture}`)
  }
  
  if (techStackDetailed.confidence) {
    summary.push(`Detection Confidence: ${techStackDetailed.confidence}%`)
  }
  
  return summary.join('\n')
}

function smartConfigExtraction(content: string, fileName: string): string {
  const maxLength = 1500
  
  if (content.length <= maxLength) return content
  
  // JSON files - preserve key sections
  if (fileName.endsWith('.json')) {
    try {
      const parsed = JSON.parse(content)
      
      if (fileName.includes('package.json')) {
        const essential = {
          name: parsed.name,
          scripts: parsed.scripts,
          dependencies: parsed.dependencies,
          devDependencies: parsed.devDependencies
        }
        return JSON.stringify(essential, null, 2)
      }
      
      return JSON.stringify(parsed, null, 2).substring(0, maxLength) + '\n...[truncated]'
    } catch {
      return content.substring(0, maxLength) + '\n...[truncated]'
    }
  }
  
  // Docker Compose - preserve services
  if (fileName.includes('docker-compose')) {
    const lines = content.split('\n')
    const serviceLines = lines.filter(line => 
      line.includes('services:') || 
      line.includes('image:') || 
      line.includes('ports:') || 
      line.includes('environment:') ||
      line.includes('depends_on:') ||
      line.trim().endsWith(':')
    )
    return serviceLines.slice(0, 50).join('\n')
  }
  
  return content.substring(0, maxLength) + '\n...[truncated]'
}

async function callOpenAIForArchitecture(prompt: string, apiKey: string): Promise<ArchitectureResponse> {
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
          content: 'You are a senior software architect who creates clear, accurate Mermaid.js architecture diagrams. You analyze codebases and generate production-quality visual representations of system architecture.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2500,
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
    return validateArchitectureResponse(parsedResponse)
  } catch (parseError) {
    throw new Error(`Invalid JSON response from OpenAI: ${parseError.message}`)
  }
}

function validateArchitectureResponse(response: any): ArchitectureResponse {
  // Validate and clean the response
  const validated: ArchitectureResponse = {
    mermaidCode: response.mermaidCode || generateFallbackDiagram(),
    components: Array.isArray(response.components) ? response.components : ['Application'],
    architecture: response.architecture || 'Standard Application Architecture',
    reasoning: response.reasoning || 'Architecture diagram generated based on repository analysis',
    confidence: Math.max(Math.min(response.confidence || 75, 100), 50)
  }

  // Clean Mermaid code
  validated.mermaidCode = cleanMermaidCode(validated.mermaidCode)
  
  return validated
}

function cleanMermaidCode(code: string): string {
  // Remove any backticks or code block markers
  let cleaned = code.replace(/```mermaid\n?/g, '').replace(/```\n?/g, '')
  
  // Ensure it starts with graph directive
  if (!cleaned.trim().startsWith('graph ')) {
    cleaned = 'graph TD\n' + cleaned
  }
  
  // Remove any extra whitespace
  cleaned = cleaned.trim()
  
  return cleaned
}

function generateFallbackDiagram(): string {
  return `graph TD
    Client[Web Client] --> App[Application]
    App --> Data[(Data Storage)]
    
    style Client fill:#e1f5fe
    style App fill:#f3e5f5
    style Data fill:#e8f5e8`
}
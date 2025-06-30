/*
  # AI-Powered Codebase Explainer Edge Function

  1. Purpose
    - Uses OpenAI GPT-4 to provide intelligent code explanations
    - Analyzes repository context and provides detailed, educational responses
    - Helps users understand any part of the codebase with clear explanations

  2. Features
    - Natural language question processing
    - Context-aware code analysis
    - File and function relationship mapping
    - Educational explanations for all skill levels
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ExplainerRequest {
  question: string
  repoData: {
    name: string
    owner: string
    description: string
    techStack: string[]
    techStackDetailed: any
    structure: any
  }
  context: {
    language: string
    frameworks: string[]
    architecture: string
  }
}

interface ExplainerResponse {
  explanation: string
  context: {
    files?: string[]
    codeSnippets?: Array<{ fileName: string; content: string }>
    relatedTopics?: string[]
  }
  confidence: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { question, repoData, context }: ExplainerRequest = await req.json()
    
    if (!question || !repoData) {
      throw new Error('Question and repository data are required')
    }

    // Check OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Build comprehensive explanation prompt
    const explanationPrompt = buildCodebaseExplanationPrompt(question, repoData, context)
    
    // Call OpenAI for intelligent explanation
    const explanationResponse = await callOpenAIForExplanation(explanationPrompt, openaiApiKey)
    
    return new Response(JSON.stringify(explanationResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error in codebase explainer:', error)
    
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

function buildCodebaseExplanationPrompt(
  question: string,
  repoData: any,
  context: any
): string {
  // Analyze the repository structure for relevant context
  const structureAnalysis = analyzeRepoStructure(repoData.structure)
  const techStackSummary = buildTechStackContext(repoData.techStackDetailed)
  
  return `You are a senior software engineer and technical documentation expert. Your task is to help users understand any part of a GitHub codebase by providing clear, educational explanations.

🏷️ REPOSITORY CONTEXT:
**Project**: ${repoData.name} by ${repoData.owner}
**Description**: ${repoData.description || 'No description provided'}
**Primary Language**: ${context.language}
**Architecture**: ${context.architecture}
**Frameworks**: ${context.frameworks.join(', ') || 'None specified'}

📊 TECH STACK ANALYSIS:
${techStackSummary}

🏗️ PROJECT STRUCTURE:
${structureAnalysis}

❓ USER QUESTION:
"${question}"

🎯 EXPLANATION REQUIREMENTS:

**ANALYSIS APPROACH:**
1. **Question Understanding**: Analyze what the user is asking about
2. **Context Mapping**: Identify relevant files, patterns, and relationships
3. **Educational Explanation**: Provide clear, step-by-step explanations
4. **Code References**: Reference specific files and functions where helpful
5. **Best Practices**: Explain why certain patterns are used

**EXPLANATION STYLE:**
• **Clarity First**: Explain as if teaching a junior developer or hackathon judge
• **Evidence-Based**: Reference actual project structure and patterns
• **Practical Focus**: Show how concepts apply to this specific codebase
• **Progressive Detail**: Start simple, then add technical depth
• **Actionable Insights**: Provide specific file paths and function names

**RESPONSE GUIDELINES:**
• Use bullet points and clear headings for complex explanations
• Reference specific file paths when discussing implementation
• Explain the "why" behind architectural decisions
• Include code patterns and best practices
• Suggest related areas to explore
• Never assume knowledge not shown in the context

**OUTPUT FORMAT:**
Provide a comprehensive explanation that includes:

1. **Direct Answer**: Address the specific question asked
2. **Implementation Details**: How it's implemented in this codebase
3. **File Locations**: Where to find relevant code
4. **Architecture Context**: How it fits into the overall system
5. **Best Practices**: Why this approach is used
6. **Related Concepts**: Connected areas worth exploring

**EXAMPLE RESPONSE STRUCTURE:**

**Database Connection Setup**

The database is initialized in \`backend/db.js\` using Mongoose for MongoDB connectivity.

🔧 **Implementation Details:**
• Connection string stored in environment variables (\`MONGO_URI\`)
• Database setup imported into \`backend/index.js\` as the main entry point
• Connection established when the server starts

📁 **Key Files:**
• \`backend/db.js\` - Database configuration and connection logic
• \`backend/index.js\` - Main server file that imports database setup
• \`.env\` - Environment variables for connection strings

🏗️ **Architecture Pattern:**
This follows the separation of concerns principle by isolating database logic in a dedicated module.

💡 **Why This Approach:**
• Centralized connection management
• Easy to modify database settings
• Reusable across different parts of the application

🔍 **Related Areas:**
• Model definitions in \`models/\` directory
• Database queries in controller files
• Error handling for connection failures

**CRITICAL INSTRUCTIONS:**
1. **Be Specific**: Reference actual files and patterns from the project structure
2. **Stay Contextual**: Base explanations on the actual tech stack and architecture
3. **Educational Focus**: Explain concepts clearly for learning purposes
4. **Practical Guidance**: Provide actionable information about where to find things
5. **Professional Tone**: Write as if briefing a technical team or teaching a developer

Analyze the user's question in the context of this ${context.language} project and provide a comprehensive, educational explanation that helps them understand the codebase better.`
}

function analyzeRepoStructure(structure: any, path: string = '', depth: number = 0): string {
  if (depth > 3) return '' // Limit depth to avoid overwhelming output
  
  const analysis: string[] = []
  
  for (const [name, node] of Object.entries(structure)) {
    const currentPath = path ? `${path}/${name}` : name
    
    if ((node as any).type === 'folder') {
      analysis.push(`📁 ${currentPath}/`)
      if ((node as any).children && depth < 2) {
        const childAnalysis = analyzeRepoStructure((node as any).children, currentPath, depth + 1)
        if (childAnalysis) analysis.push(childAnalysis)
      }
    } else if ((node as any).type === 'file') {
      const explanation = (node as any).explanation || ''
      analysis.push(`📄 ${currentPath}${explanation ? ` - ${explanation}` : ''}`)
    }
  }
  
  return analysis.slice(0, 30).join('\n') // Limit output size
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
  
  if (techStackDetailed.purpose) {
    context.push(`**Project Purpose**: ${techStackDetailed.purpose}`)
  }
  
  return context.join('\n')
}

async function callOpenAIForExplanation(prompt: string, apiKey: string): Promise<ExplainerResponse> {
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
          content: 'You are a senior software engineer and technical documentation expert. You provide clear, educational explanations of codebases that help developers understand complex systems. You always prioritize clarity and practical guidance over technical jargon.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2, // Lower temperature for more focused, educational responses
      max_tokens: 2000,
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

  // Extract file references and related topics from the response
  const fileReferences = extractFileReferences(content)
  const relatedTopics = extractRelatedTopics(content)

  return {
    explanation: content,
    context: {
      files: fileReferences,
      relatedTopics: relatedTopics
    },
    confidence: 85 // High confidence for GPT-4 responses
  }
}

function extractFileReferences(content: string): string[] {
  // Extract file paths mentioned in the explanation
  const filePattern = /`([^`]*\.(js|ts|jsx|tsx|py|go|rs|php|rb|java|kt|swift|dart|css|scss|html|json|yml|yaml|md|txt))`/g
  const pathPattern = /`([^`]*\/[^`]*)`/g
  
  const files = new Set<string>()
  
  let match
  while ((match = filePattern.exec(content)) !== null) {
    files.add(match[1])
  }
  
  while ((match = pathPattern.exec(content)) !== null) {
    if (match[1].includes('/') && !match[1].includes(' ')) {
      files.add(match[1])
    }
  }
  
  return Array.from(files).slice(0, 8) // Limit to 8 file references
}

function extractRelatedTopics(content: string): string[] {
  // Extract related topics mentioned in the explanation
  const topics = new Set<string>()
  
  // Look for common technical terms and concepts
  const topicPatterns = [
    /authentication/gi,
    /database/gi,
    /api/gi,
    /component/gi,
    /routing/gi,
    /middleware/gi,
    /configuration/gi,
    /deployment/gi,
    /testing/gi,
    /security/gi
  ]
  
  topicPatterns.forEach(pattern => {
    const matches = content.match(pattern)
    if (matches) {
      matches.forEach(match => topics.add(match.toLowerCase()))
    }
  })
  
  return Array.from(topics).slice(0, 5) // Limit to 5 related topics
}
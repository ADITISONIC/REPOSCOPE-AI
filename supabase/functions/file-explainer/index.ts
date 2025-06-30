/*
  # Interactive File Explainer Edge Function

  1. Purpose
    - Uses OpenAI GPT-4 to provide intelligent file analysis
    - Explains what files do, why they exist, and how they connect
    - Provides educational insights for any file in the codebase

  2. Features
    - File purpose and usage analysis
    - Technology and framework detection
    - Connection mapping to other files
    - Function and component identification
    - Educational explanations for all skill levels
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FileExplainerRequest {
  filePath: string
  fileName: string
  fileContent?: string
  projectContext: {
    language: string
    frameworks: string[]
    architecture: string
  }
}

interface FileExplanation {
  filename: string
  summary: {
    purpose: string
    usage: string
    connections: string[]
    technologies: string[]
  }
  highlighted_functions: Array<{
    name: string
    description: string
  }>
  confidence: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { filePath, fileName, fileContent, projectContext }: FileExplainerRequest = await req.json()
    
    if (!filePath || !fileName) {
      throw new Error('File path and name are required')
    }

    // Check OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Build comprehensive file analysis prompt
    const analysisPrompt = buildFileAnalysisPrompt(filePath, fileName, fileContent, projectContext)
    
    // Call OpenAI for intelligent file explanation
    const fileExplanation = await callOpenAIForFileAnalysis(analysisPrompt, openaiApiKey)
    
    return new Response(JSON.stringify(fileExplanation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error in file explainer:', error)
    
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

function buildFileAnalysisPrompt(
  filePath: string,
  fileName: string,
  fileContent: string | undefined,
  projectContext: any
): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  const pathSegments = filePath.split('/')
  
  return `You are an expert software architect and code analyst. Your job is to help users understand how individual files in a codebase work.

📁 FILE ANALYSIS REQUEST:
**File Path**: ${filePath}
**File Name**: ${fileName}
**File Extension**: ${extension}
**Directory Context**: ${pathSegments.join(' → ')}

🏗️ PROJECT CONTEXT:
**Primary Language**: ${projectContext.language}
**Frameworks**: ${projectContext.frameworks.join(', ')}
**Architecture**: ${projectContext.architecture}

${fileContent ? `📄 FILE CONTENT:\n${fileContent.substring(0, 3000)}${fileContent.length > 3000 ? '\n...[truncated]' : ''}` : '📄 FILE CONTENT: Not available - analyze from path and context'}

🎯 ANALYSIS REQUIREMENTS:

Your task is to generate a clear and concise explanation of this file, covering:

1. **What the file does**: Describe the main purpose and type of logic it contains
2. **Why it exists**: Explain the role this file plays in the project
3. **How it connects**: Mention what other files this imports, exports, or interacts with
4. **Technologies used**: Identify specific technologies, frameworks, or patterns used

**ANALYSIS METHODOLOGY:**
• **File Type Analysis**: Use extension and naming patterns to understand file purpose
• **Path Analysis**: Use directory structure to infer functionality and relationships
• **Content Analysis**: If available, analyze actual code for specific insights
• **Framework Patterns**: Apply knowledge of common framework patterns and conventions
• **Best Practices**: Explain why certain patterns are used in this context

**RESPONSE FORMAT (JSON):**
{
  "filename": "${filePath}",
  "summary": {
    "purpose": "Clear description of what this file does (e.g., 'React component that renders the navigation header')",
    "usage": "Explanation of how and when this file is used (e.g., 'Used as the main layout component for all pages')",
    "connections": [
      "List of how this file connects to others",
      "Import/export relationships",
      "Dependencies and usage patterns"
    ],
    "technologies": [
      "List of specific technologies used",
      "Frameworks, libraries, patterns"
    ]
  },
  "highlighted_functions": [
    {
      "name": "Function or component name",
      "description": "What this function/component does"
    }
  ],
  "confidence": 85
}

**INTELLIGENT ANALYSIS GUIDELINES:**

**For React Components (.tsx/.jsx):**
• Identify if it's a page, component, or layout
• Explain props, state, and lifecycle
• Mention hooks and context usage
• Describe UI functionality and user interactions

**For Utility Files (.ts/.js in utils/lib):**
• Explain the utility functions provided
• Describe input/output and use cases
• Mention where these utilities are typically used

**For API Files (routes/api directories):**
• Explain the endpoints and HTTP methods
• Describe request/response handling
• Mention database interactions and middleware

**For Configuration Files:**
• Explain what the configuration controls
• Describe how it affects the application
• Mention environment-specific settings

**For Styling Files (.css/.scss):**
• Explain the styling approach and patterns
• Describe responsive design and themes
• Mention component-specific vs global styles

**EXAMPLE ANALYSIS:**

For \`src/components/Header.tsx\`:
{
  "filename": "src/components/Header.tsx",
  "summary": {
    "purpose": "React component that renders the main navigation header with logo, menu items, and user authentication controls",
    "usage": "Used as the primary navigation component across all pages of the application, typically imported into layout components",
    "connections": [
      "Imports navigation data from utils/navigation.ts",
      "Uses authentication context from contexts/AuthContext",
      "Exports Header component for use in layout files",
      "May import icons from lucide-react or similar icon library"
    ],
    "technologies": [
      "React",
      "TypeScript",
      "CSS Modules or Styled Components",
      "React Router (for navigation)",
      "Authentication hooks"
    ]
  },
  "highlighted_functions": [
    {
      "name": "Header()",
      "description": "Main functional component that renders the navigation header with responsive design"
    },
    {
      "name": "handleMenuToggle()",
      "description": "Function that handles mobile menu toggle functionality"
    }
  ],
  "confidence": 90
}

**CRITICAL INSTRUCTIONS:**
1. **Be Specific**: Provide concrete, actionable insights about this specific file
2. **Context Aware**: Consider the file's location and project structure
3. **Educational**: Explain concepts clearly for developers learning the codebase
4. **Practical**: Focus on how this file contributes to the application's functionality
5. **Evidence-Based**: Base analysis on file path, name, extension, and content when available

**CONFIDENCE SCORING:**
• 90-100: Clear file content analysis with specific code insights
• 80-89: Strong path/name analysis with framework knowledge
• 70-79: Good inference from file structure and conventions
• 60-69: Basic analysis from file type and location
• Below 60: Limited information available

Analyze this file comprehensively and provide your expert assessment in the specified JSON format.`
}

async function callOpenAIForFileAnalysis(prompt: string, apiKey: string): Promise<FileExplanation> {
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
          content: 'You are an expert software architect and code analyst who helps developers understand codebases. You provide clear, educational explanations of individual files and their role in the overall system architecture.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent, factual analysis
      max_tokens: 1500,
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
    return validateFileExplanation(parsedResponse)
  } catch (parseError) {
    throw new Error(`Invalid JSON response from OpenAI: ${parseError.message}`)
  }
}

function validateFileExplanation(response: any): FileExplanation {
  // Validate and ensure proper structure
  const validated: FileExplanation = {
    filename: response.filename || 'Unknown file',
    summary: {
      purpose: response.summary?.purpose || 'File purpose not determined',
      usage: response.summary?.usage || 'Usage context not available',
      connections: Array.isArray(response.summary?.connections) ? response.summary.connections : [],
      technologies: Array.isArray(response.summary?.technologies) ? response.summary.technologies : []
    },
    highlighted_functions: Array.isArray(response.highlighted_functions) ? response.highlighted_functions : [],
    confidence: Math.max(Math.min(response.confidence || 70, 100), 50)
  }

  // Ensure arrays have reasonable limits
  validated.summary.connections = validated.summary.connections.slice(0, 6)
  validated.summary.technologies = validated.summary.technologies.slice(0, 8)
  validated.highlighted_functions = validated.highlighted_functions.slice(0, 5)

  return validated
}
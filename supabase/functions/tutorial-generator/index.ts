/*
  # Tutorial/Walkthrough Generator Edge Function

  1. Purpose
    - Generates comprehensive step-by-step tutorials for any repository
    - Creates beginner-friendly setup and development guides
    - Provides troubleshooting tips and additional resources

  2. Features
    - AI-powered tutorial generation using GPT-4
    - Framework-specific setup instructions
    - Interactive step-by-step walkthrough
    - Troubleshooting and common issues
    - Additional learning resources
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface TutorialRequest {
  repoData: {
    name: string
    owner: string
    description: string
    techStack: string[]
    techStackDetailed: any
    structure: any
    analysis: {
      beginner: string
      expert: string
    }
  }
}

interface TutorialWalkthrough {
  id: string
  title: string
  description: string
  estimatedTime: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  prerequisites: string[]
  sections: TutorialSection[]
  troubleshooting: TroubleshootingItem[]
  additionalResources: Resource[]
  generatedAt: Date
}

interface TutorialSection {
  id: string
  title: string
  description: string
  steps: TutorialStep[]
  icon: string
}

interface TutorialStep {
  id: string
  title: string
  description: string
  commands?: string[]
  codeSnippets?: CodeSnippet[]
  notes?: string[]
  expectedOutput?: string
  troubleshooting?: string[]
}

interface CodeSnippet {
  language: string
  code: string
  filename?: string
}

interface TroubleshootingItem {
  problem: string
  solution: string
  commands?: string[]
}

interface Resource {
  title: string
  url: string
  description: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { repoData }: TutorialRequest = await req.json()
    
    if (!repoData) {
      throw new Error('Repository data is required')
    }

    // Check OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Build comprehensive tutorial generation prompt
    const tutorialPrompt = buildTutorialPrompt(repoData)
    
    // Call OpenAI for intelligent tutorial generation
    const tutorialResponse = await callOpenAIForTutorial(tutorialPrompt, openaiApiKey)
    
    return new Response(JSON.stringify(tutorialResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error in tutorial generator:', error)
    
    const errorResponse = {
      error: error.message,
      type: error.message.includes('API key') ? 'configuration' : 'generation',
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

function buildTutorialPrompt(repoData: any): string {
  const structureAnalysis = analyzeProjectStructure(repoData.structure)
  const techStackSummary = buildTechStackContext(repoData.techStackDetailed)
  
  return `You are a senior developer and technical writer specializing in creating clear, beginner-friendly tutorials. Your task is to generate a comprehensive step-by-step walkthrough for setting up and running a GitHub repository locally.

🏷️ REPOSITORY CONTEXT:
**Project**: ${repoData.name} by ${repoData.owner}
**Description**: ${repoData.description || 'No description provided'}
**Tech Stack**: ${repoData.techStack.join(', ')}

📊 TECH STACK ANALYSIS:
${techStackSummary}

🏗️ PROJECT STRUCTURE:
${structureAnalysis}

📚 EXISTING ANALYSIS:
**Beginner Overview**: ${repoData.analysis.beginner.substring(0, 500)}...
**Expert Analysis**: ${repoData.analysis.expert.substring(0, 500)}...

🎯 TUTORIAL GENERATION REQUIREMENTS:

**TARGET AUDIENCE**: Developers who want to run this project locally, ranging from beginners to intermediate level.

**TUTORIAL STRUCTURE**:

1. **Environment Setup** - Installing required tools and dependencies
2. **Repository Setup** - Cloning and initial configuration
3. **Development Environment** - Starting development servers and tools
4. **Testing & Verification** - Ensuring everything works correctly
5. **Framework-Specific Steps** - Additional setup for detected frameworks

**RESPONSE FORMAT (JSON)**:
{
  "id": "tutorial_${Date.now()}",
  "title": "${repoData.name} - Development Setup Guide",
  "description": "Complete walkthrough for setting up and running ${repoData.name} locally",
  "estimatedTime": "15-30 minutes",
  "difficulty": "Beginner",
  "prerequisites": [
    "Basic command line knowledge",
    "Git installed on your system",
    "Text editor or IDE"
  ],
  "sections": [
    {
      "id": "setup",
      "title": "Environment Setup",
      "description": "Install required dependencies and tools",
      "icon": "🛠️",
      "steps": [
        {
          "id": "install-node",
          "title": "Install Node.js",
          "description": "Install Node.js and npm package manager",
          "commands": [
            "# Download from https://nodejs.org/",
            "node --version",
            "npm --version"
          ],
          "notes": [
            "Ensure Node.js version 16 or higher",
            "npm comes bundled with Node.js"
          ],
          "expectedOutput": "v18.x.x (or higher)"
        }
      ]
    }
  ],
  "troubleshooting": [
    {
      "problem": "Port already in use error",
      "solution": "Kill the process using the port or use a different port",
      "commands": [
        "lsof -ti:3000 | xargs kill -9",
        "npm run dev -- --port 3001"
      ]
    }
  ],
  "additionalResources": [
    {
      "title": "Project Documentation",
      "url": "${repoData.url || `https://github.com/${repoData.owner}/${repoData.name}`}#readme",
      "description": "Official project README and documentation"
    }
  ],
  "generatedAt": "${new Date().toISOString()}"
}

**DETAILED REQUIREMENTS**:

**Environment Setup Section**:
- Include installation of primary language runtime (Node.js, Python, etc.)
- Package manager setup (npm, pip, etc.)
- Any required global tools or CLI utilities
- Environment variable setup if needed

**Repository Setup Section**:
- Git clone instructions with proper URL
- Directory navigation
- Initial configuration steps
- Environment file setup (.env examples)

**Development Environment Section**:
- Dependency installation commands
- Development server startup
- Database setup if applicable
- Any required build steps

**Testing & Verification Section**:
- How to verify the setup worked
- Basic functionality tests
- Browser access instructions
- API endpoint testing if applicable

**Framework-Specific Guidelines**:

**For React/Next.js Projects**:
- Include npm/yarn installation
- Development server startup (npm run dev)
- Browser access instructions
- Hot reload explanation

**For Node.js Backend Projects**:
- Environment variable setup
- Database connection verification
- API endpoint testing with curl
- Development vs production modes

**For Python Projects**:
- Virtual environment setup
- Requirements installation
- Django/Flask specific commands
- Database migrations if applicable

**For Full-Stack Projects**:
- Separate frontend and backend setup
- Concurrent development server instructions
- API connection verification
- Database setup and seeding

**STEP STRUCTURE**:
Each step should include:
- Clear, descriptive title
- Detailed description of what the step accomplishes
- Exact commands to run (with proper syntax)
- Expected output or success indicators
- Helpful notes and tips
- Common troubleshooting for that step

**TROUBLESHOOTING SECTION**:
Include common issues like:
- Port conflicts
- Permission errors
- Missing dependencies
- Environment variable issues
- Database connection problems
- Build failures

**ADDITIONAL RESOURCES**:
- Official documentation links
- Framework-specific guides
- Community resources
- Video tutorials if applicable

**CRITICAL INSTRUCTIONS**:
1. **Beginner-Friendly**: Write for developers who may be new to the tech stack
2. **Complete Commands**: Provide exact, copy-pasteable commands
3. **Clear Explanations**: Explain what each step accomplishes and why
4. **Error Prevention**: Include notes to prevent common mistakes
5. **Verification Steps**: Always include ways to verify each step worked
6. **Framework-Aware**: Tailor instructions to the detected tech stack
7. **Realistic Timing**: Provide accurate time estimates for each section

Generate a comprehensive, production-quality tutorial that would help any developer successfully set up and run this project locally.`
}

function analyzeProjectStructure(structure: any, path: string = '', depth: number = 0): string {
  if (depth > 2) return '' // Limit depth for tutorial context
  
  const analysis: string[] = []
  const importantFiles: string[] = []
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
      if (isImportantFile(name)) {
        importantFiles.push(currentPath)
      }
    }
  }
  
  const summary = []
  if (importantFiles.length > 0) {
    summary.push(`**Key Files**: ${importantFiles.slice(0, 8).join(', ')}`)
  }
  if (directories.length > 0) {
    summary.push(`**Main Directories**: ${directories.slice(0, 6).join(', ')}`)
  }
  
  return summary.join('\n')
}

function isImportantFile(filename: string): boolean {
  const important = [
    'package.json', 'requirements.txt', 'Pipfile', 'go.mod', 'Cargo.toml',
    'Dockerfile', 'docker-compose.yml', '.env.example', 'README.md',
    'tsconfig.json', 'next.config.js', 'vite.config.ts', 'angular.json'
  ]
  return important.some(file => filename.toLowerCase().includes(file.toLowerCase()))
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
  
  return context.join('\n')
}

async function callOpenAIForTutorial(prompt: string, apiKey: string): Promise<TutorialWalkthrough> {
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
          content: 'You are a senior developer and technical writer who creates exceptional step-by-step tutorials. You write clear, beginner-friendly guides that help developers successfully set up and run projects locally. Your tutorials are comprehensive, well-organized, and include practical troubleshooting advice.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent, reliable tutorials
      max_tokens: 4000,
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
    return validateTutorialResponse(parsedResponse)
  } catch (parseError) {
    throw new Error(`Invalid JSON response from OpenAI: ${parseError.message}`)
  }
}

function validateTutorialResponse(response: any): TutorialWalkthrough {
  // Validate and ensure proper structure
  const validated: TutorialWalkthrough = {
    id: response.id || `tutorial_${Date.now()}`,
    title: response.title || 'Development Setup Guide',
    description: response.description || 'Step-by-step guide for local development',
    estimatedTime: response.estimatedTime || '15-30 minutes',
    difficulty: ['Beginner', 'Intermediate', 'Advanced'].includes(response.difficulty) 
      ? response.difficulty : 'Beginner',
    prerequisites: Array.isArray(response.prerequisites) ? response.prerequisites : [
      'Basic command line knowledge',
      'Git installed on your system',
      'Text editor or IDE'
    ],
    sections: Array.isArray(response.sections) ? response.sections.map(validateSection) : [],
    troubleshooting: Array.isArray(response.troubleshooting) ? response.troubleshooting : [],
    additionalResources: Array.isArray(response.additionalResources) ? response.additionalResources : [],
    generatedAt: new Date(response.generatedAt || Date.now())
  }

  // Ensure we have at least basic sections
  if (validated.sections.length === 0) {
    validated.sections = [
      {
        id: 'setup',
        title: 'Environment Setup',
        description: 'Install required dependencies and tools',
        icon: '🛠️',
        steps: [
          {
            id: 'clone-repo',
            title: 'Clone Repository',
            description: 'Clone the project repository to your local machine',
            commands: ['git clone <repository-url>', 'cd <project-directory>']
          }
        ]
      }
    ]
  }

  return validated
}

function validateSection(section: any): TutorialSection {
  return {
    id: section.id || `section_${Date.now()}`,
    title: section.title || 'Setup Step',
    description: section.description || 'Configuration step',
    icon: section.icon || '⚙️',
    steps: Array.isArray(section.steps) ? section.steps.map(validateStep) : []
  }
}

function validateStep(step: any): TutorialStep {
  return {
    id: step.id || `step_${Date.now()}`,
    title: step.title || 'Setup Step',
    description: step.description || 'Configuration step',
    commands: Array.isArray(step.commands) ? step.commands : undefined,
    codeSnippets: Array.isArray(step.codeSnippets) ? step.codeSnippets : undefined,
    notes: Array.isArray(step.notes) ? step.notes : undefined,
    expectedOutput: step.expectedOutput || undefined,
    troubleshooting: Array.isArray(step.troubleshooting) ? step.troubleshooting : undefined
  }
}
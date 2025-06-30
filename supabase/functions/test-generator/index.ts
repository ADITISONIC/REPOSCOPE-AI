/*
  # AI Test Case Generator Edge Function

  1. Purpose
    - Uses OpenAI GPT-4 to generate comprehensive test cases for any function
    - Analyzes function complexity and generates appropriate test strategies
    - Supports multiple testing frameworks (Jest, Vitest, Pytest)

  2. Features
    - Intelligent test case generation based on function analysis
    - Framework-specific test syntax and best practices
    - Edge case identification and coverage analysis
    - Performance and accessibility testing suggestions
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface TestGeneratorRequest {
  fileName: string
  functionName: string
  fileContent?: string
  projectContext: {
    language: string
    frameworks: string[]
    testFramework: string
  }
}

interface TestGeneratorResponse {
  testFramework: string
  language: string
  functionName: string
  testFileName: string
  testCases: string
  confidence: number
  explanation: string
  edgeCases: string[]
  coverage: string[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fileName, functionName, fileContent, projectContext }: TestGeneratorRequest = await req.json()
    
    if (!fileName || !functionName) {
      throw new Error('File name and function name are required')
    }

    // Check OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Build comprehensive test generation prompt
    const testPrompt = buildTestGenerationPrompt(fileName, functionName, fileContent, projectContext)
    
    // Call OpenAI for intelligent test generation
    const testResponse = await callOpenAIForTestGeneration(testPrompt, openaiApiKey)
    
    return new Response(JSON.stringify(testResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error in test generator:', error)
    
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

function buildTestGenerationPrompt(
  fileName: string,
  functionName: string,
  fileContent: string | undefined,
  projectContext: any
): string {
  const framework = projectContext.testFramework || 'jest'
  const language = projectContext.language || 'JavaScript'
  const frameworks = projectContext.frameworks || []
  
  return `You are an expert test engineer specializing in automated testing and quality assurance. Your task is to generate comprehensive, production-quality test cases for a specific function.

📁 FUNCTION ANALYSIS REQUEST:
**File**: ${fileName}
**Function**: ${functionName}
**Language**: ${language}
**Test Framework**: ${framework}
**Project Frameworks**: ${frameworks.join(', ')}

${fileContent ? `📄 FILE CONTENT:\n${fileContent.substring(0, 4000)}${fileContent.length > 4000 ? '\n...[truncated]' : ''}` : '📄 FILE CONTENT: Not available - generate tests based on function name and context'}

🎯 TEST GENERATION REQUIREMENTS:

**ANALYSIS APPROACH:**
1. **Function Understanding**: Analyze what the function does based on name, context, and content
2. **Test Strategy**: Determine appropriate testing approach (unit, integration, component)
3. **Edge Case Identification**: Identify potential failure points and boundary conditions
4. **Framework Best Practices**: Use framework-specific patterns and conventions
5. **Coverage Planning**: Ensure comprehensive test coverage across all scenarios

**TEST CASE CATEGORIES TO INCLUDE:**
• **Happy Path**: Normal, expected usage scenarios
• **Edge Cases**: Boundary values, empty inputs, null/undefined handling
• **Error Handling**: Invalid inputs, exception scenarios, error boundaries
• **Type Safety**: Input validation, type checking (especially for TypeScript)
• **Performance**: Large inputs, timeout scenarios (if applicable)
• **Integration**: Mocked dependencies, external service interactions
• **Accessibility**: ARIA attributes, keyboard navigation (for React components)

**FRAMEWORK-SPECIFIC GUIDELINES:**

**For Jest/Vitest (JavaScript/TypeScript):**
• Use \`describe\` and \`it\` blocks for organization
• Include \`beforeEach\`/\`afterEach\` for setup/cleanup
• Use \`vi.fn()\` or \`jest.fn()\` for mocking
• Include React Testing Library for component tests
• Add \`waitFor\` for async operations
• Use \`expect\` assertions with specific matchers

**For Pytest (Python):**
• Use class-based test organization
• Include \`@pytest.fixture\` for setup
• Use \`@pytest.mark.parametrize\` for data-driven tests
• Include \`@patch\` decorators for mocking
• Add docstrings for test documentation
• Use \`assert\` statements with clear messages

**RESPONSE FORMAT (JSON):**
{
  "testFramework": "${framework}",
  "language": "${language}",
  "functionName": "${functionName}",
  "testFileName": "Generated test file name with proper extension",
  "testCases": "Complete, runnable test code with all imports and setup",
  "confidence": 90,
  "explanation": "Clear explanation of the testing strategy and approach used",
  "edgeCases": ["List", "of", "edge", "cases", "covered"],
  "coverage": ["Areas", "of", "functionality", "tested"]
}

**QUALITY REQUIREMENTS:**
• **Runnable Code**: Generate complete, syntactically correct test files
• **Comprehensive Coverage**: Include at least 6-8 test cases covering different scenarios
• **Clear Documentation**: Add comments explaining complex test logic
• **Best Practices**: Follow testing conventions and patterns for the framework
• **Realistic Scenarios**: Base tests on actual usage patterns and potential issues

**EXAMPLE TEST STRUCTURE:**

For a React component:
\`\`\`javascript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ComponentName } from './ComponentName'

describe('ComponentName', () => {
  it('renders without crashing', () => {
    render(<ComponentName />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
  
  it('handles props correctly', () => {
    const props = { title: 'Test' }
    render(<ComponentName {...props} />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
  
  // ... more test cases
})
\`\`\`

For a utility function:
\`\`\`javascript
import { describe, it, expect } from 'vitest'
import { functionName } from './utils'

describe('functionName', () => {
  it('returns correct result for valid input', () => {
    const result = functionName('valid input')
    expect(result).toBe('expected output')
  })
  
  it('throws error for invalid input', () => {
    expect(() => functionName(null)).toThrow()
  })
  
  // ... more test cases
})
\`\`\`

**CRITICAL INSTRUCTIONS:**
1. **Complete Code**: Provide full, runnable test files with all necessary imports
2. **Framework Accuracy**: Use correct syntax and patterns for the specified framework
3. **Comprehensive Testing**: Cover normal cases, edge cases, and error scenarios
4. **Professional Quality**: Write tests that would pass code review in a production environment
5. **Clear Documentation**: Include comments and clear test descriptions

Generate comprehensive test cases that demonstrate professional testing practices and ensure robust code quality.`
}

async function callOpenAIForTestGeneration(prompt: string, apiKey: string): Promise<TestGeneratorResponse> {
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
          content: 'You are an expert test engineer who generates comprehensive, production-quality test cases. You write clean, well-documented tests that follow best practices and provide excellent coverage.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent, reliable test generation
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
    return validateTestResponse(parsedResponse)
  } catch (parseError) {
    throw new Error(`Invalid JSON response from OpenAI: ${parseError.message}`)
  }
}

function validateTestResponse(response: any): TestGeneratorResponse {
  // Validate and ensure proper structure
  const validated: TestGeneratorResponse = {
    testFramework: response.testFramework || 'jest',
    language: response.language || 'JavaScript',
    functionName: response.functionName || 'unknown',
    testFileName: response.testFileName || 'test.js',
    testCases: response.testCases || '// No test cases generated',
    confidence: Math.max(Math.min(response.confidence || 80, 100), 60),
    explanation: response.explanation || 'Test cases generated using AI analysis',
    edgeCases: Array.isArray(response.edgeCases) ? response.edgeCases.slice(0, 8) : [],
    coverage: Array.isArray(response.coverage) ? response.coverage.slice(0, 6) : []
  }

  // Ensure arrays have reasonable content
  if (validated.edgeCases.length === 0) {
    validated.edgeCases = ['Null inputs', 'Empty data', 'Invalid types', 'Boundary values']
  }
  
  if (validated.coverage.length === 0) {
    validated.coverage = ['Happy path', 'Error handling', 'Edge cases', 'Input validation']
  }

  return validated
}
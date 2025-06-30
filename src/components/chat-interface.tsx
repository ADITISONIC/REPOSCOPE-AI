import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Code, FileText, Search, Lightbulb, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { RepoData } from '@/types'
import { toast } from 'sonner'

interface ChatInterfaceProps {
  repoData: RepoData
}

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  context?: {
    files?: string[]
    codeSnippets?: Array<{ fileName: string; content: string }>
  }
}

interface CodebaseQuestion {
  question: string
  category: 'structure' | 'functionality' | 'patterns' | 'setup'
  icon: any
}

export function ChatInterface({ repoData }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: `Hi! I'm your AI codebase assistant for **${repoData.name}**. I can help you understand any part of this ${repoData.techStackDetailed.language} project.\n\n🔍 **What I can explain:**\n• Code functionality and logic\n• File purposes and relationships\n• Architecture patterns and design decisions\n• Setup and configuration details\n• Best practices and recommendations\n\n**Just ask me anything about the codebase!**`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const suggestedQuestions: CodebaseQuestion[] = [
    {
      question: "Where is the database connection set up?",
      category: 'setup',
      icon: FileText
    },
    {
      question: "How does the authentication system work?",
      category: 'functionality',
      icon: Code
    },
    {
      question: "What is the main entry point of this application?",
      category: 'structure',
      icon: Search
    },
    {
      question: "Explain the component architecture",
      category: 'patterns',
      icon: Lightbulb
    },
    {
      question: "How are API routes organized?",
      category: 'structure',
      icon: FileText
    },
    {
      question: "What testing strategy is used here?",
      category: 'patterns',
      icon: Code
    }
  ]

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  const handleSend = async (question?: string) => {
    const messageText = question || input.trim()
    if (!messageText) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      // Call the codebase explainer edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/codebase-explainer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          question: messageText,
          repoData: {
            name: repoData.name,
            owner: repoData.owner,
            description: repoData.description,
            techStack: repoData.techStack,
            techStackDetailed: repoData.techStackDetailed,
            structure: repoData.structure
          },
          context: {
            language: repoData.techStackDetailed.language,
            frameworks: [
              repoData.techStackDetailed.frontend,
              repoData.techStackDetailed.backend
            ].filter(Boolean),
            architecture: repoData.techStackDetailed.architecture
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to get explanation')
      }

      const data = await response.json()
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.explanation,
        timestamp: new Date(),
        context: data.context
      }
      
      setMessages([...newMessages, botMessage])
      toast.success('Explanation generated!')
      
    } catch (error) {
      console.error('Error getting explanation:', error)
      
      // Fallback to intelligent local response
      const fallbackResponse = generateIntelligentFallback(messageText, repoData)
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: fallbackResponse,
        timestamp: new Date(),
      }
      
      setMessages([...newMessages, botMessage])
      toast.warning('Using local analysis - AI service unavailable')
      
    } finally {
      setIsLoading(false)
    }
  }

  const generateIntelligentFallback = (question: string, repo: RepoData): string => {
    const lowerQuestion = question.toLowerCase()
    const { techStackDetailed } = repo
    
    // Database questions
    if (lowerQuestion.includes('database') || lowerQuestion.includes('db') || lowerQuestion.includes('connection')) {
      if (techStackDetailed.database) {
        return `**Database Setup Analysis**\n\nBased on the detected tech stack, this project uses **${techStackDetailed.database}**.\n\n🔧 **Typical Setup Locations:**\n• Configuration files (config/ directory)\n• Environment variables (.env files)\n• Database utility files (utils/db.js, lib/database.ts)\n• Main application entry point\n\n📁 **Files to Check:**\n• Look for connection strings in config files\n• Check for database imports in main app files\n• Search for ORM/ODM setup (Mongoose, Prisma, etc.)\n\n💡 **${techStackDetailed.database} typically connects via:**\n• Connection strings in environment variables\n• Configuration objects in setup files\n• Database client initialization in utility modules`
      } else {
        return `**Database Analysis**\n\nNo specific database technology was detected in this repository.\n\n🔍 **To find database setup:**\n• Check package.json for database dependencies\n• Look for connection files in config/ or lib/ directories\n• Search for environment variables related to database URLs\n• Check for ORM/ODM configuration files`
      }
    }
    
    // Authentication questions
    if (lowerQuestion.includes('auth') || lowerQuestion.includes('login') || lowerQuestion.includes('user')) {
      return `**Authentication System Analysis**\n\nBased on the ${techStackDetailed.language} tech stack:\n\n🔐 **Common Auth Patterns:**\n• JWT token-based authentication\n• Session-based authentication\n• OAuth integration with third-party providers\n\n📁 **Typical File Locations:**\n• \`middleware/auth.js\` - Authentication middleware\n• \`routes/auth.js\` - Authentication routes\n• \`utils/jwt.js\` - Token utilities\n• \`components/Login.tsx\` - Login components\n\n🔧 **Implementation Details:**\n• Check for JWT libraries in package.json\n• Look for authentication middleware in route files\n• Search for login/logout endpoints in API routes\n• Check for protected route implementations\n\n💡 **${techStackDetailed.frontend || 'Frontend'} Auth:**\n• Token storage (localStorage, cookies)\n• Protected route components\n• Authentication context/state management`
    }
    
    // Entry point questions
    if (lowerQuestion.includes('entry point') || lowerQuestion.includes('main') || lowerQuestion.includes('start')) {
      const entryPoints = []
      
      if (techStackDetailed.frontend) {
        if (techStackDetailed.frontend.includes('React')) {
          entryPoints.push('• **Frontend**: `src/main.tsx` or `src/index.tsx` - React application entry')
        } else if (techStackDetailed.frontend.includes('Vue')) {
          entryPoints.push('• **Frontend**: `src/main.js` - Vue application entry')
        } else if (techStackDetailed.frontend.includes('Angular')) {
          entryPoints.push('• **Frontend**: `src/main.ts` - Angular application bootstrap')
        }
      }
      
      if (techStackDetailed.backend) {
        if (techStackDetailed.language === 'JavaScript' || techStackDetailed.language === 'TypeScript') {
          entryPoints.push('• **Backend**: `server.js`, `app.js`, or `index.js` - Node.js server')
        } else if (techStackDetailed.language === 'Python') {
          entryPoints.push('• **Backend**: `main.py`, `app.py`, or `manage.py` - Python application')
        }
      }
      
      return `**Application Entry Points**\n\n🚀 **Main Entry Points for ${repo.name}:**\n\n${entryPoints.join('\n') || '• Check package.json "main" field for entry point\n• Look for server.js, app.js, or index.js files\n• Check for src/main.tsx or src/index.tsx for frontend apps'}\n\n📋 **How to Verify:**\n• Check package.json "scripts" section for start commands\n• Look for app.listen() calls in Node.js apps\n• Check for ReactDOM.render() in React apps\n• Search for application initialization code\n\n🔧 **Architecture**: ${techStackDetailed.architecture}\n**Purpose**: ${techStackDetailed.purpose || 'Web Application'}`
    }
    
    // Component architecture questions
    if (lowerQuestion.includes('component') || lowerQuestion.includes('architecture') || lowerQuestion.includes('structure')) {
      return `**Component Architecture Analysis**\n\n🏗️ **Architecture Pattern**: ${techStackDetailed.architecture}\n\n📁 **Component Organization:**\n• \`src/components/\` - Reusable UI components\n• \`src/pages/\` or \`src/views/\` - Page-level components\n• \`src/layouts/\` - Layout wrapper components\n• \`src/hooks/\` - Custom React hooks (if React)\n\n🔧 **${techStackDetailed.frontend || 'Frontend'} Patterns:**\n• Component-based architecture\n• Props and state management\n• Reusable component library\n• Separation of concerns\n\n💡 **Best Practices Observed:**\n• Modular component structure\n• Clear separation between UI and logic\n• Consistent naming conventions\n• ${techStackDetailed.language} type safety\n\n🎯 **Key Files to Explore:**\n• Main App component for routing setup\n• Component index files for exports\n• Shared utility components\n• Theme and styling components`
    }
    
    // API routes questions
    if (lowerQuestion.includes('api') || lowerQuestion.includes('route') || lowerQuestion.includes('endpoint')) {
      return `**API Routes Organization**\n\n🛣️ **Route Structure for ${techStackDetailed.backend || 'Backend'}:**\n\n📁 **Common Patterns:**\n• \`routes/\` or \`api/\` directory for route definitions\n• \`controllers/\` for business logic\n• \`middleware/\` for request processing\n• \`models/\` for data models\n\n🔧 **${techStackDetailed.backend || 'Express'} Implementation:**\n• RESTful API design principles\n• Route parameter handling\n• Middleware chain processing\n• Error handling and validation\n\n📋 **Typical Route Files:**\n• \`routes/users.js\` - User management endpoints\n• \`routes/auth.js\` - Authentication endpoints\n• \`routes/api.js\` - Main API router\n• \`middleware/auth.js\` - Authentication middleware\n\n💡 **API Design Patterns:**\n• HTTP method conventions (GET, POST, PUT, DELETE)\n• Status code handling\n• Request/response formatting\n• Input validation and sanitization`
    }
    
    // Testing questions
    if (lowerQuestion.includes('test') || lowerQuestion.includes('testing')) {
      const testingTools = techStackDetailed.infra.filter((tool: string) => 
        tool.toLowerCase().includes('test') || 
        tool.toLowerCase().includes('jest') || 
        tool.toLowerCase().includes('cypress')
      )
      
      return `**Testing Strategy Analysis**\n\n🧪 **Testing Framework**: ${testingTools.length > 0 ? testingTools.join(', ') : 'Standard testing tools'}\n\n📁 **Test Organization:**\n• \`__tests__/\` or \`tests/\` - Test files directory\n• \`*.test.js\` or \`*.spec.js\` - Individual test files\n• \`cypress/\` - End-to-end tests (if Cypress)\n• \`__mocks__/\` - Mock files and fixtures\n\n🔧 **Testing Patterns:**\n• Unit tests for individual functions/components\n• Integration tests for API endpoints\n• Component testing for UI elements\n• End-to-end testing for user workflows\n\n💡 **${techStackDetailed.language} Testing:**\n• Type-safe test implementations\n• Mock and stub patterns\n• Test data management\n• Assertion libraries and matchers\n\n🎯 **Key Testing Areas:**\n• Component rendering and behavior\n• API endpoint functionality\n• Authentication and authorization\n• Database operations and data flow`
    }
    
    // Generic fallback
    return `**Codebase Analysis for "${question}"**\n\n🔍 **Project Context:**\n• **Language**: ${techStackDetailed.language}\n• **Architecture**: ${techStackDetailed.architecture}\n• **Tech Stack**: ${repo.techStack.join(', ')}\n\n📁 **To find information about "${question}":**\n\n1. **Search Strategy:**\n   • Look for relevant keywords in file names\n   • Check configuration files and package.json\n   • Examine the main application entry points\n   • Review component and utility directories\n\n2. **Common Locations:**\n   • \`src/\` - Main source code\n   • \`config/\` - Configuration files\n   • \`utils/\` or \`lib/\` - Utility functions\n   • \`components/\` - UI components\n   • \`api/\` or \`routes/\` - API endpoints\n\n3. **Documentation:**\n   • README.md for setup instructions\n   • Code comments and JSDoc\n   • Type definitions and interfaces\n\n💡 **Need more specific help?** Try asking about:\n• Specific file purposes\n• Function implementations\n• Configuration setup\n• Architecture patterns\n• Development workflow`
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'structure': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'functionality': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'patterns': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'setup': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <Card className="h-[700px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span>AI Codebase Assistant</span>
            <Badge variant="secondary" className="ml-2">
              <Zap className="w-3 h-3 mr-1" />
              Powered by GPT-4
            </Badge>
          </div>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ask me anything about the {repoData.name} codebase - I'll explain code, architecture, and functionality
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-medium text-muted-foreground">💡 Suggested Questions:</h4>
            <div className="grid grid-cols-1 gap-2">
              {suggestedQuestions.map((q, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSend(q.question)}
                  className="flex items-center space-x-3 p-3 text-left bg-muted/50 hover:bg-muted rounded-lg transition-colors group"
                  disabled={isLoading}
                >
                  <q.icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                  <span className="text-sm flex-1">{q.question}</span>
                  <Badge variant="outline" className={`text-xs ${getCategoryColor(q.category)}`}>
                    {q.category}
                  </Badge>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-[85%] ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`rounded-lg px-4 py-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <div 
                          className="whitespace-pre-wrap text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ 
                            __html: message.content
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em>$1</em>')
                              .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs">$1</code>')
                              .replace(/^• /gm, '• ')
                              .replace(/\n/g, '<br>')
                          }}
                        />
                      </div>
                      
                      {/* Context Information */}
                      {message.context && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          {message.context.files && (
                            <div className="flex flex-wrap gap-1">
                              {message.context.files.map((file, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {file}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        {message.type === 'bot' && (
                          <Badge variant="outline" className="text-xs">
                            <Zap className="w-3 h-3 mr-1" />
                            AI
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-secondary rounded-lg px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-foreground/60 rounded-full"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">Analyzing codebase...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex space-x-2">
          <Input
            placeholder="Ask about any part of the codebase..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={() => handleSend()} 
            disabled={!input.trim() || isLoading}
            size="sm"
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground text-center">
          💡 Try asking: "How does authentication work?" or "Explain the main component structure"
        </div>
      </CardContent>
    </Card>
  )
}
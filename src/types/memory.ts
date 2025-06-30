export interface AnalysisMemory {
  id: string
  userId: string
  repoUrl: string
  repoName: string
  repoOwner: string
  description: string
  analyzedAt: Date
  isFavorite: boolean
  
  // Analysis data
  techStack: string[]
  techStackDetailed: any
  structure: any
  analysis: {
    beginner: string
    expert: string
  }
  
  // Conversation history
  conversations: ConversationEntry[]
  
  // Architecture data
  architectureDiagram?: {
    mermaidCode: string
    components: string[]
    architecture: string
  }
  
  // Generated artifacts
  generatedTests?: TestArtifact[]
  generatedDocs?: DocumentationArtifact[]
  
  // Metadata
  tags: string[]
  notes: string
  lastAccessedAt: Date
}

export interface ConversationEntry {
  id: string
  timestamp: Date
  type: 'question' | 'file_analysis' | 'test_generation' | 'architecture'
  question: string
  answer: string
  context?: {
    fileName?: string
    functionName?: string
    relatedFiles?: string[]
  }
}

export interface TestArtifact {
  id: string
  fileName: string
  functionName: string
  testFramework: string
  testCases: string
  generatedAt: Date
}

export interface DocumentationArtifact {
  id: string
  type: 'readme' | 'onboarding' | 'api'
  content: string
  generatedAt: Date
}

export interface MemorySearchResult {
  memory: AnalysisMemory
  relevanceScore: number
  matchedFields: string[]
}
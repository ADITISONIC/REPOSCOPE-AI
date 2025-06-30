import { AnalysisMemory, ConversationEntry, TestArtifact, DocumentationArtifact } from '@/types/memory'
import { RepoData } from '@/types'

export class MemoryManager {
  private static instance: MemoryManager
  private memories: Map<string, AnalysisMemory> = new Map()
  private userId: string = 'default-user' // In production, get from auth

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager()
    }
    return MemoryManager.instance
  }

  constructor() {
    this.loadFromStorage()
  }

  // Save analysis to memory
  async saveAnalysis(repoData: RepoData): Promise<string> {
    const memoryId = this.generateMemoryId(repoData.url)
    
    const memory: AnalysisMemory = {
      id: memoryId,
      userId: this.userId,
      repoUrl: repoData.url,
      repoName: repoData.name,
      repoOwner: repoData.owner,
      description: repoData.description,
      analyzedAt: new Date(),
      lastAccessedAt: new Date(),
      isFavorite: false,
      techStack: repoData.techStack,
      techStackDetailed: repoData.techStackDetailed,
      structure: repoData.structure,
      analysis: repoData.analysis,
      conversations: [],
      generatedTests: [],
      generatedDocs: [],
      tags: this.generateTags(repoData),
      notes: ''
    }

    this.memories.set(memoryId, memory)
    await this.saveToStorage()
    
    return memoryId
  }

  // Add conversation entry
  async addConversation(
    memoryId: string, 
    type: ConversationEntry['type'],
    question: string, 
    answer: string, 
    context?: ConversationEntry['context']
  ): Promise<void> {
    const memory = this.memories.get(memoryId)
    if (!memory) return

    const conversation: ConversationEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      type,
      question,
      answer,
      context
    }

    memory.conversations.push(conversation)
    memory.lastAccessedAt = new Date()
    
    await this.saveToStorage()
  }

  // Add test artifact
  async addTestArtifact(
    memoryId: string,
    fileName: string,
    functionName: string,
    testFramework: string,
    testCases: string
  ): Promise<void> {
    const memory = this.memories.get(memoryId)
    if (!memory) return

    const testArtifact: TestArtifact = {
      id: this.generateId(),
      fileName,
      functionName,
      testFramework,
      testCases,
      generatedAt: new Date()
    }

    memory.generatedTests?.push(testArtifact)
    memory.lastAccessedAt = new Date()
    
    await this.saveToStorage()
  }

  // Add documentation artifact
  async addDocumentationArtifact(
    memoryId: string,
    type: DocumentationArtifact['type'],
    content: string
  ): Promise<void> {
    const memory = this.memories.get(memoryId)
    if (!memory) return

    const docArtifact: DocumentationArtifact = {
      id: this.generateId(),
      type,
      content,
      generatedAt: new Date()
    }

    memory.generatedDocs?.push(docArtifact)
    memory.lastAccessedAt = new Date()
    
    await this.saveToStorage()
  }

  // Get all memories for user
  getAllMemories(): AnalysisMemory[] {
    return Array.from(this.memories.values())
      .filter(memory => memory.userId === this.userId)
      .sort((a, b) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime())
  }

  // Get memory by ID
  getMemory(memoryId: string): AnalysisMemory | undefined {
    const memory = this.memories.get(memoryId)
    if (memory) {
      memory.lastAccessedAt = new Date()
      this.saveToStorage()
    }
    return memory
  }

  // Check if repo was previously analyzed
  findExistingMemory(repoUrl: string): AnalysisMemory | undefined {
    return Array.from(this.memories.values())
      .find(memory => memory.repoUrl === repoUrl && memory.userId === this.userId)
  }

  // Toggle favorite
  async toggleFavorite(memoryId: string): Promise<void> {
    const memory = this.memories.get(memoryId)
    if (!memory) return

    memory.isFavorite = !memory.isFavorite
    memory.lastAccessedAt = new Date()
    
    await this.saveToStorage()
  }

  // Delete memory
  async deleteMemory(memoryId: string): Promise<void> {
    this.memories.delete(memoryId)
    await this.saveToStorage()
  }

  // Clear all memories
  async clearAllMemories(): Promise<void> {
    const userMemories = Array.from(this.memories.entries())
      .filter(([_, memory]) => memory.userId === this.userId)
    
    userMemories.forEach(([id]) => this.memories.delete(id))
    await this.saveToStorage()
  }

  // Search memories
  searchMemories(query: string): AnalysisMemory[] {
    const lowercaseQuery = query.toLowerCase()
    
    return Array.from(this.memories.values())
      .filter(memory => memory.userId === this.userId)
      .filter(memory => 
        memory.repoName.toLowerCase().includes(lowercaseQuery) ||
        memory.description.toLowerCase().includes(lowercaseQuery) ||
        memory.techStack.some(tech => tech.toLowerCase().includes(lowercaseQuery)) ||
        memory.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
        memory.conversations.some(conv => 
          conv.question.toLowerCase().includes(lowercaseQuery) ||
          conv.answer.toLowerCase().includes(lowercaseQuery)
        )
      )
      .sort((a, b) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime())
  }

  // Update notes
  async updateNotes(memoryId: string, notes: string): Promise<void> {
    const memory = this.memories.get(memoryId)
    if (!memory) return

    memory.notes = notes
    memory.lastAccessedAt = new Date()
    
    await this.saveToStorage()
  }

  // Add architecture diagram
  async addArchitectureDiagram(
    memoryId: string,
    mermaidCode: string,
    components: string[],
    architecture: string
  ): Promise<void> {
    const memory = this.memories.get(memoryId)
    if (!memory) return

    memory.architectureDiagram = {
      mermaidCode,
      components,
      architecture
    }
    memory.lastAccessedAt = new Date()
    
    await this.saveToStorage()
  }

  // Private methods
  private generateMemoryId(repoUrl: string): string {
    return `memory_${Date.now()}_${btoa(repoUrl).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)}`
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  private generateTags(repoData: RepoData): string[] {
    const tags = new Set<string>()
    
    // Add tech stack as tags
    repoData.techStack.forEach(tech => tags.add(tech.toLowerCase()))
    
    // Add architecture type
    if (repoData.techStackDetailed.architecture) {
      tags.add(repoData.techStackDetailed.architecture.toLowerCase())
    }
    
    // Add project type
    if (repoData.techStackDetailed.projectType) {
      tags.add(repoData.techStackDetailed.projectType.toLowerCase())
    }
    
    // Add language
    if (repoData.techStackDetailed.language) {
      tags.add(repoData.techStackDetailed.language.toLowerCase())
    }
    
    return Array.from(tags).slice(0, 10) // Limit to 10 tags
  }

  private async saveToStorage(): Promise<void> {
    try {
      const data = Array.from(this.memories.entries())
      localStorage.setItem('reposcope_memories', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save memories to storage:', error)
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('reposcope_memories')
      if (data) {
        const entries = JSON.parse(data)
        this.memories = new Map(entries.map(([id, memory]: [string, any]) => [
          id,
          {
            ...memory,
            analyzedAt: new Date(memory.analyzedAt),
            lastAccessedAt: new Date(memory.lastAccessedAt),
            conversations: memory.conversations.map((conv: any) => ({
              ...conv,
              timestamp: new Date(conv.timestamp)
            }))
          }
        ]))
      }
    } catch (error) {
      console.error('Failed to load memories from storage:', error)
      this.memories = new Map()
    }
  }
}
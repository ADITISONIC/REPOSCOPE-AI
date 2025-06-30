import { supabase } from '@/lib/supabase'
import { AnalysisMemory, ConversationEntry, TestArtifact, DocumentationArtifact } from '@/types/memory'
import { RepoData } from '@/types'

export class DatabaseMemoryManager {
  private static instance: DatabaseMemoryManager
  private userId: string | null = null
  private localMemories: Map<string, AnalysisMemory> = new Map()

  static getInstance(): DatabaseMemoryManager {
    if (!DatabaseMemoryManager.instance) {
      DatabaseMemoryManager.instance = new DatabaseMemoryManager()
    }
    return DatabaseMemoryManager.instance
  }

  constructor() {
    this.loadFromLocalStorage()
  }

  setUserId(userId: string | null) {
    this.userId = userId
    console.log('DatabaseMemoryManager: User ID set to', userId)
    
    if (userId) {
      // Load from database when user is set
      this.syncWithDatabase()
    }
  }

  // Save analysis - works immediately with localStorage, syncs to DB in background
  async saveAnalysis(repoData: RepoData): Promise<string> {
    const memoryId = this.generateMemoryId(repoData.url)
    
    const memory: AnalysisMemory = {
      id: memoryId,
      userId: this.userId || 'local',
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

    // Save to local storage immediately
    this.localMemories.set(memoryId, memory)
    this.saveToLocalStorage()

    // Sync to database in background if user is authenticated
    if (this.userId) {
      this.saveToDatabaseBackground(memory).catch(error => {
        console.warn('Background database save failed:', error)
      })
    }
    
    return memoryId
  }

  // Get all memories - returns immediately from localStorage
  async getAllMemories(): Promise<AnalysisMemory[]> {
    console.log('DatabaseMemoryManager: Getting all memories')
    
    // Return from local storage immediately
    const localMemories = Array.from(this.localMemories.values())
      .filter(memory => !this.userId || memory.userId === this.userId || memory.userId === 'local')
      .sort((a, b) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime())

    console.log('DatabaseMemoryManager: Returning', localMemories.length, 'memories from local storage')
    
    // Sync with database in background if user is authenticated
    if (this.userId) {
      this.syncWithDatabase().catch(error => {
        console.warn('Background database sync failed:', error)
      })
    }
    
    return localMemories
  }

  // Get memory by ID
  async getMemory(memoryId: string): Promise<AnalysisMemory | null> {
    const memory = this.localMemories.get(memoryId)
    if (memory) {
      memory.lastAccessedAt = new Date()
      this.saveToLocalStorage()
      
      // Update in database background
      if (this.userId) {
        this.updateLastAccessedBackground(memoryId).catch(console.warn)
      }
    }
    return memory || null
  }

  // Find existing memory
  findExistingMemory(repoUrl: string): AnalysisMemory | undefined {
    return Array.from(this.localMemories.values())
      .find(memory => memory.repoUrl === repoUrl && 
        (!this.userId || memory.userId === this.userId || memory.userId === 'local'))
  }

  // Toggle favorite
  async toggleFavorite(memoryId: string): Promise<void> {
    const memory = this.localMemories.get(memoryId)
    if (!memory) return

    memory.isFavorite = !memory.isFavorite
    memory.lastAccessedAt = new Date()
    
    this.saveToLocalStorage()
    
    // Update in database background
    if (this.userId) {
      this.updateFavoriteBackground(memoryId, memory.isFavorite).catch(console.warn)
    }
  }

  // Delete memory
  async deleteMemory(memoryId: string): Promise<void> {
    this.localMemories.delete(memoryId)
    this.saveToLocalStorage()
    
    // Delete from database background
    if (this.userId) {
      this.deleteFromDatabaseBackground(memoryId).catch(console.warn)
    }
  }

  // Clear all memories
  async clearAllMemories(): Promise<void> {
    const userMemories = Array.from(this.localMemories.entries())
      .filter(([_, memory]) => !this.userId || memory.userId === this.userId || memory.userId === 'local')
    
    userMemories.forEach(([id]) => this.localMemories.delete(id))
    this.saveToLocalStorage()
    
    // Clear from database background
    if (this.userId) {
      this.clearDatabaseBackground().catch(console.warn)
    }
  }

  // Search memories
  searchMemories(query: string): AnalysisMemory[] {
    const lowercaseQuery = query.toLowerCase()
    
    return Array.from(this.localMemories.values())
      .filter(memory => !this.userId || memory.userId === this.userId || memory.userId === 'local')
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
    const memory = this.localMemories.get(memoryId)
    if (!memory) return

    memory.notes = notes
    memory.lastAccessedAt = new Date()
    
    this.saveToLocalStorage()
    
    // Update in database background
    if (this.userId) {
      this.updateNotesBackground(memoryId, notes).catch(console.warn)
    }
  }

  // Add conversation
  async addConversation(
    memoryId: string, 
    type: ConversationEntry['type'],
    question: string, 
    answer: string, 
    context?: ConversationEntry['context']
  ): Promise<void> {
    const memory = this.localMemories.get(memoryId)
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
    
    this.saveToLocalStorage()
    
    // Save to database background
    if (this.userId) {
      this.addConversationBackground(memoryId, conversation).catch(console.warn)
    }
  }

  // Add test artifact
  async addTestArtifact(
    memoryId: string,
    fileName: string,
    functionName: string,
    testFramework: string,
    testCases: string
  ): Promise<void> {
    const memory = this.localMemories.get(memoryId)
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
    
    this.saveToLocalStorage()
    
    // Save to database background
    if (this.userId) {
      this.addTestArtifactBackground(memoryId, testArtifact).catch(console.warn)
    }
  }

  // Add documentation artifact
  async addDocumentationArtifact(
    memoryId: string,
    type: DocumentationArtifact['type'],
    content: string
  ): Promise<void> {
    const memory = this.localMemories.get(memoryId)
    if (!memory) return

    const docArtifact: DocumentationArtifact = {
      id: this.generateId(),
      type,
      content,
      generatedAt: new Date()
    }

    memory.generatedDocs?.push(docArtifact)
    memory.lastAccessedAt = new Date()
    
    this.saveToLocalStorage()
    
    // Save to database background
    if (this.userId) {
      this.addDocArtifactBackground(memoryId, docArtifact).catch(console.warn)
    }
  }

  // Add architecture diagram
  async addArchitectureDiagram(
    memoryId: string,
    mermaidCode: string,
    components: string[],
    architecture: string
  ): Promise<void> {
    const memory = this.localMemories.get(memoryId)
    if (!memory) return

    memory.architectureDiagram = {
      mermaidCode,
      components,
      architecture
    }
    memory.lastAccessedAt = new Date()
    
    this.saveToLocalStorage()
    
    // Save to database background
    if (this.userId) {
      this.updateArchitectureBackground(memoryId, memory.architectureDiagram).catch(console.warn)
    }
  }

  // Private methods for local storage
  private saveToLocalStorage(): void {
    try {
      const data = Array.from(this.localMemories.entries())
      localStorage.setItem('reposcope_memories', JSON.stringify(data))
      console.log('DatabaseMemoryManager: Saved', this.localMemories.size, 'memories to localStorage')
    } catch (error) {
      console.error('Failed to save memories to localStorage:', error)
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const data = localStorage.getItem('reposcope_memories')
      if (data) {
        const entries = JSON.parse(data)
        this.localMemories = new Map(entries.map(([id, memory]: [string, any]) => [
          id,
          {
            ...memory,
            analyzedAt: new Date(memory.analyzedAt),
            lastAccessedAt: new Date(memory.lastAccessedAt),
            conversations: memory.conversations.map((conv: any) => ({
              ...conv,
              timestamp: new Date(conv.timestamp)
            })),
            generatedTests: (memory.generatedTests || []).map((test: any) => ({
              ...test,
              generatedAt: new Date(test.generatedAt)
            })),
            generatedDocs: (memory.generatedDocs || []).map((doc: any) => ({
              ...doc,
              generatedAt: new Date(doc.generatedAt)
            }))
          }
        ]))
        console.log('DatabaseMemoryManager: Loaded', this.localMemories.size, 'memories from localStorage')
      }
    } catch (error) {
      console.error('Failed to load memories from localStorage:', error)
      this.localMemories = new Map()
    }
  }

  // Background database operations (non-blocking)
  private async syncWithDatabase(): Promise<void> {
    if (!this.userId) return

    try {
      console.log('DatabaseMemoryManager: Syncing with database...')
      
      const { data, error } = await supabase
        .from('analysis_memories')
        .select('*')
        .eq('user_id', this.userId)
        .order('last_accessed_at', { ascending: false })

      if (error) {
        console.warn('Database sync failed:', error)
        return
      }

      if (data && data.length > 0) {
        console.log('DatabaseMemoryManager: Found', data.length, 'memories in database')
        
        // Merge database memories with local ones
        data.forEach(dbMemory => {
          const existingLocal = this.localMemories.get(dbMemory.id)
          
          if (!existingLocal || new Date(dbMemory.updated_at) > existingLocal.lastAccessedAt) {
            // Database version is newer or doesn't exist locally
            const memory: AnalysisMemory = {
              id: dbMemory.id,
              userId: dbMemory.user_id,
              repoUrl: dbMemory.repo_url,
              repoName: dbMemory.repo_name,
              repoOwner: dbMemory.repo_owner,
              description: dbMemory.description || '',
              analyzedAt: new Date(dbMemory.analyzed_at),
              lastAccessedAt: new Date(dbMemory.last_accessed_at),
              isFavorite: dbMemory.is_favorite || false,
              techStack: dbMemory.tech_stack || [],
              techStackDetailed: dbMemory.tech_stack_detailed || {},
              structure: dbMemory.structure || {},
              analysis: dbMemory.analysis || { beginner: '', expert: '' },
              architectureDiagram: dbMemory.architecture_diagram,
              tags: dbMemory.tags || [],
              notes: dbMemory.notes || '',
              conversations: [], // Load separately if needed
              generatedTests: [],
              generatedDocs: []
            }
            
            this.localMemories.set(dbMemory.id, memory)
          }
        })
        
        this.saveToLocalStorage()
        console.log('DatabaseMemoryManager: Sync completed')
      }
    } catch (error) {
      console.warn('Database sync exception:', error)
    }
  }

  private async saveToDatabaseBackground(memory: AnalysisMemory): Promise<void> {
    if (!this.userId) return

    try {
      const { error } = await supabase
        .from('analysis_memories')
        .upsert({
          id: memory.id,
          user_id: this.userId,
          repo_url: memory.repoUrl,
          repo_name: memory.repoName,
          repo_owner: memory.repoOwner,
          description: memory.description,
          analyzed_at: memory.analyzedAt.toISOString(),
          last_accessed_at: memory.lastAccessedAt.toISOString(),
          is_favorite: memory.isFavorite,
          tech_stack: memory.techStack,
          tech_stack_detailed: memory.techStackDetailed,
          structure: memory.structure,
          analysis: memory.analysis,
          architecture_diagram: memory.architectureDiagram,
          tags: memory.tags,
          notes: memory.notes
        })

      if (error) {
        console.warn('Background database save failed:', error)
      } else {
        console.log('DatabaseMemoryManager: Saved memory to database:', memory.id)
      }
    } catch (error) {
      console.warn('Background database save exception:', error)
    }
  }

  private async updateLastAccessedBackground(memoryId: string): Promise<void> {
    if (!this.userId) return

    try {
      await supabase
        .from('analysis_memories')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('id', memoryId)
        .eq('user_id', this.userId)
    } catch (error) {
      console.warn('Background last accessed update failed:', error)
    }
  }

  private async updateFavoriteBackground(memoryId: string, isFavorite: boolean): Promise<void> {
    if (!this.userId) return

    try {
      await supabase
        .from('analysis_memories')
        .update({ 
          is_favorite: isFavorite,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', memoryId)
        .eq('user_id', this.userId)
    } catch (error) {
      console.warn('Background favorite update failed:', error)
    }
  }

  private async deleteFromDatabaseBackground(memoryId: string): Promise<void> {
    if (!this.userId) return

    try {
      await supabase
        .from('analysis_memories')
        .delete()
        .eq('id', memoryId)
        .eq('user_id', this.userId)
    } catch (error) {
      console.warn('Background delete failed:', error)
    }
  }

  private async clearDatabaseBackground(): Promise<void> {
    if (!this.userId) return

    try {
      await supabase
        .from('analysis_memories')
        .delete()
        .eq('user_id', this.userId)
    } catch (error) {
      console.warn('Background clear failed:', error)
    }
  }

  private async updateNotesBackground(memoryId: string, notes: string): Promise<void> {
    if (!this.userId) return

    try {
      await supabase
        .from('analysis_memories')
        .update({ 
          notes,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', memoryId)
        .eq('user_id', this.userId)
    } catch (error) {
      console.warn('Background notes update failed:', error)
    }
  }

  private async addConversationBackground(memoryId: string, conversation: ConversationEntry): Promise<void> {
    if (!this.userId) return

    try {
      await supabase
        .from('conversations')
        .insert({
          id: conversation.id,
          memory_id: memoryId,
          user_id: this.userId,
          type: conversation.type,
          question: conversation.question,
          answer: conversation.answer,
          context: conversation.context,
          created_at: conversation.timestamp.toISOString()
        })
    } catch (error) {
      console.warn('Background conversation save failed:', error)
    }
  }

  private async addTestArtifactBackground(memoryId: string, artifact: TestArtifact): Promise<void> {
    if (!this.userId) return

    try {
      await supabase
        .from('test_artifacts')
        .insert({
          id: artifact.id,
          memory_id: memoryId,
          user_id: this.userId,
          file_name: artifact.fileName,
          function_name: artifact.functionName,
          test_framework: artifact.testFramework,
          test_cases: artifact.testCases,
          created_at: artifact.generatedAt.toISOString()
        })
    } catch (error) {
      console.warn('Background test artifact save failed:', error)
    }
  }

  private async addDocArtifactBackground(memoryId: string, artifact: DocumentationArtifact): Promise<void> {
    if (!this.userId) return

    try {
      await supabase
        .from('documentation_artifacts')
        .insert({
          id: artifact.id,
          memory_id: memoryId,
          user_id: this.userId,
          type: artifact.type,
          content: artifact.content,
          created_at: artifact.generatedAt.toISOString()
        })
    } catch (error) {
      console.warn('Background doc artifact save failed:', error)
    }
  }

  private async updateArchitectureBackground(memoryId: string, diagram: any): Promise<void> {
    if (!this.userId) return

    try {
      await supabase
        .from('analysis_memories')
        .update({ 
          architecture_diagram: diagram,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', memoryId)
        .eq('user_id', this.userId)
    } catch (error) {
      console.warn('Background architecture update failed:', error)
    }
  }

  // Utility methods
  private generateMemoryId(repoUrl: string): string {
    return `memory_${Date.now()}_${btoa(repoUrl).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)}`
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  private generateTags(repoData: RepoData): string[] {
    const tags = new Set<string>()
    
    try {
      // Add tech stack as tags
      if (Array.isArray(repoData.techStack)) {
        repoData.techStack.forEach(tech => {
          if (tech && typeof tech === 'string') {
            tags.add(tech.toLowerCase())
          }
        })
      }
      
      // Add architecture type
      if (repoData.techStackDetailed?.architecture) {
        tags.add(repoData.techStackDetailed.architecture.toLowerCase())
      }
      
      // Add project type
      if (repoData.techStackDetailed?.projectType) {
        tags.add(repoData.techStackDetailed.projectType.toLowerCase())
      }
      
      // Add language
      if (repoData.techStackDetailed?.language) {
        tags.add(repoData.techStackDetailed.language.toLowerCase())
      }
      
      return Array.from(tags).slice(0, 10) // Limit to 10 tags
    } catch (error) {
      console.error('Error generating tags:', error)
      return []
    }
  }
}
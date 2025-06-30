import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  History, 
  Star, 
  Trash2, 
  Search, 
  Calendar, 
  Code, 
  MessageSquare, 
  FileText, 
  TestTube,
  ChevronRight,
  ChevronDown,
  Clock,
  Tag,
  StickyNote,
  Archive,
  Filter,
  MoreVertical,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AnalysisMemory, ConversationEntry } from '@/types/memory'
import { DatabaseMemoryManager } from '@/utils/database-memory-manager'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

interface MemoryPanelProps {
  isOpen: boolean
  onClose: () => void
  onLoadMemory: (memory: AnalysisMemory) => void
  currentMemoryId?: string
}

export function MemoryPanel({ isOpen, onClose, onLoadMemory, currentMemoryId }: MemoryPanelProps) {
  const [memories, setMemories] = useState<AnalysisMemory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMemory, setSelectedMemory] = useState<AnalysisMemory | null>(null)
  const [expandedConversations, setExpandedConversations] = useState<Set<string>>(new Set())
  const [filterType, setFilterType] = useState<'all' | 'favorites' | 'recent'>('all')
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesText, setNotesText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { isAuthenticated, user, loading: authLoading } = useAuth()
  const memoryManager = DatabaseMemoryManager.getInstance()

  // Load memories when panel opens
  useEffect(() => {
    if (isOpen) {
      console.log('MemoryPanel: Panel opened, loading memories')
      loadMemories()
    }
  }, [isOpen])

  const loadMemories = async () => {
    setIsLoading(true)
    
    try {
      console.log('MemoryPanel: Starting to load memories...')
      
      const allMemories = await memoryManager.getAllMemories()
      console.log('MemoryPanel: Successfully loaded', allMemories.length, 'memories')
      
      setMemories(allMemories)
      
    } catch (error) {
      console.error('MemoryPanel: Error loading memories:', error)
      toast.error('Failed to load analysis history')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredMemories = memories.filter(memory => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        memory.repoName.toLowerCase().includes(query) ||
        memory.description.toLowerCase().includes(query) ||
        memory.techStack.some(tech => tech.toLowerCase().includes(query)) ||
        memory.tags.some(tag => tag.toLowerCase().includes(query))
      
      if (!matchesSearch) return false
    }

    // Apply type filter
    switch (filterType) {
      case 'favorites':
        return memory.isFavorite
      case 'recent':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return memory.lastAccessedAt > weekAgo
      default:
        return true
    }
  })

  const handleToggleFavorite = async (memoryId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      await memoryManager.toggleFavorite(memoryId)
      await loadMemories()
      toast.success('Updated favorite status')
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast.error('Failed to update favorite status')
    }
  }

  const handleDeleteMemory = async (memoryId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      await memoryManager.deleteMemory(memoryId)
      await loadMemories()
      setSelectedMemory(null)
      toast.success('Memory deleted')
    } catch (error) {
      console.error('Error deleting memory:', error)
      toast.error('Failed to delete memory')
    }
  }

  const handleClearAll = async () => {
    try {
      await memoryManager.clearAllMemories()
      await loadMemories()
      setSelectedMemory(null)
      toast.success('All memories cleared')
    } catch (error) {
      console.error('Error clearing memories:', error)
      toast.error('Failed to clear memories')
    }
  }

  const handleLoadMemory = async (memory: AnalysisMemory) => {
    try {
      // Get the full memory with all related data
      const fullMemory = await memoryManager.getMemory(memory.id)
      if (fullMemory) {
        onLoadMemory(fullMemory)
        onClose()
        toast.success(`Loaded analysis for ${memory.repoName}`)
      }
    } catch (error) {
      console.error('Error loading memory:', error)
      toast.error('Failed to load analysis')
    }
  }

  const handleSaveNotes = async (memoryId: string) => {
    try {
      await memoryManager.updateNotes(memoryId, notesText)
      await loadMemories()
      setEditingNotes(null)
      toast.success('Notes saved')
    } catch (error) {
      console.error('Error saving notes:', error)
      toast.error('Failed to save notes')
    }
  }

  const toggleConversationExpanded = (conversationId: string) => {
    const newExpanded = new Set(expandedConversations)
    if (newExpanded.has(conversationId)) {
      newExpanded.delete(conversationId)
    } else {
      newExpanded.add(conversationId)
    }
    setExpandedConversations(newExpanded)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getConversationIcon = (type: ConversationEntry['type']) => {
    switch (type) {
      case 'question': return MessageSquare
      case 'file_analysis': return FileText
      case 'test_generation': return TestTube
      case 'architecture': return Code
      default: return MessageSquare
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-6xl bg-background border-r shadow-2xl flex"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar - Memory List */}
        <div className="w-1/3 border-r bg-muted/30">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Analysis History</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>

            {/* Filters */}
            <div className="flex space-x-2 mb-4">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
                disabled={isLoading}
              >
                All
              </Button>
              <Button
                variant={filterType === 'favorites' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('favorites')}
                disabled={isLoading}
              >
                <Star className="w-3 h-3 mr-1" />
                Favorites
              </Button>
              <Button
                variant={filterType === 'recent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('recent')}
                disabled={isLoading}
              >
                <Clock className="w-3 h-3 mr-1" />
                Recent
              </Button>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={loadMemories} disabled={isLoading}>
                <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearAll} disabled={memories.length === 0 || isLoading}>
                <Archive className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading memories...</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredMemories.map((memory) => (
                    <motion.div
                      key={memory.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        selectedMemory?.id === memory.id 
                          ? 'bg-primary/10 border-primary/50' 
                          : 'bg-card hover:bg-muted/50'
                      } ${currentMemoryId === memory.id ? 'ring-2 ring-green-500' : ''}`}
                      onClick={() => setSelectedMemory(memory)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">
                            {memory.repoOwner}/{memory.repoName}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {memory.description || 'No description'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => handleToggleFavorite(memory.id, e)}
                          >
                            <Star className={`w-3 h-3 ${memory.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleLoadMemory(memory)}>
                                <Eye className="w-3 h-3 mr-2" />
                                Load Analysis
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => handleDeleteMemory(memory.id, e)}>
                                <Trash2 className="w-3 h-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {memory.techStack.slice(0, 3).map((tech) => (
                          <Badge key={tech} variant="secondary" className="text-xs px-1 py-0">
                            {tech}
                          </Badge>
                        ))}
                        {memory.techStack.length > 3 && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            +{memory.techStack.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(memory.analyzedAt)}
                        </span>
                        <div className="flex items-center space-x-2">
                          {memory.conversations.length > 0 && (
                            <span className="flex items-center">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              {memory.conversations.length}
                            </span>
                          )}
                          {currentMemoryId === memory.id && (
                            <Badge variant="outline" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {!isLoading && filteredMemories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    {searchQuery ? 'No memories found matching your search' : 'No analysis history yet'}
                  </p>
                  {!searchQuery && (
                    <p className="text-xs mt-2">
                      Analyze a repository to start building your history
                    </p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content - Memory Details */}
        <div className="flex-1 flex flex-col">
          {selectedMemory ? (
            <>
              <div className="p-6 border-b bg-gradient-to-r from-primary/5 to-purple/5">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">
                      {selectedMemory.repoOwner}/{selectedMemory.repoName}
                    </h1>
                    <p className="text-muted-foreground mb-4">
                      {selectedMemory.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Analyzed {formatDate(selectedMemory.analyzedAt)}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Last accessed {formatDate(selectedMemory.lastAccessedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handleToggleFavorite(selectedMemory.id, {} as React.MouseEvent)}
                    >
                      <Star className={`w-4 h-4 mr-2 ${selectedMemory.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      {selectedMemory.isFavorite ? 'Favorited' : 'Add to Favorites'}
                    </Button>
                    <Button onClick={() => handleLoadMemory(selectedMemory)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Load Analysis
                    </Button>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-6">
                <Tabs defaultValue="overview" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="conversations">
                      Conversations ({selectedMemory.conversations.length})
                    </TabsTrigger>
                    <TabsTrigger value="artifacts">
                      Artifacts ({(selectedMemory.generatedTests?.length || 0) + (selectedMemory.generatedDocs?.length || 0)})
                    </TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    {/* Tech Stack */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Technology Stack</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedMemory.techStack.map((tech) => (
                            <Badge key={tech} variant="secondary">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Architecture */}
                    {selectedMemory.architectureDiagram && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Architecture</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            {selectedMemory.architectureDiagram.architecture}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedMemory.architectureDiagram.components.map((component) => (
                              <Badge key={component} variant="outline">
                                {component}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Analysis Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Analysis Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <div 
                            dangerouslySetInnerHTML={{ 
                              __html: selectedMemory.analysis.beginner
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\n/g, '<br>')
                                .substring(0, 500) + '...'
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Tags */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Tags</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedMemory.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="conversations" className="space-y-4">
                    {selectedMemory.conversations.length > 0 ? (
                      selectedMemory.conversations.map((conversation) => {
                        const Icon = getConversationIcon(conversation.type)
                        const isExpanded = expandedConversations.has(conversation.id)
                        
                        return (
                          <Card key={conversation.id}>
                            <CardHeader 
                              className="cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => toggleConversationExpanded(conversation.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Icon className="w-4 h-4 text-primary" />
                                  <div>
                                    <CardTitle className="text-sm">
                                      {conversation.question.substring(0, 100)}
                                      {conversation.question.length > 100 && '...'}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(conversation.timestamp)} • {conversation.type}
                                    </p>
                                  </div>
                                </div>
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </div>
                            </CardHeader>
                            
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <CardContent className="pt-0">
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="font-semibold text-sm mb-2">Question:</h4>
                                        <p className="text-sm bg-muted/50 p-3 rounded">
                                          {conversation.question}
                                        </p>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-semibold text-sm mb-2">Answer:</h4>
                                        <div className="text-sm bg-muted/50 p-3 rounded prose prose-sm dark:prose-invert max-w-none">
                                          <div 
                                            dangerouslySetInnerHTML={{ 
                                              __html: conversation.answer
                                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                .replace(/\n/g, '<br>')
                                            }}
                                          />
                                        </div>
                                      </div>
                                      
                                      {conversation.context && (
                                        <div>
                                          <h4 className="font-semibold text-sm mb-2">Context:</h4>
                                          <div className="flex flex-wrap gap-2">
                                            {conversation.context.fileName && (
                                              <Badge variant="outline">
                                                <FileText className="w-3 h-3 mr-1" />
                                                {conversation.context.fileName}
                                              </Badge>
                                            )}
                                            {conversation.context.functionName && (
                                              <Badge variant="outline">
                                                <Code className="w-3 h-3 mr-1" />
                                                {conversation.context.functionName}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Card>
                        )
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No conversations recorded yet</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="artifacts" className="space-y-4">
                    {/* Generated Tests */}
                    {selectedMemory.generatedTests && selectedMemory.generatedTests.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <TestTube className="w-5 h-5 mr-2" />
                            Generated Tests ({selectedMemory.generatedTests.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {selectedMemory.generatedTests.map((test) => (
                              <div key={test.id} className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-sm">
                                    {test.functionName} in {test.fileName}
                                  </h4>
                                  <Badge variant="secondary">{test.testFramework}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Generated {formatDate(test.generatedAt)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Generated Documentation */}
                    {selectedMemory.generatedDocs && selectedMemory.generatedDocs.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <FileText className="w-5 h-5 mr-2" />
                            Generated Documentation ({selectedMemory.generatedDocs.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {selectedMemory.generatedDocs.map((doc) => (
                              <div key={doc.id} className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-sm capitalize">
                                    {doc.type} Documentation
                                  </h4>
                                  <Button variant="outline" size="sm">
                                    <Download className="w-3 h-3 mr-1" />
                                    Download
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Generated {formatDate(doc.generatedAt)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {(!selectedMemory.generatedTests || selectedMemory.generatedTests.length === 0) &&
                     (!selectedMemory.generatedDocs || selectedMemory.generatedDocs.length === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No artifacts generated yet</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="notes" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <StickyNote className="w-5 h-5 mr-2" />
                          Personal Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {editingNotes === selectedMemory.id ? (
                          <div className="space-y-4">
                            <Textarea
                              value={notesText}
                              onChange={(e) => setNotesText(e.target.value)}
                              placeholder="Add your notes about this analysis..."
                              rows={6}
                            />
                            <div className="flex space-x-2">
                              <Button onClick={() => handleSaveNotes(selectedMemory.id)}>
                                Save Notes
                              </Button>
                              <Button variant="outline" onClick={() => setEditingNotes(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {selectedMemory.notes ? (
                              <div className="space-y-4">
                                <p className="text-sm whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                                  {selectedMemory.notes}
                                </p>
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setEditingNotes(selectedMemory.id)
                                    setNotesText(selectedMemory.notes)
                                  }}
                                >
                                  Edit Notes
                                </Button>
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <StickyNote className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="text-muted-foreground mb-4">No notes added yet</p>
                                <Button 
                                  onClick={() => {
                                    setEditingNotes(selectedMemory.id)
                                    setNotesText('')
                                  }}
                                >
                                  Add Notes
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Select a Memory</h3>
                <p className="text-muted-foreground">
                  Choose an analysis from the sidebar to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
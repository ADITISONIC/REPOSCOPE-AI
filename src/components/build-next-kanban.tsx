import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  Play, 
  CheckCircle, 
  Eye, 
  FileText,
  AlertTriangle,
  Target,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface BuildSuggestion {
  id: string
  title: string
  description: string
  category: 'tests' | 'ci-cd' | 'cleanup' | 'todos' | 'documentation' | 'security' | 'performance'
  priority: 'high' | 'medium' | 'low'
  effort: 'small' | 'medium' | 'large'
  impact: 'high' | 'medium' | 'low'
  files: string[]
  reasoning: string
  actionItems: string[]
  estimatedTime: string
  status: 'todo' | 'in-progress' | 'done'
}

interface BuildNextKanbanProps {
  suggestions: BuildSuggestion[]
  onUpdateStatus: (suggestionId: string, newStatus: BuildSuggestion['status']) => void
  onSelectSuggestion: (suggestion: BuildSuggestion) => void
}

const STORAGE_KEY = 'build-next-kanban-state'

export function BuildNextKanban({ suggestions, onUpdateStatus, onSelectSuggestion }: BuildNextKanbanProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [localSuggestions, setLocalSuggestions] = useState<BuildSuggestion[]>(suggestions)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  // Load saved state on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY)
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        // Merge saved state with current suggestions, preserving status updates
        const mergedSuggestions = suggestions.map(suggestion => {
          const savedSuggestion = parsedState.find((s: BuildSuggestion) => s.id === suggestion.id)
          return savedSuggestion ? { ...suggestion, status: savedSuggestion.status } : suggestion
        })
        setLocalSuggestions(mergedSuggestions)
      } catch (error) {
        console.error('Failed to load kanban state:', error)
        setLocalSuggestions(suggestions)
      }
    } else {
      setLocalSuggestions(suggestions)
    }
  }, [suggestions])

  // Save state whenever suggestions change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localSuggestions))
  }, [localSuggestions])

  // Save state when tab becomes hidden (user switches tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localSuggestions))
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [localSuggestions])

  const columns = [
    { id: 'todo', title: 'To Do', icon: Clock, color: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20' },
    { id: 'in-progress', title: 'In Progress', icon: Play, color: 'border-blue-200 bg-blue-50 dark:bg-blue-900/20' },
    { id: 'done', title: 'Done', icon: CheckCircle, color: 'border-green-200 bg-green-50 dark:bg-green-900/20' }
  ]

  const getSuggestionsByStatus = (status: string) => {
    return localSuggestions.filter(s => s.status === status)
  }

  const handleStatusUpdate = (suggestionId: string, newStatus: BuildSuggestion['status']) => {
    // Update local state
    const updatedSuggestions = localSuggestions.map(suggestion =>
      suggestion.id === suggestionId ? { ...suggestion, status: newStatus } : suggestion
    )
    setLocalSuggestions(updatedSuggestions)
    
    // Save to localStorage immediately
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSuggestions))
    
    // Call parent callback
    onUpdateStatus(suggestionId, newStatus)
  }

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, suggestionId: string) => {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', suggestionId)
    }
    setDraggedItem(suggestionId)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
    setDragOverColumn(columnId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're leaving the column entirely
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverColumn(null)
    }
  }

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    const suggestionId = e.dataTransfer.getData('text/plain')
    
    if (suggestionId && columnId) {
      const currentSuggestion = localSuggestions.find(s => s.id === suggestionId)
      const newStatus = columnId as BuildSuggestion['status']
      
      if (currentSuggestion && newStatus !== currentSuggestion.status) {
        handleStatusUpdate(suggestionId, newStatus)
      }
    }
    
    setDraggedItem(null)
    setDragOverColumn(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverColumn(null)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-yellow-500'
      case 'low': return 'border-l-green-500'
      default: return 'border-l-gray-500'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tests': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'ci-cd': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'cleanup': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'todos': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'documentation': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
      case 'security': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'performance': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="space-y-4">
      {/* Progress Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {columns.map((column) => {
          const count = getSuggestionsByStatus(column.id).length
          const ColumnIcon = column.icon
          
          return (
            <Card key={column.id} className="text-center">
              <CardContent className="p-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <ColumnIcon className="w-5 h-5" />
                  <span className="font-semibold">{column.title}</span>
                </div>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground">
                  {count === 1 ? 'item' : 'items'}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map((column) => {
          const columnSuggestions = getSuggestionsByStatus(column.id)
          const ColumnIcon = column.icon
          const isDropTarget = dragOverColumn === column.id
          
          return (
            <div
              key={column.id}
              className={`rounded-lg border-2 border-dashed ${column.color} p-4 min-h-[600px] transition-all duration-200 ${
                isDropTarget ? 'border-primary bg-primary/5 scale-105' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="flex items-center space-x-2 mb-4">
                <ColumnIcon className="w-5 h-5" />
                <h3 className="font-semibold">{column.title}</h3>
                <Badge variant="secondary" className="ml-auto">
                  {columnSuggestions.length}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <AnimatePresence>
                  {columnSuggestions.map((suggestion) => (
                    <motion.div
                      key={suggestion.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: draggedItem === suggestion.id ? 0.5 : 1, 
                        y: 0,
                        scale: draggedItem === suggestion.id ? 1.05 : 1
                      }}
                      exit={{ opacity: 0, y: -20 }}
                      whileHover={{ scale: 1.02 }}
                      className="cursor-move"
                      draggable
                      onDragStart={(e) => handleDragStart(e as any, suggestion.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <Card className={`border-l-4 ${getPriorityColor(suggestion.priority)} hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 ${
                        draggedItem === suggestion.id ? 'shadow-lg rotate-2' : ''
                      }`}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm leading-tight pr-2">
                                {suggestion.title}
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onSelectSuggestion(suggestion)
                                }}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {suggestion.description}
                            </p>
                            
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="outline" className={`text-xs ${getCategoryColor(suggestion.category)}`}>
                                {suggestion.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {suggestion.priority}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {suggestion.estimatedTime}
                              </span>
                              <span className="flex items-center">
                                <FileText className="w-3 h-3 mr-1" />
                                {suggestion.files.length}
                              </span>
                            </div>
                            
                            {suggestion.priority === 'high' && (
                              <div className="flex items-center space-x-1 text-xs text-red-600">
                                <AlertTriangle className="w-3 h-3" />
                                <span>High Priority</span>
                              </div>
                            )}
                            
                            {suggestion.impact === 'high' && (
                              <div className="flex items-center space-x-1 text-xs text-blue-600">
                                <Zap className="w-3 h-3" />
                                <span>High Impact</span>
                              </div>
                            )}

                            {/* Quick Action Buttons */}
                            <div className="flex space-x-1 pt-2">
                              {suggestion.status !== 'in-progress' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-xs flex-1"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStatusUpdate(suggestion.id, 'in-progress')
                                  }}
                                >
                                  Start
                                </Button>
                              )}
                              {suggestion.status !== 'done' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-xs flex-1"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStatusUpdate(suggestion.id, 'done')
                                  }}
                                >
                                  Complete
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {columnSuggestions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ColumnIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No items in {column.title.toLowerCase()}</p>
                    <p className="text-xs mt-1">Drag items here to update their status</p>
                  </div>
                )}
              </div>

              {/* Drop Zone Indicator */}
              {isDropTarget && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 border-2 border-dashed border-primary bg-primary/10 rounded-lg flex items-center justify-center pointer-events-none"
                >
                  <div className="text-primary font-semibold">
                    Drop here to move to {column.title}
                  </div>
                </motion.div>
              )}
            </div>
          )
        })}
      </div>

      {/* Drag Indicator */}
      {draggedItem && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg z-50"
        >
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span className="text-sm font-medium">Drag to any column to update status</span>
          </div>
        </motion.div>
      )}

      {/* Success Message */}
      <AnimatePresence>
        {localSuggestions.some(s => s.status === 'done') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {getSuggestionsByStatus('done').length} task(s) completed! 🎉
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
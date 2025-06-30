import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { RepoData } from '@/types'

interface AppState {
  currentRepoData: RepoData | null
  currentMemoryId: string | undefined

  tabStates: {
    chat: {
      messages: Array<{
        id: string
        type: 'user' | 'bot'
        content: string
        timestamp: Date
        context?: any
      }>
      inputValue: string
    }
    codeExplanation: {
      selectedFile: string
      expertMode: boolean
      explanationCache: Record<string, any>
    }
    testGenerator: {
      selectedFile: string
      selectedFunction: string
      generatedTests: any
      testableFiles: string[]
    }
    docsGenerator: {
      readme: string
      onboarding: string
      isGenerating: boolean
    }
    architecture: {
      architectureData: any
      isGenerating: boolean
    }
    buildNext: {
      analysisResult: any
      filterCategory: string
      filterPriority: string
      viewMode: 'list' | 'kanban'
      selectedSuggestion: any
    }
    repoHealth: {
      score: number | null
      breakdown: {
        testCoverage: number
        readmeQuality: number
        linterPresence: number
        ciCdPresence: number
        aiTips: string[]
      }
      lastUpdated: Date | null
      isGenerating: boolean
    }
  }

  uiState: {
    activeTab: string
    isLoading: boolean
    lastActivity: Date
  }
}

interface AppStateContextType {
  state: AppState
  updateRepoData: (repoData: RepoData | null) => void
  updateMemoryId: (memoryId: string | undefined) => void
  updateTabState: <T extends keyof AppState['tabStates']>(
    tab: T,
    updates: Partial<AppState['tabStates'][T]>
  ) => void
  updateUIState: (updates: Partial<AppState['uiState']>) => void
  clearState: () => void
  restoreFromMemory: (repoData: RepoData, memoryId: string) => void
}

const STORAGE_KEY = 'reposcope_app_state_v1'

const defaultState: AppState = {
  }
  currentRepoData: null,
  currentMemoryId: undefined,
  tabStates: {
    chat: {
      messages: [],
      inputValue: ''
    },
    codeExplanation: {
      selectedFile: '',
      expertMode: false,
      explanationCache: {}
    },
    testGenerator: {
      selectedFile: '',
      selectedFunction: '',
      generatedTests: null,
      testableFiles: []
    },
    docsGenerator: {
      readme: '',
      onboarding: '',
      isGenerating: false
    },
    architecture: {
      architectureData: null,
      isGenerating: false
    },
    buildNext: {
      analysisResult: null,
      filterCategory: 'all',
      filterPriority: 'all',
      viewMode: 'list',
      selectedSuggestion: null
    },
    repoHealth: {
      score: null,
      breakdown: {
        testCoverage: 0,
        readmeQuality: 0,
        linterPresence: 0,
        ciCdPresence: 0,
        aiTips: []
      },
      lastUpdated: null,
      isGenerating: false
    }
  },
  uiState: {
    activeTab: 'overview',
    isLoading: false,
    lastActivity: new Date()
  }
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Revive Date objects
        if (parsed.uiState?.lastActivity) {
          parsed.uiState.lastActivity = new Date(parsed.uiState.lastActivity)
        }
        if (parsed.tabStates?.repoHealth?.lastUpdated) {
          parsed.tabStates.repoHealth.lastUpdated = new Date(parsed.tabStates.repoHealth.lastUpdated)
        }
        
        // Ensure all required properties exist with defaults
        const mergedState = {
          ...defaultState,
          ...parsed,
          tabStates: {
            ...defaultState.tabStates,
            ...parsed.tabStates,
            repoHealth: {
              ...defaultState.tabStates.repoHealth,
              ...parsed.tabStates?.repoHealth
            }
          }
        }
        
        return mergedState
      }
    } catch (e) {
      console.error('Failed to load app state:', e)
    }
    return defaultState
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      console.error('Failed to save app state:', e)
    }
  }, [state])

  const updateRepoData = (repoData: RepoData | null) => {
    setState(prev => ({ ...prev, currentRepoData: repoData }))
  }

  const updateMemoryId = (memoryId: string | undefined) => {
    setState(prev => ({ ...prev, currentMemoryId: memoryId }))
  }

  const updateTabState = <T extends keyof AppState['tabStates']>(
    tab: T,
    updates: Partial<AppState['tabStates'][T]>
  ) => {
    setState(prev => ({
      ...prev,
      tabStates: {
        ...prev.tabStates,
        [tab]: {
          ...prev.tabStates[tab],
          ...updates
        }
      }
    }))
  }

  const updateUIState = (updates: Partial<AppState['uiState']>) => {
    setState(prev => ({
      ...prev,
      uiState: {
        ...prev.uiState,
        ...updates,
        lastActivity: new Date()
      }
    }))
  }

  const clearState = () => {
    setState(defaultState)
    localStorage.removeItem(STORAGE_KEY)
  }

  const restoreFromMemory = (repoData: RepoData, memoryId: string) => {
    setState(prev => ({
      ...defaultState,
      currentRepoData: repoData,
      currentMemoryId: memoryId
    }))
  }

  return (
    <AppStateContext.Provider
      value={{
        state,
        updateRepoData,
        updateMemoryId,
        updateTabState,
        updateUIState,
        clearState,
        restoreFromMemory
      }}
    >
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
    }
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider')
  }
  return context
}
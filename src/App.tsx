import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/auth-context'
import { Header } from '@/components/header'
import { MainContent } from '@/components/main-content'
import { Toaster } from '@/components/ui/sonner'
import { AnalysisMemory } from '@/types/memory'
import { MadeWithBolt } from '@/components/made-with-bolt'
import { useState } from 'react'
import './App.css'

function AppContent() {
  const [currentMemoryId, setCurrentMemoryId] = useState<string | undefined>()
  const [memoriesCount, setMemoriesCount] = useState(0)

  const handleLoadMemory = (memory: AnalysisMemory) => {
    setCurrentMemoryId(memory.id)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onLoadMemory={handleLoadMemory}
        currentMemoryId={currentMemoryId}
        memoriesCount={memoriesCount}
      />
      <MainContent 
        onMemoryChange={setCurrentMemoryId}
        onMemoriesCountChange={setMemoriesCount}
      />
      <Toaster />
      
      {/* Bolt Hackathon Badge */}
      <a 
        href="https://bolt.new/"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-50 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        aria-label="Built with Bolt"
      >
        <div className="w-12 h-12 rounded-full bg-white dark:bg-black shadow-lg flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21.5L17.5 13L13 10L15 2.5L6.5 11L11 14L9 21.5Z" fill="currentColor" />
          </svg>
        </div>
      </a>
      
      {/* Made with Bolt mention */}
      <MadeWithBolt position="bottom-left" variant="badge" />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="reposcope-theme">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Github, History, LogIn } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { MemoryPanel } from '@/components/memory-panel'
import { AuthModal } from '@/components/auth/auth-modal'
import { UserMenu } from '@/components/auth/user-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnalysisMemory } from '@/types/memory'
import { useAuth } from '@/contexts/auth-context'
import { DatabaseMemoryManager } from '@/utils/database-memory-manager'
import { MadeWithBolt } from '@/components/made-with-bolt'
import { useEffect } from 'react'

interface HeaderProps {
  onLoadMemory?: (memory: AnalysisMemory) => void
  currentMemoryId?: string
  memoriesCount?: number
}

export function Header({ onLoadMemory, currentMemoryId, memoriesCount = 0 }: HeaderProps) {
  const [showMemoryPanel, setShowMemoryPanel] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const memoryManager = DatabaseMemoryManager.getInstance()

  useEffect(() => {
    if (user) {
      memoryManager.setUserId(user.id)
    } else {
      memoryManager.setUserId(null)
    }
  }, [user])

  const handleLoadMemory = (memory: AnalysisMemory) => {
    onLoadMemory?.(memory)
  }

  const handleShowHistory = () => {
    if (isAuthenticated) {
      setShowMemoryPanel(true)
    } else {
      setShowAuthModal(true)
    }
  }

  return (
    <>
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className="relative">
                <Brain className="h-8 w-8 text-primary" />
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  RepoScope.AI
                </h1>
                <p className="text-xs text-muted-foreground">AI-Powered Repository Analysis</p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-4">
              {/* History/Memory Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowHistory}
                  className="flex items-center space-x-2"
                >
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">History</span>
                  {isAuthenticated && memoriesCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
                      {memoriesCount}
                    </Badge>
                  )}
                </Button>
              </motion.div>

              <motion.a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Github className="h-4 w-4" />
                <span className="hidden sm:inline">GitHub</span>
              </motion.a>

              {/* Auth Section */}
              {isAuthenticated ? (
                <UserMenu 
                  memoriesCount={memoriesCount} 
                  onShowHistory={handleShowHistory}
                />
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center space-x-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Button>
              )}

              <ThemeToggle />
            </div>
          </div>
        </div>
        
        {/* Made with Bolt mention in header */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 transform">
          <MadeWithBolt position="footer" variant="minimal" className="py-1 text-[10px] opacity-70 hover:opacity-100" />
        </div>
      </motion.header>

      {/* Memory Panel */}
      {isAuthenticated && (
        <MemoryPanel
          isOpen={showMemoryPanel}
          onClose={() => setShowMemoryPanel(false)}
          onLoadMemory={handleLoadMemory}
          currentMemoryId={currentMemoryId}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  )
}
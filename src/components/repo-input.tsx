import { useState } from 'react'
import { motion } from 'framer-motion'
import { Github, Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { MadeWithBolt } from '@/components/made-with-bolt'

interface RepoInputProps {
  onAnalyze: (url: string) => void
  isLoading: boolean
}

export function RepoInput({ onAnalyze, isLoading }: RepoInputProps) {
  const [url, setUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onAnalyze(url.trim())
    }
  }

  const isValidGithubUrl = (url: string) => {
    return url.includes('github.com') && url.includes('/')
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div 
        className="text-center space-y-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="space-y-4">
          <motion.div
            className="flex justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Understand Any
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {" "}Repository
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Paste any GitHub repository URL and get instant AI-powered insights, architecture diagrams, 
            test generation, and comprehensive documentation.
          </p>
          
          <div className="flex justify-center">
            <MadeWithBolt position="footer" variant="minimal" className="mt-2 text-xs opacity-70" />
          </div>
        </div>
        
        {/* Features Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {[
            { icon: '🧠', title: 'AI Analysis', desc: 'Smart code understanding' },
            { icon: '🏗️', title: 'Architecture', desc: 'Visual diagrams' },
            { icon: '🧪', title: 'Test Generation', desc: 'Automated test cases' }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-4 rounded-xl bg-card border border-border/50 backdrop-blur-sm"
            >
              <div className="text-2xl mb-2">{feature.icon}</div>
              <div className="font-semibold text-sm">{feature.title}</div>
              <div className="text-xs text-muted-foreground">{feature.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card className="max-w-2xl mx-auto shadow-lg border-border/50">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="repo-url" className="text-sm font-medium flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  GitHub Repository URL
                </label>
                <div className="flex gap-2">
                  <Input
                    id="repo-url"
                    type="url"
                    placeholder="https://github.com/username/repository"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 h-12 text-base"
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    size="lg"
                    disabled={!isValidGithubUrl(url) || isLoading}
                    className="px-6 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Analyze
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                We'll analyze the repository structure, detect the tech stack, and provide AI insights.
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="flex justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
            />
          </div>
          <p className="text-muted-foreground">Analyzing repository...</p>
        </motion.div>
      )}
    </div>
  )
}
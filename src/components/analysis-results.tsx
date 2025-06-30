import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, File as FileTree, MessageSquare, TestTube, FileText, BarChart3, Code, Cpu, Star, TrendingUp, Users, Lightbulb, Zap, Award, Target, BookOpen, Brain, Heart, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { FileTreeView } from '@/components/file-tree-view'
import { ArchitectureDiagram } from '@/components/architecture-diagram'
import { ChatInterface } from '@/components/chat-interface'
import { TestGenerator } from '@/components/test-generator'
import { DocsGenerator } from '@/components/docs-generator'
import { CodeExplanation } from '@/components/code-explanation'
import { BuildNextAnalyzer } from '@/components/build-next-analyzer'
import { RepoHealthAnalyzer } from '@/components/repo-health-analyzer'
import { TutorialGenerator } from '@/components/tutorial-generator'
import { DevEnvironmentDetector } from '@/components/dev-environment-detector'
import { RepoData } from '@/types'
import { AnalysisMemory } from '@/types/memory'

interface AnalysisResultsProps {
  repoData: RepoData
  onNewAnalysis: () => void
  currentMemoryId?: string
  onLoadMemory?: (memory: AnalysisMemory) => void
}

export function AnalysisResults({ repoData, onNewAnalysis, currentMemoryId, onLoadMemory }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedFile, setSelectedFile] = useState<string>('')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'structure', label: 'File Tree', icon: FileTree },
    { id: 'explanation', label: 'Code Explanation', icon: Code },
    { id: 'architecture', label: 'Architecture', icon: Cpu },
    { id: 'environment', label: 'Dev Environment', icon: Monitor },
    { id: 'health', label: 'Repo Health', icon: Heart },
    { id: 'tutorial', label: 'Tutorial', icon: BookOpen },
    { id: 'build-next', label: 'Build Next', icon: Target },
    { id: 'chat', label: 'Ask Anything', icon: MessageSquare },
    { id: 'tests', label: 'Test Generator', icon: TestTube },
    { id: 'docs', label: 'Documentation', icon: FileText },
  ]

  const handleFileSelect = (fileName: string) => {
    console.log('File selected:', fileName)
    setSelectedFile(fileName)
    setActiveTab('explanation')
  }

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
  }

  console.log('Repository structure:', repoData.structure)
  console.log('Selected file:', selectedFile)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 border border-blue-200/50 dark:border-blue-800/50"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onNewAnalysis}
                className="flex items-center space-x-2 hover:bg-white/50 dark:hover:bg-black/20"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>New Analysis</span>
              </Button>
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {repoData.owner}/{repoData.name}
                  </h2>
                  <Badge variant="secondary" className="bg-white/50 dark:bg-black/20">
                    <Star className="w-3 h-3 mr-1" />
                    Analyzed
                  </Badge>
                  {currentMemoryId && (
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <BookOpen className="w-3 h-3 mr-1" />
                      Saved
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground max-w-2xl">{repoData.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-white/50 dark:bg-black/20">
                <TrendingUp className="w-3 h-3 mr-1" />
                {repoData.techStackDetailed.confidence}% Confidence
              </Badge>
              <Badge variant="outline" className="bg-white/50 dark:bg-black/20">
                <Users className="w-3 h-3 mr-1" />
                Production Ready
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Tech Stack */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid gap-6 md:grid-cols-2"
      >
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16" />
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <span>Tech Stack Detected</span>
            </CardTitle>
            <CardDescription>
              AI Analysis Confidence: {repoData.techStackDetailed.confidence}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Progress value={repoData.techStackDetailed.confidence} className="w-full h-2" />
              <div className="absolute -top-1 left-0 w-full flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
            
            <div className="grid gap-3">
              {repoData.techStackDetailed.language && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg"
                >
                  <span className="text-sm font-medium flex items-center space-x-2">
                    <Code className="w-4 h-4 text-blue-600" />
                    <span>Primary Language</span>
                  </span>
                  <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                    {repoData.techStackDetailed.language}
                  </Badge>
                </motion.div>
              )}
              
              {repoData.techStackDetailed.frontend && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg"
                >
                  <span className="text-sm font-medium flex items-center space-x-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <span>Frontend Framework</span>
                  </span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {repoData.techStackDetailed.frontend}
                  </Badge>
                </motion.div>
              )}
              
              {repoData.techStackDetailed.backend && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 rounded-lg"
                >
                  <span className="text-sm font-medium flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-purple-600" />
                    <span>Backend Framework</span>
                  </span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {repoData.techStackDetailed.backend}
                  </Badge>
                </motion.div>
              )}
              
              {repoData.techStackDetailed.database && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-lg"
                >
                  <span className="text-sm font-medium flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-orange-600" />
                    <span>Database</span>
                  </span>
                  <Badge variant="outline" className="border-orange-200 text-orange-800 dark:border-orange-800 dark:text-orange-200">
                    {repoData.techStackDetailed.database}
                  </Badge>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-full -translate-y-16 translate-x-16" />
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <span>Infrastructure & Tools</span>
            </CardTitle>
            <CardDescription>
              {repoData.techStackDetailed.infra.length} development tools detected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {repoData.techStackDetailed.infra.map((tool, index) => (
                <motion.div
                  key={tool}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Badge variant="outline" className="px-3 py-1 hover:bg-muted/50 transition-colors">
                    {tool}
                  </Badge>
                </motion.div>
              ))}
              {repoData.techStackDetailed.infra.length === 0 && (
                <span className="text-sm text-muted-foreground">No infrastructure tools detected</span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Tabs */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Main Analysis</h3>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="h-auto p-1 bg-muted/50 rounded-lg grid grid-cols-3 md:grid-cols-6 gap-1">
              {tabs.slice(0, 6).map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center justify-center space-x-2 py-2.5 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-md transition-all"
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Tools & Generators</h3>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="h-auto p-1 bg-muted/50 rounded-lg grid grid-cols-3 md:grid-cols-5 gap-1">
              {tabs.slice(6).map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center justify-center space-x-2 py-2.5 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-md transition-all"
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Tab Content */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Enhanced Beginner Explanation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-full -translate-y-12 translate-x-12" />
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                        <Brain className="w-5 h-5 text-teal-600" />
                      </div>
                      <span>Beginner-Friendly Overview</span>
                      <Badge variant="secondary" className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                        <Lightbulb className="w-3 h-3 mr-1" />
                        Easy to Understand
                      </Badge>
                    </CardTitle>
                    <CardDescription>Perfect for newcomers and non-technical stakeholders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div 
                        className="text-sm leading-relaxed space-y-3"
                        dangerouslySetInnerHTML={{ 
                          __html: repoData.analysis.beginner
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-teal-700 dark:text-teal-300">$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/^• /gm, '<span class="text-teal-600">•</span> ')
                            .replace(/^🎯/gm, '<span class="text-2xl">🎯</span>')
                            .replace(/^🏗️/gm, '<span class="text-2xl">🏗️</span>')
                            .replace(/^🛠️/gm, '<span class="text-2xl">🛠️</span>')
                            .replace(/^📊/gm, '<span class="text-2xl">📊</span>')
                            .replace(/^🎯/gm, '<span class="text-2xl">🎯</span>')
                            .replace(/\n\n/g, '</p><p class="mt-3">')
                            .replace(/^/, '<p>')
                            .replace(/$/, '</p>')
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Enhanced Expert Analysis */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-500/10 to-gray-500/10 rounded-full -translate-y-12 translate-x-12" />
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <div className="p-2 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                        <BookOpen className="w-5 h-5 text-slate-600" />
                      </div>
                      <span>Expert Technical Analysis</span>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200">
                        <Zap className="w-3 h-3 mr-1" />
                        Deep Dive
                      </Badge>
                    </CardTitle>
                    <CardDescription>Comprehensive technical assessment for developers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div 
                        className="text-sm leading-relaxed space-y-3"
                        dangerouslySetInnerHTML={{ 
                          __html: repoData.analysis.expert
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-700 dark:text-slate-300">$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/^• /gm, '<span class="text-slate-600">•</span> ')
                            .replace(/^🏛️/gm, '<span class="text-2xl">🏛️</span>')
                            .replace(/^🔧/gm, '<span class="text-2xl">🔧</span>')
                            .replace(/^📊/gm, '<span class="text-2xl">📊</span>')
                            .replace(/^🎯/gm, '<span class="text-2xl">🎯</span>')
                            .replace(/^🔍/gm, '<span class="text-2xl">🔍</span>')
                            .replace(/^🏗️/gm, '<span class="text-2xl">🏗️</span>')
                            .replace(/\n\n/g, '</p><p class="mt-3">')
                            .replace(/^/, '<p>')
                            .replace(/$/, '</p>')
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="structure">
            {Object.keys(repoData.structure).length > 0 ? (
              <FileTreeView 
                structure={repoData.structure} 
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
              />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <FileTree className="w-12 h-12 text-muted-foreground mx-auto" />
                    <div>
                      <p className="text-lg font-medium">No File Structure Available</p>
                      <p className="text-sm text-muted-foreground">
                        The repository structure could not be loaded. This might be due to:
                      </p>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                        <li>• Repository is empty or private</li>
                        <li>• Network connectivity issues</li>
                        <li>• Repository analysis is still in progress</li>
                      </ul>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={onNewAnalysis}
                      >
                        Try Another Repository
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="explanation">
            <CodeExplanation 
              fileName={selectedFile}
              onFileSelect={handleFileSelect}
            />
          </TabsContent>

          <TabsContent value="architecture">
            <ArchitectureDiagram repoData={repoData} />
          </TabsContent>

          <TabsContent value="environment">
            <DevEnvironmentDetector repoData={repoData} />
          </TabsContent>

          <TabsContent value="health">
            <RepoHealthAnalyzer repoData={repoData} />
          </TabsContent>

          <TabsContent value="tutorial">
            <TutorialGenerator repoData={repoData} />
          </TabsContent>

          <TabsContent value="build-next">
            <BuildNextAnalyzer repoData={repoData} />
          </TabsContent>

          <TabsContent value="chat">
            <ChatInterface repoData={repoData} />
          </TabsContent>

          <TabsContent value="tests">
            <TestGenerator repoData={repoData} />
          </TabsContent>

          <TabsContent value="docs">
            <DocsGenerator repoData={repoData} />
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  )
}
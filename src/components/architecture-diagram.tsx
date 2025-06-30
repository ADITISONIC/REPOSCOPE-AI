import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, Download, Copy, CheckCircle, Cpu, Zap } from 'lucide-react'
import { RepoData } from '@/types'
import { toast } from 'sonner'

interface ArchitectureDiagramProps {
  repoData: RepoData
}

interface ArchitectureData {
  mermaidCode: string
  components: string[]
  architecture: string
  reasoning: string
  confidence: number
}

export function ArchitectureDiagram({ repoData }: ArchitectureDiagramProps) {
  const diagramRef = useRef<HTMLDivElement>(null)
  const [architectureData, setArchitectureData] = useState<ArchitectureData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!architectureData && !isGenerating) {
      generateArchitectureDiagram()
    }
  }, [repoData])

  const generateArchitectureDiagram = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      // Call the architecture analyzer edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/architecture-analyzer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          languageStats: generateLanguageStats(),
          keyFiles: [], // Would be populated from actual analysis
          filePaths: extractFilePaths(repoData.structure),
          repoInfo: {
            name: repoData.name,
            owner: repoData.owner,
            description: repoData.description
          },
          techStackDetailed: repoData.techStackDetailed
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate architecture diagram')
      }

      const data = await response.json()
      setArchitectureData(data)
      
      // Render the Mermaid diagram
      await renderMermaidDiagram(data.mermaidCode)
      
      toast.success('Architecture diagram generated successfully!')
      
    } catch (error) {
      console.error('Error generating architecture diagram:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate diagram')
      
      // Generate fallback diagram
      const fallbackData = generateFallbackArchitecture()
      setArchitectureData(fallbackData)
      await renderMermaidDiagram(fallbackData.mermaidCode)
      
      toast.warning('Using fallback architecture diagram')
    } finally {
      setIsGenerating(false)
    }
  }

  const renderMermaidDiagram = async (mermaidCode: string) => {
    if (!diagramRef.current) return

    try {
      const mermaid = (await import('mermaid')).default
      
      // Configure Mermaid with enhanced styling
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          primaryColor: '#3b82f6',
          primaryTextColor: '#1f2937',
          primaryBorderColor: '#1e40af',
          lineColor: '#6b7280',
          sectionBkgColor: '#f8fafc',
          altSectionBkgColor: '#f1f5f9',
          gridColor: '#e5e7eb',
          secondaryColor: '#06b6d4',
          tertiaryColor: '#8b5cf6',
          background: '#ffffff',
          mainBkg: '#ffffff',
          secondBkg: '#f8fafc',
          tertiaryBkg: '#f1f5f9'
        },
        flowchart: {
          htmlLabels: true,
          curve: 'basis',
          padding: 20,
          nodeSpacing: 50,
          rankSpacing: 80,
          diagramPadding: 20
        },
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 14
      })

      // Clear previous content
      diagramRef.current.innerHTML = ''
      
      // Generate unique ID for this diagram
      const diagramId = `architecture-diagram-${Date.now()}`
      
      // Render the diagram
      const { svg } = await mermaid.render(diagramId, mermaidCode)
      diagramRef.current.innerHTML = svg
      
    } catch (error) {
      console.error('Error rendering Mermaid diagram:', error)
      diagramRef.current.innerHTML = `
        <div class="flex items-center justify-center p-8 text-muted-foreground">
          <div class="text-center">
            <Cpu class="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Unable to render architecture diagram</p>
            <p class="text-sm mt-2">The diagram syntax may need adjustment</p>
          </div>
        </div>
      `
    }
  }

  const generateLanguageStats = (): Record<string, number> => {
    // Generate language stats from tech stack
    const stats: Record<string, number> = {}
    
    if (repoData.techStackDetailed.language) {
      stats[repoData.techStackDetailed.language] = 70
    }
    
    if (repoData.techStackDetailed.frontend) {
      stats['Frontend'] = 20
    }
    
    if (repoData.techStackDetailed.backend) {
      stats['Backend'] = 10
    }
    
    return stats
  }

  const extractFilePaths = (structure: any, basePath: string = ''): string[] => {
    const paths: string[] = []
    
    for (const [name, node] of Object.entries(structure)) {
      const currentPath = basePath ? `${basePath}/${name}` : name
      
      if ((node as any).type === 'file') {
        paths.push(currentPath)
      } else if ((node as any).type === 'folder' && (node as any).children) {
        paths.push(currentPath + '/')
        paths.push(...extractFilePaths((node as any).children, currentPath))
      }
    }
    
    return paths
  }

  const generateFallbackArchitecture = (): ArchitectureData => {
    const { techStackDetailed } = repoData
    
    let mermaidCode = 'graph TD\n'
    const components = []
    
    // Build diagram based on detected tech stack
    if (techStackDetailed.frontend && techStackDetailed.backend) {
      mermaidCode += `    Client[Web Browser] --> Frontend[${techStackDetailed.frontend}]\n`
      mermaidCode += `    Frontend -->|API Calls| Backend[${techStackDetailed.backend}]\n`
      components.push('Frontend', 'Backend')
      
      if (techStackDetailed.database) {
        mermaidCode += `    Backend -->|Queries| DB[(${techStackDetailed.database})]\n`
        components.push('Database')
      }
    } else if (techStackDetailed.frontend) {
      mermaidCode += `    Client[Web Browser] --> App[${techStackDetailed.frontend} App]\n`
      components.push('Frontend Application')
      
      if (techStackDetailed.database) {
        mermaidCode += `    App -->|Data| DB[(${techStackDetailed.database})]\n`
        components.push('Database')
      }
    } else if (techStackDetailed.backend) {
      mermaidCode += `    Client[API Client] --> API[${techStackDetailed.backend} API]\n`
      components.push('API Service')
      
      if (techStackDetailed.database) {
        mermaidCode += `    API -->|Queries| DB[(${techStackDetailed.database})]\n`
        components.push('Database')
      }
    } else {
      mermaidCode += `    Client[User] --> App[${techStackDetailed.language} Application]\n`
      mermaidCode += `    App --> Data[(Data Storage)]\n`
      components.push('Application', 'Data Storage')
    }
    
    // Add infrastructure if detected
    if (techStackDetailed.infra.includes('Docker')) {
      mermaidCode += `    Docker[Docker Container] --> App\n`
      components.push('Docker')
    }
    
    if (techStackDetailed.infra.some((tool: string) => tool.includes('CI') || tool.includes('Actions'))) {
      mermaidCode += `    CI[CI/CD Pipeline] -->|Deploy| App\n`
      components.push('CI/CD')
    }
    
    // Add styling
    mermaidCode += `\n    style Client fill:#e1f5fe`
    mermaidCode += `\n    style App fill:#f3e5f5`
    if (components.includes('Database')) {
      mermaidCode += `\n    style DB fill:#e8f5e8`
    }
    
    return {
      mermaidCode,
      components,
      architecture: techStackDetailed.architecture || 'Standard Application',
      reasoning: `Architecture diagram generated based on detected tech stack: ${repoData.techStack.join(', ')}`,
      confidence: techStackDetailed.confidence || 75
    }
  }

  const copyMermaidCode = async () => {
    if (!architectureData) return
    
    try {
      await navigator.clipboard.writeText(architectureData.mermaidCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Mermaid code copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const downloadDiagram = () => {
    if (!diagramRef.current) return
    
    const svg = diagramRef.current.querySelector('svg')
    if (!svg) return
    
    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)
    
    const downloadLink = document.createElement('a')
    downloadLink.href = svgUrl
    downloadLink.download = `${repoData.name}-architecture.svg`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    URL.revokeObjectURL(svgUrl)
    
    toast.success('Architecture diagram downloaded!')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Cpu className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>Architecture Diagram</span>
                  {architectureData && (
                    <Badge variant="secondary" className="ml-2">
                      <Zap className="w-3 h-3 mr-1" />
                      AI Generated
                    </Badge>
                  )}
                </CardTitle>
                {architectureData && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {architectureData.architecture} • {architectureData.confidence}% confidence
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={generateArchitectureDiagram}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="ml-2">Regenerate</span>
              </Button>
              
              {architectureData && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyMermaidCode}
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span className="ml-2">{copied ? 'Copied!' : 'Copy Code'}</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadDiagram}
                  >
                    <Download className="w-4 h-4" />
                    <span className="ml-2">Download</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Architecture Diagram */}
          <div className="relative">
            <div 
              ref={diagramRef} 
              className="w-full flex justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900/20 rounded-lg border-2 border-dashed border-border/50 min-h-[400px] items-center"
            />
            
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg"
              >
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"
                  />
                  <div>
                    <p className="font-medium">Generating Architecture Diagram</p>
                    <p className="text-sm text-muted-foreground">AI is analyzing your repository structure...</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Architecture Details */}
          {architectureData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Components */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <span>Identified Components</span>
                  <Badge variant="outline" className="ml-2">
                    {architectureData.components.length}
                  </Badge>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {architectureData.components.map((component, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {component}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Architecture Analysis */}
              <div>
                <h4 className="font-semibold mb-2">Architecture Analysis</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {architectureData.reasoning}
                </p>
              </div>
              
              {/* Mermaid Code Preview */}
              <details className="group">
                <summary className="cursor-pointer font-semibold text-sm flex items-center space-x-2 hover:text-primary transition-colors">
                  <span>View Mermaid Code</span>
                  <span className="text-xs text-muted-foreground group-open:hidden">(Click to expand)</span>
                </summary>
                <div className="mt-3 p-4 bg-muted rounded-lg">
                  <pre className="text-xs overflow-x-auto">
                    <code>{architectureData.mermaidCode}</code>
                  </pre>
                </div>
              </details>
            </motion.div>
          )}
          
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
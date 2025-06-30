import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Copy, CheckCircle, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { RepoData } from '@/types'

interface DocsGeneratorProps {
  repoData: RepoData
}

export function DocsGenerator({ repoData }: DocsGeneratorProps) {
  const [readme, setReadme] = useState('')
  const [onboarding, setOnboarding] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedDoc, setCopiedDoc] = useState<string | null>(null)

  const generateDocs = async () => {
    setIsGenerating(true)
    
    // Simulate documentation generation
    setTimeout(() => {
      const mockReadme = `# ${repoData.name}

${repoData.description}

## 🚀 Tech Stack

${repoData.techStack.map(tech => `- ${tech}`).join('\n')}

## 📁 Project Structure

\`\`\`
${Object.keys(repoData.structure).map(key => `${key}/`).join('\n')}
\`\`\`

## 🛠️ Installation

1. Clone the repository:
   \`\`\`bash
   git clone ${repoData.url}
   cd ${repoData.name}
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## 🎯 Features

- Modern React application with TypeScript
- Component-based architecture
- Utility functions for common operations
- Clean and maintainable code structure

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
`

      const mockOnboarding = `# 🎯 Onboarding Guide for ${repoData.name}

Welcome to the ${repoData.name} project! This guide will help you get up and running quickly.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher)
- npm or yarn package manager
- Git
- Code editor (VS Code recommended)

## 🏃‍♂️ Quick Start

### Step 1: Environment Setup

1. **Clone the repository:**
   \`\`\`bash
   git clone ${repoData.url}
   cd ${repoData.name}
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Start development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

### Step 2: Understanding the Codebase

#### 🏗️ Architecture Overview
${repoData.analysis.expert}

#### 📂 Key Directories

- **\`src/components/\`** - Reusable UI components
- **\`src/utils/\`** - Utility functions and helpers
- **\`src/\`** - Main application files

### Step 3: Development Workflow

1. **Create a new branch:**
   \`\`\`bash
   git checkout -b feature/your-feature-name
   \`\`\`

2. **Make your changes**
3. **Test your changes:**
   \`\`\`bash
   npm run test
   \`\`\`

4. **Build for production:**
   \`\`\`bash
   npm run build
   \`\`\`

## 🎨 Code Style

This project uses:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting

## 🐛 Common Issues

### Issue: Dependencies not installing
**Solution:** Delete \`node_modules\` and \`package-lock.json\`, then run \`npm install\`

### Issue: Development server not starting
**Solution:** Check if port 3000 is available or use a different port

## 📚 Additional Resources

- [Project Documentation](./docs/)
- [API Reference](./docs/api.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## 🆘 Getting Help

If you need help:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Join our community discussions

Happy coding! 🎉
`

      setReadme(mockReadme)
      setOnboarding(mockOnboarding)
      setIsGenerating(false)
    }, 2000)
  }

  const copyToClipboard = async (content: string, docType: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedDoc(docType)
    setTimeout(() => setCopiedDoc(null), 2000)
  }

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Documentation Generator</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground">
              Generate comprehensive documentation for your repository
            </p>
            <Button 
              onClick={generateDocs}
              disabled={isGenerating}
              className="flex items-center space-x-2"
            >
              {isGenerating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              <span>{isGenerating ? 'Generating...' : 'Generate Docs'}</span>
            </Button>
          </div>

          {(readme || onboarding) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Tabs defaultValue="readme" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="readme">README.md</TabsTrigger>
                  <TabsTrigger value="onboarding">ONBOARDING.md</TabsTrigger>
                </TabsList>

                <TabsContent value="readme" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">README.md</h3>
                      <Badge variant="secondary">Markdown</Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(readme, 'readme')}
                      >
                        {copiedDoc === 'readme' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span className="ml-2">
                          {copiedDoc === 'readme' ? 'Copied!' : 'Copy'}
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(readme, 'README.md')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={readme}
                    readOnly
                    className="font-mono text-sm min-h-[400px] bg-muted"
                  />
                </TabsContent>

                <TabsContent value="onboarding" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">ONBOARDING.md</h3>
                      <Badge variant="secondary">Markdown</Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(onboarding, 'onboarding')}
                      >
                        {copiedDoc === 'onboarding' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span className="ml-2">
                          {copiedDoc === 'onboarding' ? 'Copied!' : 'Copy'}
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(onboarding, 'ONBOARDING.md')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={onboarding}
                    readOnly
                    className="font-mono text-sm min-h-[400px] bg-muted"
                  />
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
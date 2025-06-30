import { TechStackResult } from '@/utils/tech-stack-detector'

export interface RepoData {
  url: string
  name: string
  owner: string
  description: string
  techStack: string[]
  techStackDetailed: TechStackResult
  structure: FileStructure
  analysis: {
    beginner: string
    expert: string
  }
}

export interface FileStructure {
  [key: string]: FileNode
}

export interface FileNode {
  type: 'file' | 'folder'
  explanation?: string
  children?: FileStructure
}

export interface TestPlaygroundConfig {
  language: 'javascript' | 'typescript' | 'python'
  testFramework: 'jest' | 'vitest' | 'pytest'
  fileName: string
  functionName: string
  testCode: string
  sourceCode: string
}
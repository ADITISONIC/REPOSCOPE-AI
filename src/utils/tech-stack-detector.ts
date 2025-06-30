import { EnhancedAnalyzer, EnhancedAnalysisResult } from './enhanced-analyzer'

export interface TechStackResult {
  language: string
  frontend?: string
  backend?: string
  database?: string
  infra: string[]
  confidence: number
  rationale: string[]
  projectType: string
  architecture: string
  purpose: string
}

export interface FileAnalysis {
  fileName: string
  content: string
}

export class TechStackDetector {
  private files: FileAnalysis[] = []
  private allFilePaths: string[] = []
  private repoInfo: any = {}
  
  constructor(files: FileAnalysis[], allFilePaths: string[] = [], repoInfo: any = {}) {
    this.files = files
    this.allFilePaths = allFilePaths
    this.repoInfo = repoInfo
  }

  public async analyze(): Promise<TechStackResult> {
    // Use the enhanced analyzer for much better results
    const enhancedAnalyzer = new EnhancedAnalyzer(this.files, this.allFilePaths, this.repoInfo)
    const enhancedResult = await enhancedAnalyzer.analyze()
    
    // Convert to TechStackResult format
    return this.convertEnhancedResult(enhancedResult)
  }

  private convertEnhancedResult(enhanced: EnhancedAnalysisResult): TechStackResult {
    return {
      language: enhanced.language,
      frontend: enhanced.frontend,
      backend: enhanced.backend,
      database: enhanced.database,
      infra: enhanced.infra,
      confidence: enhanced.confidence,
      rationale: enhanced.rationale,
      projectType: enhanced.projectType,
      architecture: enhanced.architecture,
      purpose: enhanced.purpose
    }
  }
}
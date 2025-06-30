export interface GitHubFile {
  name: string
  path: string
  type: 'file' | 'dir'
  content?: string
  download_url?: string
}

export interface GitHubRepo {
  name: string
  full_name: string
  description: string
  language: string
  languages_url: string
  contents_url: string
}

export class GitHubAPI {
  private unzippedFiles: { [path: string]: string } = {};
  private currentRepoUrl: string = '';
  
  async fetchRepository(repoUrl: string): Promise<GitHubRepo> {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    
    return {
      name: repo,
      full_name: `${owner}/${repo}`,
      description: 'Repository analysis via backend processing',
      language: 'Unknown',
      languages_url: '',
      contents_url: ''
    };
  }
  
  async fetchRepositoryContents(repoUrl: string, path: string = ''): Promise<GitHubFile[]> {
    // If this is a new repository, download and unzip it via backend
    if (this.currentRepoUrl !== repoUrl) {
      await this.downloadAndUnzipRepository(repoUrl);
      this.currentRepoUrl = repoUrl;
    }
    
    const files: GitHubFile[] = [];
    const normalizedPath = path.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
    const searchPath = normalizedPath ? normalizedPath + '/' : '';
    
    // Get all files that are direct children of the requested path
    const pathsInDirectory = new Set<string>();
    
    for (const filePath in this.unzippedFiles) {
      if (filePath.startsWith(searchPath)) {
        const relativePath = filePath.substring(searchPath.length);
        const pathParts = relativePath.split('/');
        
        if (pathParts.length === 1 && pathParts[0]) {
          // It's a direct file
          pathsInDirectory.add(pathParts[0]);
        } else if (pathParts.length > 1 && pathParts[0]) {
          // It's a directory
          pathsInDirectory.add(pathParts[0]);
        }
      }
    }
    
    // Convert to GitHubFile objects
    for (const name of pathsInDirectory) {
      const fullPath = searchPath + name;
      const isFile = this.unzippedFiles.hasOwnProperty(fullPath);
      
      files.push({
        name,
        path: fullPath,
        type: isFile ? 'file' : 'dir',
        download_url: isFile ? fullPath : undefined
      });
    }
    
    return files.sort((a, b) => {
      // Directories first, then files
      if (a.type !== b.type) {
        return a.type === 'dir' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }
  
  async fetchFileContent(filePath: string): Promise<string> {
    if (this.unzippedFiles.hasOwnProperty(filePath)) {
      return this.unzippedFiles[filePath];
    }
    throw new Error(`File not found: ${filePath}`);
  }
  
  async fetchLanguages(repoUrl: string): Promise<Record<string, number>> {
    // Language detection is not available via ZIP method
    // Could be implemented by analyzing file extensions
    return {};
  }
  
  private parseRepoUrl(url: string): { owner: string; repo: string; branch: string } {
    // Handle various GitHub URL formats
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?(?:\.git)?(?:\/.*)?$/,
      /^([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?$/
    ];
    
    let cleanUrl = url.replace(/^https?:\/\//, '').replace(/\.git$/, '');
    
    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match) {
        return { 
          owner: match[1], 
          repo: match[2],
          branch: match[3] || 'main'
        };
      }
    }
    
    throw new Error('Invalid GitHub repository URL');
  }
  
  private async downloadAndUnzipRepository(repoUrl: string): Promise<void> {
    try {
      console.log('Downloading repository:', repoUrl);
      
      // Call the backend Edge Function instead of direct fetch
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-repo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ repoUrl })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Backend request failed: ${response.status} ${response.statusText}`);
      }
      
      const { files } = await response.json();
      
      console.log('Downloaded files:', Object.keys(files).length, 'files');
      console.log('Sample files:', Object.keys(files).slice(0, 10));
      
      // Clear previous files and set new ones
      this.unzippedFiles = files;
      
    } catch (error) {
      console.error('Error downloading repository:', error);
      throw new Error(`Failed to download repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async buildFileStructure(repoUrl: string, maxDepth: number = 4): Promise<any> {
    // Ensure repository is downloaded
    if (this.currentRepoUrl !== repoUrl) {
      await this.downloadAndUnzipRepository(repoUrl);
      this.currentRepoUrl = repoUrl;
    }
    
    console.log('Building file structure from', Object.keys(this.unzippedFiles).length, 'files');
    
    const structure: any = {};
    
    // Build structure from unzipped files
    for (const filePath in this.unzippedFiles) {
      const pathParts = filePath.split('/');
      let current = structure;
      
      // Navigate through the path, creating folders as needed
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        if (!part) continue; // Skip empty parts
        
        if (i === pathParts.length - 1) {
          // This is a file
          current[part] = {
            type: 'file',
            explanation: this.generateFileExplanation(part, filePath)
          };
        } else {
          // This is a folder
          if (!current[part]) {
            current[part] = {
              type: 'folder',
              children: {}
            };
          }
          current = current[part].children;
        }
      }
    }
    
    console.log('Built structure:', structure);
    console.log('Structure keys:', Object.keys(structure));
    
    return structure;
  }
  
  private generateFileExplanation(fileName: string, filePath: string): string {
    const explanations: Record<string, string> = {
      'package.json': 'NPM package configuration and dependencies',
      'README.md': 'Project documentation and setup instructions',
      'tsconfig.json': 'TypeScript configuration file',
      'vite.config.ts': 'Vite build tool configuration',
      'tailwind.config.js': 'Tailwind CSS configuration',
      'Dockerfile': 'Docker container configuration',
      '.gitignore': 'Git ignore rules for version control',
      'index.html': 'Main HTML template',
      'App.tsx': 'Main application component',
      'main.tsx': 'Application entry point',
      'index.ts': 'Module entry point',
      'server.js': 'Server application entry point',
      'app.py': 'Python application entry point',
      'requirements.txt': 'Python dependencies list',
      'go.mod': 'Go module dependencies',
      'Cargo.toml': 'Rust package configuration'
    };
    
    // Check exact filename matches first
    if (explanations[fileName]) {
      return explanations[fileName];
    }
    
    // Check file extensions
    const ext = fileName.split('.').pop()?.toLowerCase();
    const extExplanations: Record<string, string> = {
      'tsx': 'React TypeScript component',
      'jsx': 'React JavaScript component',
      'ts': 'TypeScript source file',
      'js': 'JavaScript source file',
      'py': 'Python source file',
      'go': 'Go source file',
      'rs': 'Rust source file',
      'css': 'Stylesheet file',
      'scss': 'Sass stylesheet file',
      'json': 'JSON configuration or data file',
      'yml': 'YAML configuration file',
      'yaml': 'YAML configuration file',
      'md': 'Markdown documentation file',
      'txt': 'Text file',
      'env': 'Environment variables file'
    };
    
    if (ext && extExplanations[ext]) {
      return extExplanations[ext];
    }
    
    // Check directory-based patterns
    if (filePath.includes('/components/')) {
      return 'UI component file';
    } else if (filePath.includes('/utils/') || filePath.includes('/lib/')) {
      return 'Utility functions and helpers';
    } else if (filePath.includes('/hooks/')) {
      return 'Custom React hooks';
    } else if (filePath.includes('/pages/') || filePath.includes('/routes/')) {
      return 'Page or route component';
    } else if (filePath.includes('/api/')) {
      return 'API endpoint or service';
    } else if (filePath.includes('/styles/')) {
      return 'Styling and CSS files';
    } else if (filePath.includes('/tests/') || filePath.includes('/__tests__/')) {
      return 'Test files';
    } else if (filePath.includes('/docs/')) {
      return 'Documentation files';
    }
    
    return 'Source code file';
  }
  
  async fetchKeyFiles(repoUrl: string): Promise<Array<{ fileName: string; content: string }>> {
    // Ensure repository is downloaded
    if (this.currentRepoUrl !== repoUrl) {
      await this.downloadAndUnzipRepository(repoUrl);
      this.currentRepoUrl = repoUrl;
    }
    
    const keyFiles = [
      'package.json',
      'requirements.txt',
      'Pipfile',
      'poetry.lock',
      'go.mod',
      'Cargo.toml',
      'Dockerfile',
      'docker-compose.yml',
      'tsconfig.json',
      'next.config.js',
      'next.config.ts',
      'vite.config.js',
      'vite.config.ts',
      'webpack.config.js',
      'angular.json',
      'svelte.config.js',
      'nuxt.config.js',
      'nuxt.config.ts',
      '.github/workflows/ci.yml',
      '.github/workflows/deploy.yml',
      '.gitlab-ci.yml'
    ];
    
    const results: Array<{ fileName: string; content: string }> = [];
    
    for (const fileName of keyFiles) {
      if (this.unzippedFiles.hasOwnProperty(fileName)) {
        results.push({ 
          fileName, 
          content: this.unzippedFiles[fileName] 
        });
      }
    }
    
    console.log('Found key files:', results.map(f => f.fileName));
    
    return results;
  }
}
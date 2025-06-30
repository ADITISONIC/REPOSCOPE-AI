/*
  # GitHub Repository Analysis Edge Function

  1. Purpose
    - Downloads GitHub repositories as ZIP files
    - Extracts and processes file contents
    - Returns structured file data to the frontend

  2. Security
    - CORS enabled for frontend access
    - Error handling for invalid repositories
    - Supports both 'main' and 'master' branch fallback

  3. Dependencies
    - Uses JSZip for ZIP file processing
    - Handles text file extraction only (skips binaries)
*/

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RepoRequest {
  repoUrl: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { repoUrl }: RepoRequest = await req.json()
    
    if (!repoUrl) {
      throw new Error('Repository URL is required')
    }

    // Parse GitHub URL
    const { owner, repo, branch } = parseRepoUrl(repoUrl)
    
    // Download and process ZIP file
    const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`
    
    console.log(`Downloading ZIP from: ${zipUrl}`)
    
    const response = await fetch(zipUrl)
    if (!response.ok) {
      // Try with 'master' branch if 'main' fails
      if (branch === 'main') {
        const masterZipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/master.zip`
        const masterResponse = await fetch(masterZipUrl)
        if (!masterResponse.ok) {
          throw new Error(`Failed to download repository: ${response.status} ${response.statusText}`)
        }
        const masterArrayBuffer = await masterResponse.arrayBuffer()
        const files = await processZipBuffer(masterArrayBuffer, `${repo}-master`)
        return new Response(JSON.stringify({ files, repoInfo: { name: repo, owner, branch: 'master' } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      throw new Error(`Failed to download repository: ${response.status} ${response.statusText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const files = await processZipBuffer(arrayBuffer, `${repo}-${branch}`)
    
    return new Response(JSON.stringify({ files, repoInfo: { name: repo, owner, branch } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error in analyze-repo function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function parseRepoUrl(url: string): { owner: string; repo: string; branch: string } {
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?(?:\.git)?(?:\/.*)?$/,
    /^([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?$/
  ]
  
  let cleanUrl = url.replace(/^https?:\/\//, '').replace(/\.git$/, '')
  
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern)
    if (match) {
      return { 
        owner: match[1], 
        repo: match[2],
        branch: match[3] || 'main'
      }
    }
  }
  
  throw new Error('Invalid GitHub repository URL')
}

async function processZipBuffer(arrayBuffer: ArrayBuffer, expectedRootFolder: string): Promise<Record<string, string>> {
  // Import JSZip dynamically
  const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default
  
  const zip = await JSZip.loadAsync(arrayBuffer)
  const files: Record<string, string> = {}
  
  // Process each file in the zip
  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    if (!zipEntry.dir) {
      // Remove the root folder from the path (GitHub adds repo-branch/ prefix)
      const pathParts = relativePath.split('/')
      if (pathParts.length > 1) {
        const cleanPath = pathParts.slice(1).join('/')
        try {
          const content = await zipEntry.async('text')
          files[cleanPath] = content
        } catch (error) {
          // Skip binary files or files that can't be read as text
          console.warn(`Skipping file ${cleanPath}: ${error.message}`)
        }
      }
    }
  }
  
  return files
}
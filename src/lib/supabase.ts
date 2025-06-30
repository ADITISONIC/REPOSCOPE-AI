import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  })
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

console.log('Supabase client initializing with URL:', supabaseUrl)

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'reposcope-ai'
    }
  }
})

// Auth helpers with better error handling
export const auth = {
  signUp: async (email: string, password: string, username?: string) => {
    try {
      console.log('Auth: Attempting sign up for', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0]
          }
        }
      })
      
      if (error) {
        console.error('Auth: Sign up error:', error)
      } else {
        console.log('Auth: Sign up successful for', email)
      }
      
      return { data, error }
    } catch (error) {
      console.error('Auth: Exception in signUp:', error)
      return { data: null, error: { message: 'An unexpected error occurred' } }
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      console.log('Auth: Attempting sign in for', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        console.error('Auth: Sign in error:', error)
      } else {
        console.log('Auth: Sign in successful for', email)
      }
      
      return { data, error }
    } catch (error) {
      console.error('Auth: Exception in signIn:', error)
      return { data: null, error: { message: 'An unexpected error occurred' } }
    }
  },

  signOut: async () => {
    try {
      console.log('Auth: Attempting sign out')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Auth: Sign out error:', error)
      } else {
        console.log('Auth: Sign out successful')
      }
      
      return { error }
    } catch (error) {
      console.error('Auth: Exception in signOut:', error)
      return { error: { message: 'An unexpected error occurred' } }
    }
  },

  getCurrentUser: async () => {
    try {
      const { data, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Auth: Get current user error:', error)
      }
      
      return { data, error }
    } catch (error) {
      console.error('Auth: Exception in getCurrentUser:', error)
      return { data: null, error: { message: 'An unexpected error occurred' } }
    }
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Test database connection
export const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...')
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection test failed:', error)
      return false
    }
    
    console.log('Supabase connection test successful')
    return true
  } catch (error) {
    console.error('Supabase connection test exception:', error)
    return false
  }
}

// Initialize connection test
testConnection()
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { DatabaseMemoryManager } from '@/utils/database-memory-manager'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, username?: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Get initial session - simple check, no loading states
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Set user ID in memory manager
      const memoryManager = DatabaseMemoryManager.getInstance()
      if (session?.user) {
        memoryManager.setUserId(session.user.id)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        // Update memory manager user ID
        const memoryManager = DatabaseMemoryManager.getInstance()
        if (session?.user) {
          memoryManager.setUserId(session.user.id)
          await createUserProfile(session.user)
        } else {
          memoryManager.setUserId(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const createUserProfile = async (user: User) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
          email: user.email || '',
          avatar_url: user.user_metadata?.avatar_url || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('Error creating user profile:', error)
      }
    } catch (error) {
      console.error('Exception in createUserProfile:', error)
    }
  }

  const signUp = async (email: string, password: string, username?: string) => {
    setLoading(true)
    
    try {
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
        toast.error(error.message)
        return { error }
      }

      if (data.user && !data.session) {
        toast.success('Please check your email to confirm your account')
      } else {
        toast.success('Account created successfully!')
      }

      return { error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.error(message)
      return { error: { message } }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        toast.error(error.message)
        return { error }
      }

      toast.success('Successfully signed in!')
      return { error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.error(message)
      return { error: { message } }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      // Clear memory manager user ID first
      const memoryManager = DatabaseMemoryManager.getInstance()
      memoryManager.setUserId(null)
      
      // Clear local state immediately
      setUser(null)
      setSession(null)
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
      }
      
      // Clear local storage
      try {
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            localStorage.removeItem(key)
          }
        })
        localStorage.removeItem('reposcope_memories')
      } catch (e) {
        console.warn('Could not clear localStorage:', e)
      }
      
      toast.success('Successfully signed out!')
      
    } catch (error) {
      console.error('Exception in signOut:', error)
      setUser(null)
      setSession(null)
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user && !!session
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
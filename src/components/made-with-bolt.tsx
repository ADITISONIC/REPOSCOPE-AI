import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MadeWithBoltProps {
  className?: string
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left' | 'footer'
  variant?: 'default' | 'minimal' | 'badge'
}

export function MadeWithBolt({ 
  className, 
  position = 'bottom-right',
  variant = 'default'
}: MadeWithBoltProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-left': 'top-4 left-4',
    'footer': 'static'
  }

  if (variant === 'minimal') {
    return (
      <motion.a
        href="https://bolt.new"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground transition-colors",
          position !== 'footer' && `fixed ${positionClasses[position]} z-50`,
          className
        )}
        whileHover={{ scale: 1.05 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Zap className="w-3 h-3" />
        <span>Made with Bolt</span>
      </motion.a>
    )
  }

  if (variant === 'badge') {
    return (
      <motion.a
        href="https://bolt.new"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center space-x-1.5 px-2 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary hover:bg-primary/20 transition-colors",
          position !== 'footer' && `fixed ${positionClasses[position]} z-50`,
          className
        )}
        whileHover={{ scale: 1.05 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Zap className="w-3 h-3" />
        <span>Made with Bolt</span>
      </motion.a>
    )
  }

  return (
    <motion.a
      href="https://bolt.new"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group inline-flex items-center space-x-2 px-3 py-2 rounded-lg bg-background border shadow-sm hover:shadow-md transition-all",
        position !== 'footer' && `fixed ${positionClasses[position]} z-50`,
        className
      )}
      whileHover={{ scale: 1.05 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
        <Zap className="w-3 h-3" />
      </div>
      <span className="text-sm font-medium group-hover:text-primary transition-colors">Made with Bolt</span>
    </motion.a>
  )
}
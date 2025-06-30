import { motion } from 'framer-motion'
import { Switch } from '@/components/ui/switch'
import { Brain, GraduationCap } from 'lucide-react'

interface ExplanationToggleProps {
  expertMode: boolean
  onToggle: (expertMode: boolean) => void
}

export function ExplanationToggle({ expertMode, onToggle }: ExplanationToggleProps) {
  return (
    <div className="flex items-center space-x-3 p-3 bg-card rounded-lg border border-border/50">
      <motion.div
        className={`flex items-center space-x-2 transition-all duration-200 ${
          !expertMode ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground'
        }`}
        animate={{ scale: !expertMode ? 1.05 : 1 }}
      >
        <Brain className="w-4 h-4" />
        <span className="text-sm font-medium">ELI5</span>
      </motion.div>
      
      <Switch
        checked={expertMode}
        onCheckedChange={onToggle}
        className={`transition-all duration-200 ${
          expertMode 
            ? 'data-[state=checked]:bg-slate-600' 
            : 'data-[state=unchecked]:bg-teal-500'
        }`}
      />
      
      <motion.div
        className={`flex items-center space-x-2 transition-all duration-200 ${
          expertMode ? 'text-slate-600 dark:text-slate-400' : 'text-muted-foreground'
        }`}
        animate={{ scale: expertMode ? 1.05 : 1 }}
      >
        <GraduationCap className="w-4 h-4" />
        <span className="text-sm font-medium">Expert</span>
      </motion.div>
      
      <div className="ml-4 text-xs text-muted-foreground">
        {expertMode ? 'Technical details' : 'Simple concepts'}
      </div>
    </div>
  )
}
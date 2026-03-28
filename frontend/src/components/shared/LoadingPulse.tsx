import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LoadingPulseProps {
  text?: string
  className?: string
}

export function LoadingPulse({ text = 'Loading...', className }: LoadingPulseProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center h-full w-full gap-4 text-zinc-500', className)}>
      <div className="relative w-12 h-12 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full border border-purple-500/30"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="w-4 h-4 rounded-full bg-purple-500 shadow-[0_0_15px_rgba(124,58,237,0.5)]"
          animate={{ scale: [1, 0.8, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <p className="font-mono text-xs tracking-widest uppercase">{text}</p>
    </div>
  )
}

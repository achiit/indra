import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { IndraLogo } from '@/components/branding/IndraLogo'

interface LoadingPulseProps {
  text?: string
  className?: string
}

export function LoadingPulse({ text = 'Loading...', className }: LoadingPulseProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center h-full w-full gap-5 text-zinc-500', className)}>
      <motion.div
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <IndraLogo height={52} className="opacity-90" />
      </motion.div>
      <p className="font-mono text-xs tracking-widest uppercase">{text}</p>
    </div>
  )
}

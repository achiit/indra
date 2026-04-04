import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { IndraLogo } from '@/components/branding/IndraLogo'

interface LoadingPulseProps {
  text?: string
  className?: string
}

export function LoadingPulse({ text = 'Loading...', className }: LoadingPulseProps) {
  return (
    <div className={cn('d-flex flex-column align-items-center justify-content-center h-100 w-100 gap-4 text-muted', className)}>
      <motion.div
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <IndraLogo height={52} className="opacity-75" />
      </motion.div>
      <p className="font-monospace text-uppercase tracking-widest" style={{ fontSize: '0.75rem' }}>{text}</p>
    </div>
  )
}

import { IndraLogo } from '@/components/branding/IndraLogo'

// Placeholder component so the router doesn't fail
export function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="p-6 h-full flex flex-col items-center justify-center text-center opacity-60">
      <IndraLogo height={44} className="mb-6 opacity-80" />
      <div className="text-2xl font-bold mb-2 tracking-tight text-white">{title}</div>
      <p className="text-zinc-400">This module is part of the Enterprise edition.</p>
    </div>
  )
}

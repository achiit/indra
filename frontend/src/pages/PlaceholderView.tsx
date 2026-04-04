import { IndraLogo } from '@/components/branding/IndraLogo'

// Placeholder component so the router doesn't fail
export function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="p-4 p-md-5 h-100 d-flex flex-column align-items-center justify-content-center text-center opacity-75">
      <IndraLogo height={44} className="mb-4 opacity-75" />
      <div className="h4 fw-bold mb-2 text-white tracking-tight">{title}</div>
      <p className="body-2 text-muted">This module is part of the Enterprise edition.</p>
    </div>
  )
}

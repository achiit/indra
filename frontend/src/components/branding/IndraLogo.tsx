/**
 * Central INDRA mark — source: /public/logo.png
 */
const LOGO_SRC = '/logo.png'

type IndraLogoProps = {
  className?: string
  /** CSS height; width scales with aspect ratio */
  height?: number
  alt?: string
}

export function IndraLogo({ className = '', height = 40, alt = 'INDRA' }: IndraLogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt={alt}
      className={`object-contain object-left select-none ${className}`}
      style={{ height, width: 'auto', maxWidth: 'min(100%, 320px)' }}
      draggable={false}
    />
  )
}

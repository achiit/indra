import { useEffect, useRef, useState, useMemo } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { type GraphData, type GraphNode, type GraphLink } from '@/types/indra'
import { DOMAIN_COLORS, getConfidenceColor } from '@/lib/utils'
import { applyFlag } from '@/lib/flags'

export interface GraphFocusMode {
  active: boolean
  /** Direct query matches — pulsing highlight */
  pulseIds: Set<string>
  /** Matches + 1-hop neighbours — full opacity */
  expandedIds: Set<string>
}

interface KnowledgeGraphProps {
  data: GraphData
  onNodeClick?: (node: GraphNode) => void
  highlightedNodeId?: string | null
  focusMode?: GraphFocusMode | null
}

export function KnowledgeGraph({ data, onNodeClick, highlightedNodeId, focusMode }: KnowledgeGraphProps) {
  const fgRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [pulseTick, setPulseTick] = useState(0)

  const pulseActive = !!(focusMode?.active && focusMode.pulseIds.size > 0)

  useEffect(() => {
    if (!pulseActive) return
    let id: number
    const loop = () => {
      setPulseTick((t) => (t + 1) % 10000)
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [pulseActive])

  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current
      setDimensions({ width: clientWidth, height: clientHeight })
    }
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight })
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const { runData, linkColorFn } = useMemo(() => {
    const degreeMap: Record<string, number> = {}
    data.edges.forEach((e: any) => {
      const sourceObj = e.source ?? e.from
      const targetObj = e.target ?? e.to
      const src = sourceObj?.id || sourceObj
      const tgt = targetObj?.id || targetObj
      if (src) degreeMap[src] = (degreeMap[src] || 0) + 1
      if (tgt) degreeMap[tgt] = (degreeMap[tgt] || 0) + 1
    })

    const graphNodes = data.nodes.map((n: any) => {
      const lblStr = n.label ? String(n.label) : String(n.id || '')
      return {
        ...n,
        label: applyFlag(lblStr.length < 28 ? lblStr : `${lblStr.substring(0, 28)}…`),
        val: Math.min(25, 4 + (degreeMap[n.id] || 0) * 1.5),
        color: n.id === highlightedNodeId ? '#00ffff' : (
          n.type === 'Country' ? '#22c55e' :
            n.type === 'Organization' ? '#a855f7' :
              n.type === 'Person' ? '#3b82f6' :
                n.type === 'Event' ? '#f97316' :
                  n.type === 'Concept' ? '#f3f4f6' :
                    '#6B7280'
        ),
      }
    }) as GraphNode[]

    const graphLinks = data.edges.map((e: any) => ({
      ...e,
      source: e.source ?? e.from,
      target: e.target ?? e.to,
      color: e.stale ? '#3f3f46' : getConfidenceColor(e.confidence || 0.6),
    })) as GraphLink[]

    const linkColorFn = (l: GraphLink) => {
      const base = (l as GraphLink).color || '#3f3f46'
      if (!focusMode?.active) return base
      const s = ((l as any).source?.id ?? (l as any).source) as string
      const t = ((l as any).target?.id ?? (l as any).target) as string
      const both = focusMode.expandedIds.has(s) && focusMode.expandedIds.has(t)
      if (both) return base
      return 'rgba(39,39,42,0.12)'
    }

    return { runData: { nodes: graphNodes, links: graphLinks }, linkColorFn }
  }, [data, highlightedNodeId, focusMode])

  useEffect(() => {
    if (fgRef.current && runData.nodes.length > 0) {
      setTimeout(() => fgRef.current?.zoomToFit(200, 50), 100)
    }
  }, [runData])

  const nodeAlpha = (id: string) => {
    if (!focusMode?.active) return 1
    return focusMode.expandedIds.has(id) ? 1 : 0.15
  }

  const nodePulse = (id: string) =>
    !!(focusMode?.active && focusMode.pulseIds.has(id))

  return (
    <div ref={containerRef} className="w-100 h-100 position-relative rounded-3 overflow-hidden border border-secondary" style={{ backgroundColor: '#0A0A0F' }}>
      {dimensions.width > 0 && (
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={runData}
          nodeLabel="label"
          nodeRelSize={4}
          linkColor={linkColorFn}
          linkWidth={(l) => {
            if (!focusMode?.active) return ((l as GraphLink).confidence || 0.5) * 2
            const s = ((l as any).source?.id ?? (l as any).source) as string
            const t = ((l as any).target?.id ?? (l as any).target) as string
            const both = focusMode.expandedIds.has(s) && focusMode.expandedIds.has(t)
            return both ? ((l as GraphLink).confidence || 0.5) * 2.4 : 0.35
          }}
          linkLabel={(l) =>
            `${(l as any).source.id || (l as any).source} ➔ ${(l as any).label || (l as any).type} ➔ ${(l as any).target.id || (l as any).target}\nConfidence: ${(((l as any).confidence || 0) * 100).toFixed(0)}%`
          }
          linkDirectionalParticles={(l) => {
            if (!focusMode?.active) return 2
            const s = ((l as any).source?.id ?? (l as any).source) as string
            const t = ((l as any).target?.id ?? (l as any).target) as string
            return focusMode.expandedIds.has(s) && focusMode.expandedIds.has(t) ? 2 : 0
          }}
          linkDirectionalParticleSpeed={(l) => ((l as GraphLink).confidence || 0.5) * 0.01}
          onNodeClick={(node) => onNodeClick?.(node as GraphNode)}
          enableNodeDrag
          enableZoomInteraction
          enablePanInteraction
          backgroundColor="#0A0A0F"
          nodeCanvasObject={(node, ctx, globalScale) => {
            const id = (node as GraphNode).id
            const size = node.val || 5
            const alpha = nodeAlpha(id)
            const pulse = nodePulse(id)
            const hl = id === highlightedNodeId
            const pulseR = pulse ? 1 + 0.22 * Math.sin(pulseTick * 0.12) : 1

            ctx.save()
            ctx.globalAlpha = alpha

            if (pulse) {
              ctx.beginPath()
              ctx.arc(node.x!, node.y!, size * 2.4 * pulseR, 0, 2 * Math.PI, false)
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
              ctx.lineWidth = 1.5 / globalScale
              ctx.stroke()
            }

            ctx.beginPath()
            ctx.arc(node.x!, node.y!, size * (hl ? 1.15 : 1), 0, 2 * Math.PI, false)
            ctx.fillStyle = hl ? '#00ffff' : (node.color || '#6B7280')
            ctx.fill()

            const label = (node as GraphNode).label
            const fontSize = Math.max(5, 10 / globalScale)
            ctx.font = `${fontSize}px Inter, sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = hl || pulse ? '#e4e4e7' : 'rgba(255,255,255,0.88)'
            ctx.fillText(label, node.x!, node.y! + size + 2 + fontSize / 2)

            ctx.restore()
          }}
        />
      )}

      <div className="position-absolute top-0 end-0 m-3 bg-dark bg-opacity-75 border border-secondary rounded-3 p-3 shadow-sm" style={{ backdropFilter: 'blur(4px)', zIndex: 10 }}>
        <h4 className="text-muted text-uppercase fw-semibold mb-2 tracking-wider" style={{ fontSize: '0.625rem' }}>Confidence Legend</h4>
        <div className="d-flex flex-column gap-2" style={{ fontSize: '0.75rem' }}>
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle bg-success flex-shrink-0" style={{ width: '8px', height: '8px' }} /> High (&gt;0.7)
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle bg-warning flex-shrink-0" style={{ width: '8px', height: '8px' }} /> Med (0.4–0.7)
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle bg-orange flex-shrink-0" style={{ width: '8px', height: '8px', backgroundColor: '#fb923c' }} /> Low (0.15–0.4)
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle bg-secondary flex-shrink-0" style={{ width: '8px', height: '8px' }} /> Stale (&lt;0.15)
          </div>
        </div>
      </div>

      <div className="position-absolute top-0 start-0 m-3 bg-dark bg-opacity-75 border border-secondary rounded-3 p-3 shadow-sm" style={{ backdropFilter: 'blur(4px)', zIndex: 10 }}>
        <h4 className="text-muted text-uppercase fw-semibold mb-2 tracking-wider" style={{ fontSize: '0.625rem' }}>Entity Types</h4>
        <div className="d-flex flex-column gap-2" style={{ fontSize: '0.75rem' }}>
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle flex-shrink-0" style={{ width: '8px', height: '8px', backgroundColor: '#22c55e' }} /> Country
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle flex-shrink-0" style={{ width: '8px', height: '8px', backgroundColor: '#a855f7' }} /> Organization
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle flex-shrink-0" style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6' }} /> Person
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle flex-shrink-0" style={{ width: '8px', height: '8px', backgroundColor: '#f97316' }} /> Event
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle flex-shrink-0" style={{ width: '8px', height: '8px', backgroundColor: '#f3f4f6' }} /> Concept
          </div>
        </div>
      </div>
    </div>
  )
}

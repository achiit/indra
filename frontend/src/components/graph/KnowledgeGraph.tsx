import { useEffect, useRef, useState, useMemo } from 'react'
import ForceGraph3D from 'react-force-graph-3d'
import * as THREE from 'three'
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

    const graphLinks = data.edges.map((e: any) => {
      const conf = e.confidence || 0.5;
      let c = '#3A4A5A'; // low - dim
      if (conf > 0.7) c = '#00C896'; // high - teal
      else if (conf > 0.4) c = '#EF9F27'; // med - amber

      return ({
        ...e,
        source: e.source ?? e.from,
        target: e.target ?? e.to,
        color: e.stale ? '#3f3f46' : c,
      })
    }) as GraphLink[]

    const linkColorFn = (l: GraphLink) => {
      const base = (l as GraphLink).color || '#00C896'
      if (!focusMode?.active) return base
      const s = ((l as any).source?.id ?? (l as any).source) as string
      const t = ((l as any).target?.id ?? (l as any).target) as string
      const both = focusMode.expandedIds.has(s) && focusMode.expandedIds.has(t)
      if (both) return base
      return 'rgba(58, 74, 90, 0.15)'
    }

    return { runData: { nodes: graphNodes, links: graphLinks }, linkColorFn }
  }, [data, highlightedNodeId, focusMode])

  useEffect(() => {
    if (fgRef.current && runData.nodes.length > 0) {
      fgRef.current.d3Force('charge').strength(-400)
      fgRef.current.d3Force('link').distance(80)
      setTimeout(() => fgRef.current?.zoomToFit(400, 50), 100)
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
        <ForceGraph3D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={runData}
          backgroundColor="#0A0A0F"
          linkColor={linkColorFn}
          linkWidth={(l) => {
            if (!focusMode?.active) return 1.5
            const s = ((l as any).source?.id ?? (l as any).source) as string
            const t = ((l as any).target?.id ?? (l as any).target) as string
            return (focusMode.expandedIds.has(s) && focusMode.expandedIds.has(t)) ? 3 : 0.5
          }}
          linkOpacity={0.9}
          linkLabel={(l) =>
            `${(l as any).source.id || (l as any).source} \u2794 ${(l as any).label || (l as any).type} \u2794 ${(l as any).target.id || (l as any).target}\nConfidence: ${(((l as any).confidence || 0) * 100).toFixed(0)}%`
          }
          linkDirectionalParticles={(l) => {
            if (!focusMode?.active) return 2
            const s = ((l as any).source?.id ?? (l as any).source) as string
            const t = ((l as any).target?.id ?? (l as any).target) as string
            return focusMode.expandedIds.has(s) && focusMode.expandedIds.has(t) ? 6 : 0
          }}
          linkDirectionalParticleSpeed={0.004}
          linkDirectionalParticleWidth={2}
          onNodeClick={(node) => {
            const distance = 80;
            const distRatio = 1 + distance / Math.hypot((node as any).x || 0, (node as any).y || 0, (node as any).z || 0);
            fgRef.current?.cameraPosition(
              { x: (node as any).x * distRatio, y: (node as any).y * distRatio, z: (node as any).z * distRatio },
              node,
              1000
            );
            onNodeClick?.(node as GraphNode)
          }}
          enableNodeDrag
          enableNavigationControls
          nodeThreeObject={(node) => {
            const id = (node as GraphNode).id
            const size = (node as any).val || 4
            const alpha = nodeAlpha(id)
            const pulse = nodePulse(id)
            const hl = id === highlightedNodeId
            const isHighlighted = pulse || hl || focusMode?.expandedIds.has(id)
            const pulseR = pulse ? 1 + 0.15 * Math.sin(pulseTick * 0.12) : 1
            const color = hl ? '#00ffff' : ((node as any).color || '#6B7280')

            const sphere = new THREE.Mesh(
              new THREE.SphereGeometry(size * (pulse ? pulseR : 1), 16, 16),
              new THREE.MeshLambertMaterial({
                color: new THREE.Color(color),
                transparent: true,
                opacity: alpha,
              })
            );

            if (pulse) {
              const ring = new THREE.Mesh(
                new THREE.RingGeometry(size + 2, size + 4, 32),
                new THREE.MeshBasicMaterial({
                  color: new THREE.Color('#ffffff'),
                  transparent: true,
                  opacity: 0.6,
                  side: THREE.DoubleSide,
                })
              );
              sphere.add(ring);
            }

            if (isHighlighted || !focusMode?.active) {
              const canvas = document.createElement("canvas");
              canvas.width = 256;
              canvas.height = 64;
              const ctx = canvas.getContext("2d")!;
              ctx.fillStyle = "rgba(10, 22, 40, 0.85)";
              ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 8);
              ctx.fill();
              ctx.fillStyle = color;
              ctx.font = "bold 22px Arial";
              ctx.textAlign = "center";
              ctx.fillText((node as GraphNode).label || id, 128, 40);

              const texture = new THREE.CanvasTexture(canvas);
              const label = new THREE.Sprite(
                new THREE.SpriteMaterial({ map: texture, transparent: true })
              );
              label.scale.set(40, 10, 1);
              label.position.set(0, size + 8, 0);
              sphere.add(label);
            }

            return sphere;
          }}
        />
      )}

      <div className="position-absolute top-0 end-0 m-3 bg-dark bg-opacity-75 border border-secondary rounded-3 p-3 shadow-sm" style={{ backdropFilter: 'blur(4px)', zIndex: 10 }}>
        <h4 className="text-muted text-uppercase fw-semibold mb-2 tracking-wider" style={{ fontSize: '0.625rem' }}>Confidence Legend</h4>
        <div className="d-flex flex-column gap-2" style={{ fontSize: '0.75rem' }}>
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle flex-shrink-0" style={{ width: '8px', height: '8px', backgroundColor: '#00C896' }} /> High (&gt;0.7)
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle flex-shrink-0" style={{ width: '8px', height: '8px', backgroundColor: '#EF9F27' }} /> Med (0.4–0.7)
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle flex-shrink-0" style={{ width: '8px', height: '8px', backgroundColor: '#3A4A5A' }} /> Low (0.15–0.4)
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

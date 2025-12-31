"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"
import type { Node, Link } from "@/app/page"

interface NetworkGraphProps {
  nodes: Node[]
  links: Link[]
}

export function NetworkGraph({ nodes, links }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // clear previous content
    d3.select(svgRef.current).selectAll("*").remove()

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])

    // create a group for zoom
    const g = svg.append("g")

    // clone nodes and links for D3 simulation
    const simulationNodes = nodes.map((d) => ({ ...d }))
    const simulationLinks = links.map((d) => ({ ...d }))

    // color scale for years
    const years = [...new Set(nodes.map((n) => n.year).filter(Boolean))] as number[]
    const colorScale = d3
      .scaleOrdinal<number, string>()
      .domain(years)
      .range(["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"])

    // create force simulation
    const simulation = d3
      .forceSimulation(simulationNodes as d3.SimulationNodeDatum[])
      .force(
        "link",
        d3
          .forceLink(simulationLinks)
          .id((d: any) => d.id)
          .distance(80),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(20))

    // create links
    const link = g
      .append("g")
      .selectAll("line")
      .data(simulationLinks)
      .join("line")
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-opacity", (d: any) => {
        const similarity = d.similarity ?? 1
        return 0.2 + similarity * 0.6
      })
      .attr("stroke-width", (d: any) => {
        const similarity = d.similarity ?? 1
        return 1 + similarity * 3
      })

    // create nodes
    const node = g
      .append("g")
      .selectAll("g")
      .data(simulationNodes)
      .join("g")
      .call(d3.drag<SVGGElement, any>().on("start", dragstarted).on("drag", dragged).on("end", dragended) as any)

    // add circles to nodes
    node
      .append("circle")
      .attr("r", (d: any) => (d.isOutlier ? 8 : 6))
      .attr("fill", (d: any) => {
        if (d.isOutlier) return "hsl(var(--destructive))"
        return d.year ? colorScale(d.year) : "hsl(var(--chart-1))"
      })
      .attr("stroke", "hsl(var(--background))")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")

    // add labels
    node
      .append("text")
      .text((d: any) => d.question || d.label || d.id)
      .attr("x", 10)
      .attr("y", 4)
      .attr("font-size", "10px")
      .attr("fill", "hsl(var(--foreground))")
      .style("pointer-events", "none")
      .style("user-select", "none")

    // add tooltips
    node.append("title").text((d: any) => {
      const parts = [`ID: ${d.id}`]
      if (d.question) parts.push(`Question: ${d.question}`)
      if (d.label) parts.push(`Label: ${d.label}`)
      if (d.year) parts.push(`Year: ${d.year}`)
      if (d.isOutlier) parts.push("Outlier")
      return parts.join("\n")
    })

    // zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
      })

    svg.call(zoom as any)

    // update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y)

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`)
    })

    // drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }

    function dragged(event: any) {
      event.subject.fx = event.x
      event.subject.fy = event.y
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
    }

    // cleanup
    return () => {
      simulation.stop()
    }
  }, [nodes, links])

  return (
    <div ref={containerRef} className="relative h-[600px] w-full bg-muted/20">
      <svg ref={svgRef} className="h-full w-full" />
      <div className="absolute bottom-4 right-4 rounded-lg bg-background/80 p-3 text-xs backdrop-blur-sm">
        <p className="font-medium text-foreground">Controls</p>
        <p className="text-muted-foreground">• Drag nodes to reposition</p>
        <p className="text-muted-foreground">• Scroll to zoom</p>
        <p className="text-muted-foreground">• Pan with click + drag</p>
      </div>
    </div>
  )
}

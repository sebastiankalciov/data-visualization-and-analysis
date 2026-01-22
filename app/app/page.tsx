"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Upload, FileJson, AlertCircle, Activity } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { NetworkGraph } from "@/components/network-graph"
import { StatsCard } from "@/components/stats-card"
import type { SimulationNodeDatum, SimulationLinkDatum } from "d3"

export interface Node extends SimulationNodeDatum {
    id: string
    label?: string
    question?: string
    year?: number
    isOutlier?: boolean
    [key: string]: any
}


export interface Link extends SimulationLinkDatum<Node> {
    similarity?: number
    [key: string]: any
}

export default function DataVisualizationDashboard() {
    const [nodes, setNodes] = useState<Node[]>([])
    const [links, setLinks] = useState<Link[]>([])
    const [nodesFile, setNodesFile] = useState<File | null>(null)
    const [linksFile, setLinksFile] = useState<File | null>(null)
    const [error, setError] = useState<string>("")
    const [similarityThreshold, setSimilarityThreshold] = useState<number>(0)
    const [selectedYears, setSelectedYears] = useState<number[]>([])
    const [showOutliers, setShowOutliers] = useState<boolean>(true)
    const [availableYears, setAvailableYears] = useState<number[]>([])

    const handleFileUpload = useCallback((file: File, type: "nodes" | "links") => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string)

                if (type === "nodes") {
                    if (!Array.isArray(json)) {
                        throw new Error("nodes file must contain an array")
                    }
                    setNodes(json)
                    setNodesFile(file)

                    // extract available years from nodes
                    const years = [...new Set(json.map((node: Node) => node.year).filter(Boolean))] as number[]
                    setAvailableYears(years.sort())
                    setSelectedYears(years)

                    setError("")
                } else {
                    if (!Array.isArray(json)) {
                        throw new Error("links file must contain an array")
                    }
                    setLinks(json)
                    setLinksFile(file)
                    setError("")
                }
            } catch (err) {
                setError(`error parsing ${type} file: ${err instanceof Error ? err.message : "invalid json"}`)
            }
        }
        reader.onerror = () => {
            setError(`error reading ${type} file`)
        }
        reader.readAsText(file)
    }, [])

    const handleNodesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFileUpload(file, "nodes")
        }
    }

    const handleLinksFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFileUpload(file, "links")
        }
    }

    const toggleYear = (year: number) => {
        setSelectedYears((prev) => (prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]))
    }

    const filteredData = {
        nodes: nodes.filter((node) => {
            const yearMatch = !node.year || selectedYears.length === 0 || selectedYears.includes(node.year)
            const outlierMatch = showOutliers || !node.isOutlier
            return yearMatch && outlierMatch
        }),
        links: links.filter((link) => {
            const similarity = link.similarity ?? 1
            return similarity >= similarityThreshold
        }),
    }

    const stats = {
        totalNodes: nodes.length,
        filteredNodes: filteredData.nodes.length,
        totalLinks: links.length,
        filteredLinks: filteredData.links.length,
        outliers: nodes.filter((n) => n.isOutlier).length,
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-6">
            <div className="mx-auto max-w-[1800px] space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-balance">Analysis Dashboard</h1>
                    <p className="text-muted-foreground text-balance">
                        Upload your data files and explore visual similarity networks with interactive controls
                    </p>
                </div>

                {/* file upload section */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileJson className="h-5 w-5 text-chart-1" />
                                Nodes Data
                            </CardTitle>
                            <CardDescription>Upload nodes.json file</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="nodes-upload" className="cursor-pointer">
                                        <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:bg-muted">
                                            <div className="text-center">
                                                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    {nodesFile ? nodesFile.name : "Click to upload nodes.json"}
                                                </p>
                                            </div>
                                        </div>
                                    </Label>
                                    <input
                                        id="nodes-upload"
                                        type="file"
                                        accept=".json"
                                        onChange={handleNodesFileChange}
                                        className="hidden"
                                    />
                                </div>
                                {nodesFile && <p className="text-sm text-muted-foreground">✓ Loaded {nodes.length} nodes</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileJson className="h-5 w-5 text-chart-2" />
                                Links Data
                            </CardTitle>
                            <CardDescription>Upload links.json file</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="links-upload" className="cursor-pointer">
                                        <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:bg-muted">
                                            <div className="text-center">
                                                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    {linksFile ? linksFile.name : "Click to upload links.json"}
                                                </p>
                                            </div>
                                        </div>
                                    </Label>
                                    <input
                                        id="links-upload"
                                        type="file"
                                        accept=".json"
                                        onChange={handleLinksFileChange}
                                        className="hidden"
                                    />
                                </div>
                                {linksFile && <p className="text-sm text-muted-foreground">✓ Loaded {links.length} links</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {nodes.length > 0 && links.length > 0 && (
                    <>
                        {/* stats vards */}
                        <div className="grid gap-4 md:grid-cols-5">
                            <StatsCard title="Total Nodes" value={stats.totalNodes} icon={Activity} color="chart-1" />
                            <StatsCard title="Filtered Nodes" value={stats.filteredNodes} icon={Activity} color="chart-2" />
                            <StatsCard title="Total Links" value={stats.totalLinks} icon={Activity} color="chart-3" />
                            <StatsCard title="Active Links" value={stats.filteredLinks} icon={Activity} color="chart-4" />
                            <StatsCard title="Outliers" value={stats.outliers} icon={Activity} color="chart-5" />
                        </div>

                        {/* main content */}
                        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                            {/* controls panel */}
                            <div className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Similarity Threshold</CardTitle>
                                        <CardDescription>Filter links by similarity score</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label>Threshold</Label>
                                                <span className="text-sm font-medium text-muted-foreground">
                          {similarityThreshold.toFixed(2)}
                        </span>
                                            </div>
                                            <Slider
                                                value={[similarityThreshold]}
                                                onValueChange={(value) => setSimilarityThreshold(value[0])}
                                                min={0}
                                                max={1}
                                                step={0.01}
                                                className="w-full"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Display Options</CardTitle>
                                        <CardDescription>Toggle visualization elements</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="outliers-toggle" className="cursor-pointer">
                                                Show Outliers
                                            </Label>
                                            <Switch id="outliers-toggle" checked={showOutliers} onCheckedChange={setShowOutliers} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* network visualization */}
                            <Card className="overflow-hidden">
                                <CardHeader>
                                    <CardTitle>Network Graph</CardTitle>
                                    <CardDescription>
                                        Interactive visualization of {filteredData.nodes.length} nodes and {filteredData.links.length}{" "}
                                        connections
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <NetworkGraph nodes={filteredData.nodes} links={filteredData.links} />
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

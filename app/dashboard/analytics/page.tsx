"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, BarChart3, LineChart, PieChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface GestureStats {
  period: string
  totalGesturesDetected: number
  usageCounts: Record<string, number>
  recognitionRates: Record<string, number>
  averageRecognitionRate: number
  timeSeriesData: Array<{ date: string; counts: Record<string, number> }>
}

export default function GestureAnalytics() {
  const [stats, setStats] = useState<GestureStats | null>(null)
  const [period, setPeriod] = useState("week")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/gestures/stats?userId=demo-user&period=${period}`)
        const data = await response.json()

        if (data.success) {
          setStats(data.stats)
        }
      } catch (error) {
        console.error("Error loading gesture stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [period])

  // Helper to get readable gesture names
  const getGestureName = (key: string) => {
    const nameMap: Record<string, string> = {
      nextSlide: "Next Slide",
      previousSlide: "Previous Slide",
      drawMode: "Draw Mode",
      pointer: "Pointer",
      erase: "Erase",
      highlight: "Highlight",
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      firstSlide: "First Slide",
      lastSlide: "Last Slide",
    }

    return nameMap[key] || key
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 py-3 border-b">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Gesture Analytics</h1>
          </div>
          <div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Last 24 Hours</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-8">
        {isLoading ? (
          <div className="py-12 text-center">Loading analytics data...</div>
        ) : stats ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Gestures Detected</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalGesturesDetected}</div>
                  <p className="text-xs text-muted-foreground">During the selected period</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Recognition Rate</CardTitle>
                  <LineChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(stats.averageRecognitionRate * 100).toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Higher is better</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Most Used Gesture</CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.usageCounts && Object.keys(stats.usageCounts).length > 0
                      ? getGestureName(Object.entries(stats.usageCounts).sort((a, b) => b[1] - a[1])[0][0])
                      : "None"}
                  </div>
                  <p className="text-xs text-muted-foreground">Based on usage frequency</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="usage">
              <TabsList>
                <TabsTrigger value="usage">Usage</TabsTrigger>
                <TabsTrigger value="recognition">Recognition Rates</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="usage" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Gesture Usage Distribution</CardTitle>
                    <CardDescription>Breakdown of gesture usage during the selected period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {Object.entries(stats.usageCounts || {})
                        .sort((a, b) => b[1] - a[1])
                        .map(([gesture, count]) => (
                          <div key={gesture} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{getGestureName(gesture)}</div>
                              <div>{count} uses</div>
                            </div>
                            <div className="h-2 w-full bg-secondary overflow-hidden rounded-full">
                              <div
                                className="h-full bg-primary"
                                style={{
                                  width: `${(count / stats.totalGesturesDetected) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recognition" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Gesture Recognition Rates</CardTitle>
                    <CardDescription>How accurately each gesture is being recognized</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {Object.entries(stats.recognitionRates || {})
                        .sort((a, b) => b[1] - a[1])
                        .map(([gesture, rate]) => (
                          <div key={gesture} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{getGestureName(gesture)}</div>
                              <div>{(rate * 100).toFixed(1)}%</div>
                            </div>
                            <div className="h-2 w-full bg-secondary overflow-hidden rounded-full">
                              <div
                                className={`h-full ${rate > 0.9 ? "bg-green-500" : rate > 0.8 ? "bg-yellow-500" : "bg-red-500"}`}
                                style={{ width: `${rate * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Gesture Usage Timeline</CardTitle>
                    <CardDescription>How your gesture usage has changed over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-end justify-between gap-2">
                      {stats.timeSeriesData.map((day) => {
                        const totalForDay = Object.values(day.counts).reduce((sum, count) => sum + count, 0)
                        return (
                          <div key={day.date} className="flex-1 flex flex-col items-center">
                            <div
                              className="w-full bg-primary rounded-t"
                              style={{
                                height: `${Math.max(20, (totalForDay / 20) * 250)}px`,
                              }}
                            />
                            <div className="text-xs mt-2 text-muted-foreground">
                              {new Date(day.date).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="py-12 text-center">No analytics data available.</div>
        )}
      </main>
    </div>
  )
}


"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"

interface Gesture {
  id: number
  name: string
  description: string
  defaultAction: string
  thumbnailUrl: string
  difficulty: string
  enabled?: boolean
}

interface GestureConfig {
  sensitivity: number
  gestureHoldTime: number
  gestureMappings: Array<{ gestureId: number; action: string }>
  enabledGestures: number[]
}

export default function GestureSettings() {
  const [gestures, setGestures] = useState<Gesture[]>([])
  const [config, setConfig] = useState<GestureConfig>({
    sensitivity: 0.7,
    gestureHoldTime: 500,
    gestureMappings: [],
    enabledGestures: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        // Load gesture library
        const libraryRes = await fetch("/api/gestures/library")
        const libraryData = await libraryRes.json()

        if (libraryData.success) {
          // Load user config
          const configRes = await fetch("/api/gestures/config?userId=demo-user")
          const configData = await configRes.json()

          if (configData.success) {
            setConfig(configData.config)

            // Mark enabled gestures
            const gesturesWithEnabled = libraryData.gestures.map((gesture: Gesture) => ({
              ...gesture,
              enabled: configData.config.enabledGestures.includes(gesture.id),
            }))

            setGestures(gesturesWithEnabled)
          }
        }
      } catch (error) {
        console.error("Error loading gesture data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSaveConfig = async () => {
    setIsSaving(true)

    try {
      const response = await fetch("/api/gestures/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "demo-user",
          config: {
            ...config,
            enabledGestures: gestures.filter((g) => g.enabled).map((g) => g.id),
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Settings saved",
          description: "Your gesture settings have been updated successfully.",
        })
      } else {
        throw new Error(data.message || "Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving gesture config:", error)
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your gesture settings.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleGesture = (id: number, enabled: boolean) => {
    setGestures(gestures.map((gesture) => (gesture.id === id ? { ...gesture, enabled } : gesture)))
  }

  const handleSensitivityChange = (value: number[]) => {
    setConfig({
      ...config,
      sensitivity: value[0],
    })
  }

  const handleHoldTimeChange = (value: number[]) => {
    setConfig({
      ...config,
      gestureHoldTime: value[0],
    })
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
            <h1 className="text-2xl font-bold">Gesture Settings</h1>
          </div>
          <Button onClick={handleSaveConfig} disabled={isSaving}>
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <Tabs defaultValue="gestures" className="space-y-6">
          <TabsList>
            <TabsTrigger value="gestures">Gestures</TabsTrigger>
            <TabsTrigger value="sensitivity">Sensitivity</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
          </TabsList>

          <TabsContent value="gestures" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gesture Library</CardTitle>
                <CardDescription>
                  Enable or disable gestures to customize your presentation control experience.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-8 text-center">Loading gestures...</div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {gestures.map((gesture) => (
                        <div key={gesture.id} className="flex items-start space-x-4 border p-4 rounded-lg">
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                            {gesture.thumbnailUrl ? (
                              <img
                                src={gesture.thumbnailUrl || "/placeholder.svg"}
                                alt={gesture.name}
                                className="w-10 h-10 object-contain"
                              />
                            ) : (
                              <span className="text-xl font-bold">{gesture.name.charAt(0)}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">{gesture.name}</h3>
                              <Switch
                                checked={gesture.enabled}
                                onCheckedChange={(checked) => handleToggleGesture(gesture.id, checked)}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{gesture.description}</p>
                            <div className="mt-2 text-xs bg-muted px-2 py-1 rounded inline-block">
                              {gesture.difficulty}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sensitivity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sensitivity Settings</CardTitle>
                <CardDescription>
                  Adjust how sensitive the gesture recognition system is to your movements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label htmlFor="sensitivity">Gesture Sensitivity</Label>
                      <span className="text-sm">{config.sensitivity.toFixed(1)}</span>
                    </div>
                    <Slider
                      id="sensitivity"
                      min={0.1}
                      max={1.0}
                      step={0.1}
                      value={[config.sensitivity]}
                      onValueChange={handleSensitivityChange}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Higher sensitivity makes gesture detection more responsive but may increase false positives.
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label htmlFor="hold-time">Gesture Hold Time (ms)</Label>
                      <span className="text-sm">{config.gestureHoldTime}</span>
                    </div>
                    <Slider
                      id="hold-time"
                      min={100}
                      max={2000}
                      step={100}
                      value={[config.gestureHoldTime]}
                      onValueChange={handleHoldTimeChange}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      How long you need to hold a gesture before it's recognized. Lower values make gestures trigger
                      faster.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gesture Training</CardTitle>
                <CardDescription>Train the system to better recognize your specific hand gestures.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-8 text-center space-y-4">
                  <p>
                    Training helps the system recognize your gestures more accurately. Each training session takes about
                    2 minutes per gesture.
                  </p>
                  <Button>Start Training Session</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}


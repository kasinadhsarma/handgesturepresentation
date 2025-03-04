"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileUp, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

export default function PresentationUpload() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await handleFileUpload(files[0])
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await handleFileUpload(files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    // Check file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ]

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or PowerPoint file",
        variant: "destructive",
      })
      return
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/presentations/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Upload successful",
          description: "Your presentation has been uploaded",
        })
        router.push(`/presentation/${data.presentationId}`)
      } else {
        throw new Error(data.message || "Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your presentation",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Upload Presentation</CardTitle>
          <CardDescription>
            Upload your PDF or PowerPoint presentation to get started with gesture controls.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? "border-primary bg-primary/5" : "border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FileUp className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-2 text-xl font-semibold">Upload Presentation</h2>
            <p className="mt-1 text-sm text-gray-500">Drag and drop your presentation file here, or click to browse</p>

            <div className="mt-4">
              <Label htmlFor="file-upload" className="sr-only">
                Choose file
              </Label>
              <Input
                id="file-upload"
                name="file-upload"
                type="file"
                accept=".pdf,.ppt,.pptx"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <Button asChild disabled={isUploading}>
                <label htmlFor="file-upload">
                  {isUploading ? (
                    "Uploading..."
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Browse files
                    </>
                  )}
                </label>
              </Button>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              Supported formats: PDF, PowerPoint (PPT, PPTX)
              <br />
              Maximum file size: 10MB
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


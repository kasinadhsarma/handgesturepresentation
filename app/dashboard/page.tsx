"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FileUp, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Dashboard() {
  const router = useRouter();
  const [presentations, setPresentations] = useState([
    { id: 1, title: "Project Proposal", date: "2025-01-15", slides: 24 },
    { id: 2, title: "Quarterly Results", date: "2025-01-10", slides: 18 },
    { id: 3, title: "Team Meeting", date: "2025-01-05", slides: 12 },
  ])
  const [isDragging, setIsDragging] = useState(false)

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          credentials: 'include'
        });
        if (!response.ok) {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.name.endsWith(".ppt") || file.name.endsWith(".pptx")) {
        const formData = new FormData();
        formData.append('file', file);

        try {
          const response = await fetch('/api/presentations/upload', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            setPresentations(prev => [{
              id: result.id,
              title: file.name.replace(/\.(ppt|pptx)$/, ""),
              date: new Date().toISOString().split("T")[0],
              slides: result.slideCount || Math.floor(Math.random() * 30) + 5,
            }, ...prev]);
          }
        } catch (error) {
          console.error('Upload failed:', error);
        }
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 py-3 border-b">
        <div className="container flex items-center justify-between">
          <h1 className="text-2xl font-bold">GestureSlide</h1>
          <Button 
            variant="ghost"
            onClick={handleLogout}
          >
            Log out
          </Button>
        </div>
      </header>
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-6">Your Presentations</h1>

        <div
          className={`mb-8 border-2 border-dashed rounded-lg p-8 text-center ${
            isDragging ? "border-primary bg-primary/5" : "border-gray-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <FileUp className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-2 text-xl font-semibold">Upload Presentation</h2>
          <p className="mt-1 text-sm text-gray-500">Drag and drop your .ppt or .pptx files here, or click to browse</p>

          <div className="mt-4">
            <Label htmlFor="file-upload" className="sr-only">
              Choose file
            </Label>
            <Input
              id="file-upload"
              name="file-upload"
              type="file"
              accept=".ppt,.pptx"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button asChild>
              <label htmlFor="file-upload">Browse files</label>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {presentations.map((presentation) => (
            <Card 
              key={presentation.id}
              className="h-full cursor-pointer transition-all hover:shadow-md"
              onClick={() => router.push(`/presentation/${presentation.id}`)}
            >
              <CardContent className="p-6">
                <div className="aspect-video bg-gray-100 rounded flex items-center justify-center mb-4">
                  {presentation.title.charAt(0)}
                </div>
                <h3 className="font-medium">{presentation.title}</h3>
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>{presentation.date}</span>
                  <span>{presentation.slides} slides</span>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card 
            className="h-full border-dashed cursor-pointer"
            onClick={() => router.push('/presentation/create')}
          >
            <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
              <PlusCircle className="h-8 w-8 text-gray-400 mb-2" />
              <h3 className="font-medium">Create New Presentation</h3>
              <p className="text-sm text-gray-500 mt-1">Start from scratch</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // In a real app, handle file upload using middleware
    // like formidable, multer or the built-in Request.formData()
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 })
    }

    // Validate file type
    const fileType = file.name.split('.').pop()?.toLowerCase()
    if (!['ppt', 'pptx', 'pdf'].includes(fileType || '')) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid file type. Only PPT, PPTX and PDF files are supported" 
      }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer()

    // Get the file data as FormData
    const uploadData = new FormData()
    uploadData.append('file', file)    
    // Send to backend for processing
    const response = await fetch('http://localhost:8000/process-presentation', {
      method: 'POST',
      body: uploadData
    })
;
    if (!response.ok) {
      throw new Error('Failed to process presentation')
    }

    const result = await response.json()
    
    // Store metadata in database (mock implementation)
    const presentationId = Date.now().toString()
    const presentation = {
      id: presentationId,
      title: file.name.replace(/\.(ppt|pptx|pdf)$/, ""),
      slides: result.slides.map((slide: any) => ({
        number: slide.number,
        imagePath: slide.image_path,
        textContent: slide.text_content
      })),
      totalSlides: result.total_slides,
      date: new Date().toISOString().split("T")[0]
    }

    return NextResponse.json({
      success: true,
      message: "Presentation processed successfully",
      presentation
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ success: false, message: "Upload failed" }, { status: 500 })
  }
}

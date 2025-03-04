import { NextResponse } from "next/server"
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    // In a real app, validate credentials against database
    // For demo purposes, we'll just simulate a successful login

    // Simulate a small delay for realism
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Create session
    const sessionToken = Math.random().toString(36).substring(2)
    
    // Set session cookie
    cookies().set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    // Return successful response
    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: { id: 1, username },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, message: "Login failed" }, { status: 500 })
  }
}

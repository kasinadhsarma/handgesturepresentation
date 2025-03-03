import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json()

    // In a real app, validate input and store user in database
    // For demo purposes, we'll just simulate a successful registration

    // Simulate a small delay for realism
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Return successful response
    return NextResponse.json({
      success: true,
      message: "User registered successfully",
      user: { id: 1, username, email },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ success: false, message: "Registration failed" }, { status: 500 })
  }
}


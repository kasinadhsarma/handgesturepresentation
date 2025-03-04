import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 py-3 border-b">
        <div className="container flex items-center justify-between">
          <h1 className="text-2xl font-bold">GestureSlide</h1>
          <nav className="space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Register</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="container py-24 space-y-8 text-center">
          <h1 className="text-5xl font-bold tracking-tighter md:text-6xl">Hand Gesture Controlled Presentations</h1>
          <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
            Navigate slides and draw on your presentations using just hand gestures. No mouse or keyboard needed.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg">
                Try Demo
              </Button>
            </Link>
          </div>
        </section>
        <section className="container py-12 space-y-8">
          <h2 className="text-3xl font-bold text-center">Features</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-6 space-y-3 border rounded-lg shadow-sm">
              <h3 className="text-xl font-bold">Intuitive Gesture Control</h3>
              <p className="text-gray-500">
                Control presentations with simple hand gestures. Navigate slides, point, draw, and more.
              </p>
            </div>
            <div className="p-6 space-y-3 border rounded-lg shadow-sm">
              <h3 className="text-xl font-bold">AI Virtual Painter</h3>
              <p className="text-gray-500">
                Draw on slides with your index finger, change colors, brush sizes, and shapes.
              </p>
            </div>
            <div className="p-6 space-y-3 border rounded-lg shadow-sm">
              <h3 className="text-xl font-bold">Simple File Management</h3>
              <p className="text-gray-500">
                Upload presentations via drag-and-drop and save your annotated slides for later use.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="px-6 py-4 border-t">
        <div className="container flex flex-col items-center justify-between gap-4 text-center md:flex-row">
          <p className="text-sm text-gray-500">© 2025 GestureSlide. All rights reserved.</p>
          <nav className="flex gap-4 text-sm">
            <Link href="/about" className="text-gray-500 hover:underline">
              About
            </Link>
            <Link href="/contact" className="text-gray-500 hover:underline">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}


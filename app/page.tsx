import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Present with Gestures
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Control your presentations naturally with hand gestures. No remote needed.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            {
              title: "Natural Navigation",
              description: "Navigate slides with intuitive hand gestures",
              emoji: "👆"
            },
            {
              title: "Draw & Annotate",
              description: "Add real-time annotations during presentations",
              emoji: "✌️"
            },
            {
              title: "Smart Controls",
              description: "Quick access to tools and actions with gestures",
              emoji: "🤚"
            }
          ].map(feature => (
            <div key={feature.title} className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-3xl mb-4">{feature.emoji}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Gesture Guide Preview */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">Popular Gestures</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { emoji: "👆", action: "Next slide" },
              { emoji: "👇", action: "Previous slide" },
              { emoji: "✌️", action: "Draw mode" },
              { emoji: "👊", action: "Pointer mode" },
              { emoji: "🖐️", action: "Eraser" },
              { emoji: "✋", action: "Highlighter" },
              { emoji: "💾", action: "Save" },
              { emoji: "⭕", action: "Draw circle" }
            ].map(gesture => (
              <div key={gesture.action} className="text-center">
                <div className="text-3xl mb-2">{gesture.emoji}</div>
                <p className="text-sm text-gray-600">{gesture.action}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to try it out?</h2>
          <p className="text-gray-600 mb-6">
            Start presenting with gestures in minutes.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Start Presenting
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
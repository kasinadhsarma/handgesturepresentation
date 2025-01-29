'use client'

import React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowRight, 
  HandIcon as Gesture, 
  Presentation, 
  PenTool,
  CheckCircle2,
  Play,
  Users,
  Building2
} from 'lucide-react'
import { Button } from "@/components/ui/button"

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">GesturePro</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/features" className="text-gray-600 hover:text-blue-600">Features</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-blue-600">Pricing</Link>
              <Link href="/about" className="text-gray-600 hover:text-blue-600">About</Link>
              <Link href="/contact" className="text-gray-600 hover:text-blue-600">Contact</Link>
              <Button asChild variant="ghost">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>

            <button 
              className="md:hidden flex items-center" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link href="/features" className="block px-3 py-2 text-gray-600 hover:text-blue-600">Features</Link>
              <Link href="/pricing" className="block px-3 py-2 text-gray-600 hover:text-blue-600">Pricing</Link>
              <Link href="/about" className="block px-3 py-2 text-gray-600 hover:text-blue-600">About</Link>
              <Link href="/contact" className="block px-3 py-2 text-gray-600 hover:text-blue-600">Contact</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
              Transform Your Presentations
            </h1>
            <p className="text-xl mb-12 text-gray-600 max-w-2xl mx-auto">
              Experience the future of presentations with our Hand Gesture Controlled Presentation Viewer and AI Virtual Painter.
            </p>
            <div className="flex gap-4 justify-center mb-16">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Link href="/demo">
                  Try Demo <Play className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/signup">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <FeatureCard
              icon={<Gesture className="h-12 w-12 mb-4 text-blue-600" />}
              title="Gesture Control"
              description="Navigate and interact with your presentations using intuitive hand gestures. No additional hardware required."
            />
            <FeatureCard
              icon={<Presentation className="h-12 w-12 mb-4 text-blue-600" />}
              title="Smart Presentations"
              description="Create and deliver engaging presentations with ease and style. Includes AI-powered design suggestions."
            />
            <FeatureCard
              icon={<PenTool className="h-12 w-12 mb-4 text-blue-600" />}
              title="AI Virtual Painter"
              description="Annotate and draw on your slides with our intelligent virtual painting tool. Perfect for emphasizing key points."
            />
          </div>

          {/* Social Proof */}
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold mb-8">Trusted by Industry Leaders</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="flex items-center justify-center">
                <Building2 className="h-12 w-12 text-gray-400" />
                <span className="ml-2 text-gray-600">TechCorp</span>
              </div>
              <div className="flex items-center justify-center">
                <Building2 className="h-12 w-12 text-gray-400" />
                <span className="ml-2 text-gray-600">InnovateCo</span>
              </div>
              <div className="flex items-center justify-center">
                <Building2 className="h-12 w-12 text-gray-400" />
                <span className="ml-2 text-gray-600">FutureInc</span>
              </div>
              <div className="flex items-center justify-center">
                <Building2 className="h-12 w-12 text-gray-400" />
                <span className="ml-2 text-gray-600">NextGen</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-blue-50 rounded-xl p-8 mb-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Stat number="100K+" label="Active Users" icon={<Users className="h-8 w-8 text-blue-600" />} />
              <Stat number="1M+" label="Presentations Created" icon={<Presentation className="h-8 w-8 text-blue-600" />} />
              <Stat number="4.9/5" label="User Rating" icon={<CheckCircle2 className="h-8 w-8 text-blue-600" />} />
            </div>
          </div>

          {/* CTA */}
          <div className="text-center bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-12">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Presentations?</h2>
            <p className="text-white text-lg mb-8">Start your free trial today. No credit card required.</p>
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              <Link href="/auth/signup">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/integrations" className="hover:text-white">Integrations</Link></li>
                <li><Link href="/updates" className="hover:text-white">Updates</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/press" className="hover:text-white">Press</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/tutorials" className="hover:text-white">Tutorials</Link></li>
                <li><Link href="/documentation" className="hover:text-white">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
                <li><Link href="/cookies" className="hover:text-white">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>&copy; 2025 GesturePro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {icon}
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function Stat({ number, label, icon }: { number: string, label: string, icon: React.ReactNode }) {
  return (
    <div className="text-center">
      {icon}
      <div className="text-3xl font-bold text-gray-900 mt-2">{number}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  )
}
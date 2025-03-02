'use client'

import { PresentationUpload } from '@/components/dashboard/presentation-upload'
import { RecentPresentations } from '@/components/dashboard/recent-presentations'
import { UserProfile } from '@/components/profile/user-profile'
import { useEffect, useState } from 'react'
import type { DashboardStats, UserProfile as UserProfileType } from '@/types'
import { Loading } from '@/components/ui/loading'

export default function DashboardPage() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [statsResponse, profileResponse] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/user/profile')
        ])

        if (statsResponse.ok && profileResponse.ok) {
          const { stats } = await statsResponse.json()
          const profile = await profileResponse.json()
          setDashboardStats(stats)
          setUserProfile(profile)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section with User Profile */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Presentations Dashboard</h1>
            <p className="text-gray-600">Manage and view your recent presentations</p>
          </div>
          {userProfile && (
            <div className="bg-white rounded-lg shadow p-4">
              <UserProfile profile={userProfile} />
            </div>
          )}
        </div>
        
        {/* Activity Summary */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Presentations</h3>
              <p className="text-3xl font-bold text-blue-600">
                {dashboardStats.activity_summary.total_presentations}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Slides Viewed</h3>
              <p className="text-3xl font-bold text-green-600">
                {dashboardStats.activity_summary.total_slides_viewed}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Annotations Made</h3>
              <p className="text-3xl font-bold text-purple-600">
                {dashboardStats.activity_summary.total_annotations}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Streak</h3>
              <p className="text-3xl font-bold text-orange-600">
                {dashboardStats.activity_summary.active_days_streak} days
              </p>
            </div>
          </div>
        )}

        {/* Updated Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Upload and Gesture Guide */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Presentation</h2>
              <PresentationUpload />
            </div>

            {/* New Gesture Guide Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Gesture Guide</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-sm text-gray-600 mb-2">Navigation</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { emoji: "👆", text: "Next slide" },
                      { emoji: "👇", text: "Previous slide" },
                      { emoji: "👈", text: "First slide" },
                      { emoji: "👉", text: "Last slide" }
                    ].map(item => (
                      <div key={item.text} className="flex items-center gap-3 text-gray-700">
                        <span className="text-xl">{item.emoji}</span>
                        <span className="text-sm">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-gray-600 mb-2">Drawing Tools</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { emoji: "✌️", text: "Toggle drawing" },
                      { emoji: "👊", text: "Pointer mode" },
                      { emoji: "🖐️", text: "Eraser" },
                      { emoji: "✋", text: "Highlighter" }
                    ].map(item => (
                      <div key={item.text} className="flex items-center gap-3 text-gray-700">
                        <span className="text-xl">{item.emoji}</span>
                        <span className="text-sm">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-gray-600 mb-2">Actions</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { emoji: "↩️", text: "Undo" },
                      { emoji: "↪️", text: "Redo" },
                      { emoji: "💾", text: "Save" },
                      { emoji: "⭕", text: "Draw circle" }
                    ].map(item => (
                      <div key={item.text} className="flex items-center gap-3 text-gray-700">
                        <span className="text-xl">{item.emoji}</span>
                        <span className="text-sm">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Presentations */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Recent Presentations</h2>
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  View All
                </button>
              </div>
              {!loading && dashboardStats ? (
                <RecentPresentations presentations={dashboardStats.recent_presentations} />
              ) : (
                <Loading className="h-48" message="Loading presentations..." />
              )}
            </div>

            {/* New Quick Actions Section */}
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => window.location.href = '/presentation/new'}
                  className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <span className="text-xl">📝</span>
                  <span className="text-sm font-medium">New Presentation</span>
                </button>
                <button
                  onClick={() => window.location.href = '/presentation/whiteboard'}
                  className="flex items-center gap-2 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <span className="text-xl">🎨</span>
                  <span className="text-sm font-medium">Open Whiteboard</span>
                </button>
                <button
                  onClick={() => window.location.href = '/settings/gestures'}
                  className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <span className="text-xl">👋</span>
                  <span className="text-sm font-medium">Gesture Settings</span>
                </button>
                <button
                  onClick={() => window.location.href = '/help'}
                  className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <span className="text-xl">❓</span>
                  <span className="text-sm font-medium">Help Guide</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

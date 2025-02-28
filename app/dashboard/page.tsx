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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload and Settings Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Upload New</h2>
              <PresentationUpload />
            </div>

            {/* Gesture Settings */}
            {dashboardStats && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Gesture Preferences</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gesture Speed
                    </label>
                    <select 
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={dashboardStats?.preferences?.gestureSpeed}
                      onChange={async (e) => {
                        const response = await fetch('/api/dashboard', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            preferences: {
                              ...dashboardStats.preferences,
                              gestureSpeed: e.target.value
                            }
                          })
                        })
                        if (response.ok) {
                          // Refresh dashboard data
                          const { stats } = await (await fetch('/api/dashboard')).json()
                          setDashboardStats(stats)
                        }
                      }}
                    >
                      <option value="slow">Slow</option>
                      <option value="medium">Medium</option>
                      <option value="fast">Fast</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Annotation Color
                    </label>
                    <input 
                      type="color"
                      className="h-10 w-full"
                      value={dashboardStats?.preferences?.defaultAnnotationColor || '#000000'}
                      onChange={async (e) => {
                        const response = await fetch('/api/dashboard', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            preferences: {
                              ...dashboardStats.preferences,
                              defaultAnnotationColor: e.target.value
                            }
                          })
                        })
                        if (response.ok) {
                          // Refresh dashboard data
                          const { stats } = await (await fetch('/api/dashboard')).json()
                          setDashboardStats(stats)
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Recent Presentations */}
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
          </div>
        </div>
      </div>
    </div>
  )
}

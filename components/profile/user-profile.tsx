'use client'

import { useState } from 'react'
import type { UserProfile as UserProfileType } from '@/types'

interface UserProfileProps {
  profile: UserProfileType
}

export function UserProfile({ profile }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(profile.name || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })

      if (response.ok) {
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center space-x-4 mb-4">
        {profile.avatar ? (
          <img 
            src={profile.avatar} 
            alt={profile.username}
            className="h-12 w-12 rounded-full"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-xl font-medium text-gray-600">
              {profile.username[0].toUpperCase()}
            </span>
          </div>
        )}
        <div>
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-2 py-1 border rounded text-sm"
                placeholder="Enter your name"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm text-white bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <h3 className="font-medium text-gray-900">
                {profile.name || profile.username}
              </h3>
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Edit Profile
              </button>
            </>
          )}
          <p className="text-sm text-gray-500">{profile.email}</p>
        </div>
      </div>

      {/* Stats */}
      {profile.stats && (
        <div className="w-full grid grid-cols-2 gap-4 text-center text-sm">
          <div className="bg-gray-50 rounded p-2">
            <p className="text-gray-600">Presentations</p>
            <p className="font-semibold text-gray-900">
              {profile.stats.totalPresentations}
            </p>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <p className="text-gray-600">Annotations</p>
            <p className="font-semibold text-gray-900">
              {profile.stats.totalAnnotations}
            </p>
          </div>
        </div>
      )}

      {/* Theme Toggle */}
      <div className="mt-4 w-full">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-gray-700">Dark Mode</span>
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={profile.preferences?.theme === 'dark'}
              onChange={async () => {
                const newTheme = profile.preferences?.theme === 'dark' ? 'light' : 'dark'
                await fetch('/api/user/profile', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    preferences: {
                      ...profile.preferences,
                      theme: newTheme
                    }
                  })
                })
              }}
            />
            <div className={`
              w-10 h-6 rounded-full transition
              ${profile.preferences?.theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'}
            `}>
              <div className={`
                transform transition w-4 h-4 rounded-full bg-white shadow translate-x-1 mt-1
                ${profile.preferences?.theme === 'dark' ? 'translate-x-5' : ''}
              `} />
            </div>
          </div>
        </label>
      </div>
    </div>
  )
}

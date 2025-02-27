'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut } from 'lucide-react'

interface User {
  name: string
  email: string
  avatar: string
}

export function UserProfile() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // TODO: Fetch user data from your authentication system
    setUser({
      name: 'John Doe',
      email: 'john@example.com',
      avatar: '/placeholder.svg?height=40&width=40'
    })
  }, [])

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log('Logging out...')
  }

  if (!user) return null

  return (
    <div className="flex items-center space-x-4 bg-white rounded-lg shadow-md p-2">
      <Avatar>
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium">{user.name}</p>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}


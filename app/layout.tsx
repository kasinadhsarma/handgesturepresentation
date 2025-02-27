'use client'

import { createContext, useState } from 'react'
import '@/app/globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })

interface UserContextType {
  username: string | null
  setUsername: (name: string) => void
}

export const UserContext = createContext<UserContextType>({
  username: null,
  setUsername: () => {}
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [username, setUsername] = useState<string | null>(null)

  return (
    <html lang="en" className="h-full">
      <UserContext.Provider value={{ username, setUsername }}>
        <body className={`${inter.className} h-full bg-gradient-to-br from-indigo-50 via-white to-cyan-100`}>
          <div className="min-h-full">
            {children}
          </div>
          <Toaster />
        </body>
      </UserContext.Provider>
    </html>
  )
}


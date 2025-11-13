import React from 'react'
import { Link, usePage } from '@inertiajs/react'
import { PageProps } from '@/types'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { auth, flash } = usePage<PageProps>().props

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              FPL Clone
            </Link>
            
            <div className="flex gap-6">
              <Link 
                href="/squad" 
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Squad
              </Link>
              <Link 
                href="/transfers" 
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Transfers
              </Link>
              <Link 
                href="/leagues" 
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Leagues
              </Link>
            </div>
            
            <div>
              {auth.user ? (
                <div className="flex items-center gap-4">
                  <span className="text-gray-700">{auth.user.name}</span>
                  <Link 
                    href="/logout" 
                    method="delete"
                    as="button"
                    className="text-red-600 hover:text-red-700"
                  >
                    Logout
                  </Link>
                </div>
              ) : (
                <Link 
                  href="/login" 
                  className="btn btn-primary"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Flash Messages */}
      {flash.success && (
        <div className="bg-green-500 text-white px-4 py-3 text-center">
          {flash.success}
        </div>
      )}
      {flash.error && (
        <div className="bg-red-500 text-white px-4 py-3 text-center">
          {flash.error}
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 FPL Clone. Built with Rails + Inertia + React + TypeScript</p>
        </div>
      </footer>
    </div>
  )
}
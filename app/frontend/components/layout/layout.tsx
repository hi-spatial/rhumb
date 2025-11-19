import React from 'react'
import { Link, usePage } from '@inertiajs/react'
import { PageProps } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { FlashMessages } from '@/components/layout/flash-messages'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const page = usePage<PageProps>()
  const { auth, flash } = page.props
  const currentUrl = page.url || ''

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/analysis', label: 'Analysis' },
    { href: '/analysis/history', label: 'History' },
    { href: '/settings/ai', label: 'AI Settings' },
  ]

  const isActive = (href: string) => currentUrl.startsWith(href)

  const initials =
    auth.user?.name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16 gap-6">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Rhumb
            </Link>

            {auth.user && (
              <div className="hidden md:flex gap-6 items-center">
                {navLinks.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={
                      isActive(link.href)
                        ? 'text-blue-600 font-semibold border-b-2 border-blue-600 pb-1'
                        : 'text-gray-700 hover:text-blue-600 transition'
                    }
                >
                    {link.label}
                </Link>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 ml-auto">
              {!auth.user && (
                <>
                  <Link href="/users/sign_in" className="text-gray-700 hover:text-blue-600 transition">
                    Login
                  </Link>
                  <Link
                    href="/users/sign_up"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                  >
                    Register
                  </Link>
                </>
              )}

              {auth.user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-full border border-gray-200 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline text-sm font-medium text-gray-800">{auth.user.name}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>
                      <div className="text-sm font-semibold text-gray-900">{auth.user.name}</div>
                      <div className="text-xs text-gray-500">{auth.user.email}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings/profile" className="w-full text-left">
                        Profile settings
                      </Link>
                    </DropdownMenuItem>
                    {auth.user.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link href="/avo" className="w-full text-left">
                          Admin panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/users/sign_out" method="delete" as="button" className="w-full text-left text-red-600">
                        Logout
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </nav>

      <FlashMessages flash={flash} />

      <main className="container mx-auto px-4 py-8 grow">{children}</main>

      <footer className="bg-gray-800 text-white py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 Rhumb by HI Spatial</p>
        </div>
      </footer>
    </div>
  )
}

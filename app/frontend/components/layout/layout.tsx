import React from 'react'
import { Link, usePage } from '@inertiajs/react'
import { PageProps } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
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
  const [ dismissed, setDismissed ] = React.useState<Record<string, boolean>>({})
  const [ modalDismissed, setModalDismissed ] = React.useState(false)

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/analysis', label: 'Analysis' },
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

      <FlashStack
        flash={flash}
        dismissed={dismissed}
        onDismiss={(key) => setDismissed((prev) => ({ ...prev, [key]: true }))}
      />
      <FlashModal
        message={flash.alert}
        open={Boolean(flash.alert) && !modalDismissed}
        onDismiss={() => setModalDismissed(true)}
      />

      <main className="container mx-auto px-4 py-8 grow">{children}</main>

      <footer className="bg-gray-800 text-white py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 Rhumb by HI Spatial</p>
        </div>
      </footer>
    </div>
  )
}

type FlashMessage = {
  key: string
  message: string
  variant: 'success' | 'error'
}

interface FlashStackProps {
  flash: PageProps['flash']
  dismissed: Record<string, boolean>
  onDismiss: (key: string) => void
}

function FlashStack({ flash, dismissed, onDismiss }: FlashStackProps) {
  const messages: FlashMessage[] = [
    { key: 'success', message: flash.success || '', variant: 'success' } as FlashMessage,
    { key: 'notice', message: flash.notice || '', variant: 'success' } as FlashMessage,
    { key: 'error', message: flash.error || '', variant: 'error' } as FlashMessage,
  ].filter((item) => item.message && !dismissed[item.key])

  if (!messages.length) {
    return null
  }

  const styles = {
    success: {
      container: 'border-green-200 bg-green-50 text-green-900',
      icon: 'text-green-600',
      title: 'Success',
      Icon: CheckCircle2,
    },
    error: {
      container: 'border-red-200 bg-red-50 text-red-900',
      icon: 'text-red-600',
      title: 'Heads up',
      Icon: AlertCircle,
    },
  }

  return (
    <div className="container mx-auto px-4 pt-4 space-y-3" aria-live="polite">
      {messages.map((msg) => {
        const config = styles[msg.variant]
        const IconComponent = config.Icon
        return (
          <div
            key={msg.key}
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-sm ${config.container}`}
          >
            <IconComponent className={`h-5 w-5 mt-0.5 ${config.icon}`} aria-hidden="true" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">{config.title}</p>
              <p className="text-sm opacity-90">{msg.message}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(msg.key)}
              className="rounded-full p-1 text-current/70 hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

interface FlashModalProps {
  message?: string | null
  open: boolean
  onDismiss: () => void
}

function FlashModal({ message, open, onDismiss }: FlashModalProps) {
  if (!message) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Attention required</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onDismiss}>
            Dismiss
          </Button>
          <Button asChild>
            <Link href="/users/sign_in">Go to sign in</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
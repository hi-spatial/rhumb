import React from 'react'
import { Link } from '@inertiajs/react'
import { PageProps } from '@/types'
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

type FlashKind = 'success' | 'error'

interface FlashMessagesProps {
  flash: PageProps['flash']
  ctaHref?: string | null
}

export function FlashMessages({ flash, ctaHref = '/users/sign_in' }: FlashMessagesProps) {
  const [ dismissed, setDismissed ] = React.useState<Record<string, boolean>>({})
  const [ modalDismissed, setModalDismissed ] = React.useState(false)

  const toastMessages = extractToasts(flash).filter((message) => !dismissed[message.key])
  const showModal = Boolean(flash.alert) && !modalDismissed

  return (
    <>
      {toastMessages.length > 0 && (
        <div className="container mx-auto px-4 pt-4 space-y-3" aria-live="polite">
          {toastMessages.map((msg) => {
            const config = toastStyles[msg.variant]
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
                  onClick={() =>
                    setDismissed((prev) => ({
                      ...prev,
                      [msg.key]: true,
                    }))
                  }
                  className="rounded-full p-1 text-current/70 hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={(isOpen) => !isOpen && setModalDismissed(true)}>
        <DialogContent className="sm:max-w-lg border-0 bg-white/95 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-red-100 p-2 text-red-600">
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <DialogHeader className="space-y-1 text-left">
                  <DialogTitle className="text-xl font-semibold text-gray-900">Sign in required</DialogTitle>
                  <DialogDescription className="text-base text-gray-600">
                    {flash.alert}
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>
            <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
              Keep your account secure by signing back in to continue.
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setModalDismissed(true)}>
              Stay here
            </Button>
            {ctaHref && (
              <Button asChild>
                <Link href={ctaHref}>Go to sign in</Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

type ToastMessage = {
  key: string
  message: string
  variant: FlashKind
}

const toastStyles: Record<FlashKind, { container: string; icon: string; title: string; Icon: typeof CheckCircle2 }> = {
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

function extractToasts(flash: PageProps['flash']): ToastMessage[] {
  return [
    { key: 'success', message: flash.success || '', variant: 'success' },
    { key: 'notice', message: flash.notice || '', variant: 'success' },
    { key: 'error', message: flash.error || '', variant: 'error' },
  ].filter((item) => item.message) as ToastMessage[]
}


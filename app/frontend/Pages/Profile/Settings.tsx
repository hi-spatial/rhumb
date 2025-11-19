import { router } from '@inertiajs/react'
import { useForm } from 'react-hook-form'
import Layout from '@/components/layout/layout'
import { PageProps, User } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ProfileSettingsProps extends PageProps {
  user: User
}

type FormValues = {
  name: string
  email: string
  current_password: string
  password: string
  password_confirmation: string
}

export default function ProfileSettings({ user, errors }: ProfileSettingsProps) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: user.name,
      email: user.email,
      current_password: '',
      password: '',
      password_confirmation: '',
    },
  })

  const onSubmit = (data: FormValues) => {
    router.put('/settings/profile', { user: data })
  }

  const fieldError = (field: string) => errors?.[field]

  return (
    <Layout>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Profile settings</h1>
          <p className="text-gray-600">
            Update your personal details and password.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal information</CardTitle>
            <CardDescription>These details show up across your workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} />
                {fieldError('name') && <p className="text-sm text-red-600">{fieldError('name')}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} />
                {fieldError('email') && <p className="text-sm text-red-600">{fieldError('email')}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your password by confirming your current one.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="current_password">Current password</Label>
              <Input
                id="current_password"
                type="password"
                autoComplete="current-password"
                {...register('current_password')}
              />
              <p className="text-xs text-gray-500">Required to confirm who you are before setting a new password.</p>
              {fieldError('current_password') && (
                <p className="text-sm text-red-600">{fieldError('current_password')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
              {fieldError('password') && <p className="text-sm text-red-600">{fieldError('password')}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Confirm new password</Label>
              <Input
                id="password_confirmation"
                type="password"
                autoComplete="new-password"
                {...register('password_confirmation')}
              />
              {fieldError('password_confirmation') && (
                <p className="text-sm text-red-600">{fieldError('password_confirmation')}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.visit('/dashboard')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save profile'}
          </Button>
        </div>
      </form>
    </Layout>
  )
}


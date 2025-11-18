import { router } from '@inertiajs/react'
import { useForm, useWatch } from 'react-hook-form'
import Layout from '@/components/layout/layout'
import { PageProps, User, AiProvider } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ProfileSettingsProps extends PageProps {
  user: User
  ai_providers: AiProvider[]
}

type FormValues = {
  name: string
  email: string
  ai_provider: AiProvider
  ai_api_key: string
  current_password: string
  password: string
  password_confirmation: string
  openai_model?: string
  gemini_model?: string
  custom_model?: string
  custom_endpoint?: string
}

const providerLabels: Record<AiProvider, string> = {
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  custom: 'Custom HTTP',
}

export default function ProfileSettings({ user, ai_providers: aiProviders = [], errors }: ProfileSettingsProps) {
  const metadata = (user.ai_metadata || {}) as Record<string, unknown>
  const metadataValue = (key: string) => {
    const value = metadata[key]
    return typeof value === 'string' ? value : ''
  }

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: user.name,
      email: user.email,
      ai_provider: (user.ai_provider as AiProvider) || 'openai',
      ai_api_key: '',
      current_password: '',
      password: '',
      password_confirmation: '',
      openai_model: metadataValue('openai_model'),
      gemini_model: metadataValue('gemini_model'),
      custom_model: metadataValue('custom_model'),
      custom_endpoint: metadataValue('custom_endpoint'),
    },
  })

  const selectedProvider = useWatch({
    control,
    name: 'ai_provider',
  })
  const requiresCustomConfig = selectedProvider === 'custom'
  const providerList = aiProviders.length ? aiProviders : (Object.keys(providerLabels) as AiProvider[])

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
            Update your personal details and control which AI provider powers your workspace.
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

            <div className="space-y-2">
              <Label htmlFor="ai_provider">AI provider</Label>
              <Select value={selectedProvider} onValueChange={(value) => setValue('ai_provider', value as AiProvider)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providerList.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {providerLabels[provider]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError('ai_provider') && <p className="text-sm text-red-600">{fieldError('ai_provider')}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai_api_key">API key</Label>
              <Input
                id="ai_api_key"
                type="password"
                autoComplete="off"
                placeholder="sk-..."
                {...register('ai_api_key')}
              />
              <p className="text-xs text-gray-500">Leave blank to keep your existing key.</p>
              {fieldError('ai_api_key') && <p className="text-sm text-red-600">{fieldError('ai_api_key')}</p>}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="openai_model">OpenAI model</Label>
                <Input id="openai_model" placeholder="gpt-4o-mini" {...register('openai_model')} />
                {fieldError('openai_model') && <p className="text-sm text-red-600">{fieldError('openai_model')}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gemini_model">Gemini model</Label>
                <Input id="gemini_model" placeholder="gemini-1.5-pro" {...register('gemini_model')} />
                {fieldError('gemini_model') && <p className="text-sm text-red-600">{fieldError('gemini_model')}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom_model">Custom model</Label>
                <Input id="custom_model" placeholder="Optional" {...register('custom_model')} />
                {fieldError('custom_model') && <p className="text-sm text-red-600">{fieldError('custom_model')}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom_endpoint">
                  Custom endpoint {requiresCustomConfig && <span className="text-red-600">*</span>}
                </Label>
                <Input
                  id="custom_endpoint"
                  placeholder="https://your-model-host/chat"
                  {...register('custom_endpoint')}
                />
                {fieldError('custom_endpoint') && (
                  <p className="text-sm text-red-600">{fieldError('custom_endpoint')}</p>
                )}
              </div>
            </div>

            {requiresCustomConfig && (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
                Custom providers require both an API key and an endpoint URL. We will send OpenAI-compatible payloads to
                this endpoint.
              </div>
            )}
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


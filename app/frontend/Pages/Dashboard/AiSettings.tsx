import React from 'react'
import { router } from '@inertiajs/react'
import { useForm } from 'react-hook-form'
import Layout from '@/components/layout/layout'
import { PageProps, User, AiProvider } from '@/types'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AiSettingsProps extends PageProps {
  user: User
  ai_providers: AiProvider[]
}

type FormValues = {
  ai_provider: AiProvider
  ai_api_key: string
  openai_model?: string
  gemini_model?: string
  perplexity_model?: string
  custom_model?: string
  custom_endpoint?: string
}

const providerLabels: Record<AiProvider, string> = {
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  perplexity: 'Perplexity',
  custom: 'Custom HTTP',
}

export default function AiSettings({ user, ai_providers: aiProviders = [] }: AiSettingsProps) {
  const metadata = (user.ai_metadata || {}) as Record<string, unknown>
  const metadataValue = (key: string) => {
    const value = metadata[key]
    return typeof value === 'string' ? value : ''
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      ai_provider: (user.ai_provider as AiProvider) || 'openai',
      ai_api_key: '',
      openai_model: metadataValue('openai_model'),
      gemini_model: metadataValue('gemini_model'),
      perplexity_model: metadataValue('perplexity_model'),
      custom_model: metadataValue('custom_model'),
      custom_endpoint: metadataValue('custom_endpoint'),
    },
  })

  const selectedProvider = watch('ai_provider')
  const hasStoredKey = Boolean(user.has_ai_api_key)
  const needsCustomConfig = selectedProvider === 'custom'

  const handleProviderChange = (value: AiProvider) => {
    setValue('ai_provider', value)
  }

  const onSubmit = (data: FormValues) => {
    router.put('/settings/ai', { user: data })
  }

  const connectionStatus = user.has_ai_api_key ? 'Connected' : 'Using workspace defaults'
  const providerList = (aiProviders.length ? aiProviders : (Object.keys(providerLabels) as AiProvider[]))

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Provider Settings</h1>
          <p className="text-gray-600">
            Choose which AI service powers your analyses and manage personal API credentials.
          </p>
        </div>

        <Card className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600">Connection status</p>
            <p className="text-lg font-semibold">{connectionStatus}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ai_provider">AI Provider</Label>
              <Select value={selectedProvider} onValueChange={(value) => handleProviderChange(value as AiProvider)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providerList.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {providerLabels[provider]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai_api_key">API Key (optional for workspace defaults)</Label>
              <Input
                id="ai_api_key"
                type="password"
                placeholder={hasStoredKey ? '•••••••• (stored)' : 'sk-...'}
                {...register('ai_api_key')}
              />
              <p className="text-xs text-gray-500">
                {hasStoredKey
                  ? 'A personal key is already stored. Enter a new key to replace it or leave blank to keep it.'
                  : 'Enter your personal key. Leave blank to use workspace defaults. Custom providers require a personal key.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openai_model">OpenAI model override</Label>
                <Input
                  id="openai_model"
                  placeholder="e.g. gpt-4o-mini"
                  {...register('openai_model')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gemini_model">Gemini model override</Label>
                <Input
                  id="gemini_model"
                  placeholder="e.g. gemini-1.5-pro"
                  {...register('gemini_model')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perplexity_model">Perplexity model override</Label>
                <Input
                  id="perplexity_model"
                  placeholder="e.g. sonar-pro"
                  {...register('perplexity_model')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom_model">Custom provider model hint</Label>
                <Input
                  id="custom_model"
                  placeholder="Optional"
                  {...register('custom_model')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom_endpoint">
                  Custom endpoint {needsCustomConfig && <span className="text-red-600">*</span>}
                </Label>
                <Input
                  id="custom_endpoint"
                  placeholder="https://your-model-host/chat"
                  {...register('custom_endpoint')}
                />
              </div>
            </div>

            {needsCustomConfig && (
              <div className="p-3 rounded border border-yellow-300 bg-yellow-50 text-sm text-yellow-900">
                Custom provider requires both an API key and endpoint URL. We will POST OpenAI-compatible payloads to
                your endpoint.
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  )
}


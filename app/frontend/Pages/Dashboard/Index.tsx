import React from 'react'
import { Link } from '@inertiajs/react'
import {
  PageProps,
  User,
  DashboardStats,
  DashboardSessionSummary,
  AiProviderSummary,
  AiProvider,
  AnalysisStatus,
} from '@/types'
import Layout from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DashboardProps extends PageProps {
  user: User
  stats: DashboardStats
  recentSessions: DashboardSessionSummary[]
  aiSummary: AiProviderSummary
}

const providerLabels: Record<AiProvider, string> = {
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  custom: 'Custom HTTP',
  perplexity: 'Perplexity',
}

const statusVariant: Record<AnalysisStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  processing: 'secondary',
  pending: 'secondary',
  failed: 'destructive',
}

export default function Index({ user, stats, recentSessions, aiSummary }: DashboardProps) {
  const lastUsedAt = stats.last_used_at ? new Date(stats.last_used_at) : null
  const lastUsedLabel = lastUsedAt ? lastUsedAt.toLocaleString() : 'No activity yet'
  const providerLabel = providerLabels[aiSummary.provider || 'openai']

  const quickActions = [
    { label: 'Start new analysis', href: '/analysis' },
    { label: 'Review AI settings', href: '/settings/ai' },
    { label: 'View all sessions', href: '/analysis' },
  ]

  if (user.role === 'admin') {
    quickActions.push({ label: 'Open Admin Panel', href: '/avo' })
  }

  const formatAnalysisType = (type: string) => type.replace(/_/g, ' ')

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardHeader className="p-6 pb-2">
              <CardDescription className="text-blue-100 text-sm uppercase tracking-widest">
                Welcome back
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-white">{user.name}</CardTitle>
              <p className="text-blue-100 text-sm">You’re set to continue mapping smarter geospatial insights.</p>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase text-blue-100">Last activity</p>
                  <p className="text-lg font-semibold">{lastUsedLabel}</p>
                </div>
                <Link href="/analysis">
                  <Button className="bg-white text-blue-700 hover:bg-blue-50">Open Analysis Workspace</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Provider</CardTitle>
              <CardDescription>Manage how your sessions connect to AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current provider</p>
                  <p className="text-xl font-semibold">{providerLabel}</p>
                </div>
                <Badge variant={aiSummary.has_personal_key ? 'default' : 'outline'}>
                  {aiSummary.has_personal_key ? 'Personal key' : 'Workspace key'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {aiSummary.requires_personal_key && !aiSummary.has_personal_key
                  ? 'Add your custom provider key to start analyses.'
                  : 'Update credentials or switch providers anytime.'}
              </p>
              <Link href="/settings/ai">
                <Button variant="outline" className="w-full">
                  Manage AI settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Insight snapshot</h2>
            <Link href="/analysis" className="text-sm font-medium text-blue-600 hover:underline">
              View all sessions
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader>
                <CardDescription>Total sessions</CardDescription>
                <CardTitle className="text-3xl">{stats.total_sessions}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Active sessions</CardDescription>
                <CardTitle className="text-3xl">{stats.active_sessions}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Completed analyses</CardDescription>
                <CardTitle className="text-3xl">{stats.completed_sessions}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Last used</CardDescription>
                <CardTitle className="text-lg">{lastUsedLabel}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent sessions</CardTitle>
              <CardDescription>Resume where you left off or review insights</CardDescription>
            </CardHeader>
            <CardContent>
              {recentSessions.length > 0 ? (
                <div className="space-y-4">
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold capitalize">
                          {formatAnalysisType(session.analysis_type)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Provider: {providerLabels[session.ai_provider]} ·{' '}
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={statusVariant[session.status]}>
                        {session.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-8">
                  No sessions yet. Start by selecting an area in the analysis workspace.
                  <div className="mt-4">
                    <Link href="/analysis">
                      <Button size="sm">Start your first analysis</Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
              <CardDescription>Everything you need to move faster</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {quickActions.map((action) => (
                  <li key={action.label}>
                    <Link
                      href={action.href}
                      className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 transition"
                    >
                      <span>{action.label}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-6 text-sm text-muted-foreground">
                Need help? Reach out to the HI Spatial team for support.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}


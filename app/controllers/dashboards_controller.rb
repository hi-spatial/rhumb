class DashboardsController < ApplicationController
  before_action :authenticate_user!

  def index
    authorize :dashboard
    sessions_scope = current_user.analysis_sessions
    recent_sessions = sessions_scope.recent.limit(4)

    stats = {
      total_sessions: sessions_scope.count,
      active_sessions: sessions_scope.where(status: %i[pending processing]).count,
      completed_sessions: sessions_scope.completed.count,
      last_used_at: recent_sessions.first&.updated_at
    }

    ai_summary = {
      provider: current_user.ai_provider,
      requires_personal_key: current_user.requires_personal_key?,
      has_personal_key: current_user.ai_api_key_present?
    }

    render inertia: "Dashboard/Index", props: {
      user: current_user_payload,
      stats: stats,
      recentSessions: recent_sessions.map { |session| serialize_session_summary(session) },
      aiSummary: ai_summary
    }
  end

  private

  def serialize_session_summary(session)
    {
      id: session.id,
      analysis_type: session.analysis_type,
      ai_provider: session.ai_provider,
      status: session.status,
      created_at: session.created_at
    }
  end
end

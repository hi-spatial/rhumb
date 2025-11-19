# frozen_string_literal: true

class AnalysisJob < ApplicationJob
  queue_as :default

  def perform(analysis_session_id, prompt)
    analysis_session = AnalysisSession.find(analysis_session_id)
    return if analysis_session.completed? || analysis_session.failed?

    analysis_session.update(status: :processing)
    broadcast_session_update(analysis_session)

    service = AiAnalysisService.new(analysis_session: analysis_session)
    response = service.analyze(prompt: prompt)

    message = analysis_session.analysis_messages.create!(
      role: :assistant,
      content: response,
      payload: {
        analysis_type: analysis_session.analysis_type,
        ai_provider: analysis_session.ai_provider
      }
    )

    analysis_session.update(status: :completed)
    broadcast_message(analysis_session, message)
    broadcast_session_update(analysis_session)
  rescue AiProviders::Error, StandardError => e
    Rails.logger.error("AnalysisJob failed: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))

    analysis_session.update(status: :failed)
    message = analysis_session.analysis_messages.create!(
      role: :system,
      content: "Analysis failed: #{e.message}",
      payload: { error: e.class.name, message: e.message }
    )

    broadcast_message(analysis_session, message)
    broadcast_session_update(analysis_session)
  end

  private

  def broadcast_session_update(analysis_session)
    ActionCable.server.broadcast(
      "analysis_session:#{analysis_session.id}",
      {
        type: "session_update",
        session: {
          id: analysis_session.id,
          status: analysis_session.status,
          updated_at: analysis_session.updated_at.iso8601
        }
      }
    )
  end

  def broadcast_message(analysis_session, message)
    ActionCable.server.broadcast(
      "analysis_session:#{analysis_session.id}",
      {
        type: "message",
        message: {
          id: message.id,
          role: message.role,
          content: message.content,
          payload: message.payload,
          created_at: message.created_at.iso8601
        }
      }
    )
  end
end

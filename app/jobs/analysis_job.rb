# frozen_string_literal: true

class AnalysisJob < ApplicationJob
  queue_as :default

  def perform(analysis_session_id, prompt)
    analysis_session = AnalysisSession.find(analysis_session_id)
    return if analysis_session.completed? || analysis_session.failed?

    analysis_session.update(status: :processing)

    service = AiAnalysisService.new(analysis_session: analysis_session)
    response = service.analyze(prompt: prompt)

    analysis_session.analysis_messages.create!(
      role: :assistant,
      content: response,
      payload: { analysis_type: analysis_session.analysis_type }
    )

    analysis_session.update(status: :completed)
  rescue StandardError => e
    Rails.logger.error("AnalysisJob failed: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))

    analysis_session.update(status: :failed)
    analysis_session.analysis_messages.create!(
      role: :system,
      content: "Analysis failed: #{e.message}",
      payload: { error: e.class.name, message: e.message }
    )
  end
end

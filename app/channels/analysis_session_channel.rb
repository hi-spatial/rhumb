# frozen_string_literal: true

class AnalysisSessionChannel < ApplicationCable::Channel
  def subscribed
    session_id = params[:session_id]
    @analysis_session = AnalysisSession.find_by(id: session_id)

    if @analysis_session && authorized?
      stream_from "analysis_session:#{session_id}"
    else
      reject
    end
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end

  private

  def authorized?
    Pundit.policy(current_user, @analysis_session).show?
  end
end

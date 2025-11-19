# frozen_string_literal: true

module Api
  class AnalysisMessagesController < BaseController
    before_action :authenticate_user!
    before_action :set_analysis_session
    before_action :set_analysis_message, only: %i[show]

    def index
      @messages = policy_scope(AnalysisMessage).where(analysis_session: @analysis_session).ordered
      render json: {
        messages: @messages.map { |msg| serialize_message(msg) }
      }
    end

    def show
      authorize @analysis_message
      render json: {
        message: serialize_message(@analysis_message)
      }
    end

    def create
      @analysis_message = @analysis_session.analysis_messages.build(analysis_message_params)
      authorize @analysis_message

      if @analysis_message.save
        # Broadcast user message immediately
        broadcast_message(@analysis_session, @analysis_message)

        # Update session status to processing
        @analysis_session.update(status: :processing)
        broadcast_session_update(@analysis_session)

        # Enqueue background job for AI analysis
        AnalysisJob.perform_later(@analysis_session.id, @analysis_message.content)

        render json: {
          message: serialize_message(@analysis_message)
        }, status: :created
      else
        render json: {
          errors: @analysis_message.errors.full_messages
        }, status: :unprocessable_entity
      end
    end

    private

    def set_analysis_session
      @analysis_session = AnalysisSession.find(params[:analysis_session_id])
      authorize @analysis_session, :show?
    end

    def set_analysis_message
      @analysis_message = AnalysisMessage.find(params[:id])
    end

    def analysis_message_params
      params.require(:analysis_message).permit(:content, :payload).merge(role: :user)
    end

    def serialize_message(message)
      {
        id: message.id,
        role: message.role,
        content: message.content,
        payload: message.payload,
        created_at: message.created_at
      }
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
  end
end

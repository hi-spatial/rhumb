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
  end
end

# frozen_string_literal: true

module Api
  class AnalysisSessionsController < BaseController
    before_action :authenticate_user!
    before_action :set_analysis_session, only: %i[show update destroy]

    def index
      @analysis_sessions = policy_scope(AnalysisSession).recent
      render json: {
        analysis_sessions: @analysis_sessions.map { |session| serialize_session(session) }
      }
    end

    def show
      authorize @analysis_session
      render json: {
        analysis_session: serialize_session(@analysis_session),
        messages: @analysis_session.analysis_messages.ordered.map { |msg| serialize_message(msg) }
      }
    end

    def create
      @analysis_session = current_user.analysis_sessions.build(analysis_session_params)
      authorize @analysis_session
      @analysis_session.ai_provider ||= current_user.ai_provider

      if @analysis_session.save
        render json: {
          analysis_session: serialize_session(@analysis_session)
        }, status: :created
      else
        render json: {
          errors: @analysis_session.errors.full_messages
        }, status: :unprocessable_entity
      end
    end

    def update
      authorize @analysis_session

      if @analysis_session.update(analysis_session_params)
        render json: {
          analysis_session: serialize_session(@analysis_session)
        }
      else
        render json: {
          errors: @analysis_session.errors.full_messages
        }, status: :unprocessable_entity
      end
    end

    def destroy
      authorize @analysis_session
      @analysis_session.destroy
      head :no_content
    end

    private

    def set_analysis_session
      @analysis_session = AnalysisSession.find(params[:id])
    end

    def analysis_session_params
      params.require(:analysis_session).permit(:analysis_type, :ai_provider, area_of_interest: {}, metadata: {}, provider_metadata: {})
    end

    def serialize_session(session)
      {
        id: session.id,
        ai_provider: session.ai_provider,
        analysis_type: session.analysis_type,
        status: session.status,
        area_of_interest: session.area_of_interest,
        metadata: session.metadata,
        provider_metadata: session.provider_metadata,
        created_at: session.created_at,
        updated_at: session.updated_at
      }
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

module Settings
  class AiProvidersController < ApplicationController
    before_action :authenticate_user!

    def show
      authorize current_user, :update?

      render inertia: "Dashboard/AiSettings", props: {
        user: current_user_payload,
        ai_providers: User.ai_providers.keys
      }
    end

    def update
      authorize current_user, :update?

      if current_user.update(ai_provider_params)
        flash[:success] = "AI provider settings updated"
      else
        flash[:error] = current_user.errors.full_messages.to_sentence
      end

      redirect_to settings_ai_path
    end

    private

    def ai_provider_params
      permitted = params.require(:user).permit(
        :ai_provider,
        :ai_api_key,
        :openai_model,
        :gemini_model,
        :custom_model,
        :custom_endpoint
      )

      permitted[:ai_api_key] = nil if permitted[:ai_api_key].blank?
      permitted
    end
  end
end

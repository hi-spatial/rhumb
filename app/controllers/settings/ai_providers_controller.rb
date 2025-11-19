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

      if ai_provider_setting.update(ai_provider_params)
        flash[:success] = "AI provider settings updated"
      else
        flash[:error] = ai_provider_setting.errors.full_messages.to_sentence
      end

      redirect_to settings_ai_provider_path
    end

    private

    def ai_provider_setting
      current_user.ai_provider_setting || current_user.build_ai_provider_setting
    end

    def ai_provider_params
      permitted = params.require(:user).permit(
        :ai_provider,
        :ai_api_key,
        :openai_model,
        :gemini_model,
        :perplexity_model,
        :custom_model,
        :custom_endpoint
      )

      permitted.delete(:ai_api_key) if permitted[:ai_api_key].blank?
      permitted
    end
  end
end

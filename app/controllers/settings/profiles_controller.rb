module Settings
  class ProfilesController < ApplicationController
    before_action :authenticate_user!

    def show
      authorize current_user, :update?

      render inertia: "Profile/Settings", props: {
        user: current_user_payload,
        ai_providers: User.ai_providers.keys
      }
    end

    def update
      authorize current_user, :update?

      attributes = profile_params.to_h.symbolize_keys
      ai_attributes = extract_ai_attributes(attributes)
      user_attributes = attributes.except(*ai_attribute_keys)

      if password_change_requested?(user_attributes)
        if user_attributes[:current_password].blank?
          current_user.errors.add(:current_password, "can't be blank")
          handle_update_failure
          return redirect_to(settings_profile_path)
        end

        unless current_user.valid_password?(user_attributes[:current_password])
          current_user.errors.add(:current_password, "is incorrect")
          handle_update_failure
          return redirect_to(settings_profile_path)
        end
      else
        user_attributes.except!(:password, :password_confirmation, :current_password)
      end

      user_attributes.delete(:current_password)

      update_success = ActiveRecord::Base.transaction do
        current_user.update(user_attributes) && ai_provider_setting.update(ai_attributes)
      end

      if update_success
        flash[:success] = "Profile updated successfully"
      else
        handle_update_failure(ai_provider_setting.errors.any? ? ai_provider_setting : current_user)
      end

      redirect_to settings_profile_path
    end

    private

    def password_change_requested?(attributes)
      attributes[:password].present?
    end

    def handle_update_failure(record = current_user)
      session[:errors] = record.errors.to_hash(true)
      flash[:error] = record.errors.full_messages.to_sentence
    end

    def ai_provider_setting
      current_user.ai_provider_setting || current_user.build_ai_provider_setting
    end

    def ai_attribute_keys
      @ai_attribute_keys ||= %i[
        ai_provider
        ai_api_key
        openai_model
        gemini_model
        custom_model
        custom_endpoint
      ]
    end

    def extract_ai_attributes(attributes)
      attrs = attributes.slice(*ai_attribute_keys)
      attrs.delete(:ai_api_key) if attrs[:ai_api_key].blank?
      attrs
    end

    def profile_params
      permitted = params.require(:user).permit(
        :name,
        :email,
        :ai_provider,
        :ai_api_key,
        :current_password,
        :password,
        :password_confirmation,
        :openai_model,
        :gemini_model,
        :custom_model,
        :custom_endpoint
      )

      permitted[:current_password] = nil if permitted[:current_password].blank?
      permitted[:password] = nil if permitted[:password].blank?
      permitted[:password_confirmation] = nil if permitted[:password_confirmation].blank?
      permitted
    end
  end
end

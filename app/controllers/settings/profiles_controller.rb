module Settings
  class ProfilesController < ApplicationController
    before_action :authenticate_user!

    def show
      authorize current_user, :update?

      render inertia: "Profile/Settings", props: {
        user: current_user_payload
      }
    end

    def update
      authorize current_user, :update?

      user_attributes = profile_params.to_h.symbolize_keys

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

      if current_user.update(user_attributes)
        flash[:success] = "Profile updated successfully"
      else
        handle_update_failure
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

    def profile_params
      permitted = params.require(:user).permit(
        :name,
        :email,
        :current_password,
        :password,
        :password_confirmation
      )

      permitted[:current_password] = nil if permitted[:current_password].blank?
      permitted[:password] = nil if permitted[:password].blank?
      permitted[:password_confirmation] = nil if permitted[:password_confirmation].blank?
      permitted
    end
  end
end

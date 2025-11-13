# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  include InertiaRails::Controller

  # Share data to all Inertia pages
  inertia_share do
    {
      auth: {
        user: current_user&.as_json(only: [ :id, :name, :email ])
      },
      flash: {
        success: flash[:success],
        error: flash[:error],
        notice: flash[:notice],
        alert: flash[:alert]
      },
      errors: session.delete(:errors) || {}
    }
  end

  # Add user_id to lograge
  def append_info_to_payload(payload)
    super
    payload[:user_id] = current_user&.id
    payload[:user_email] = current_user&.email if current_user
    payload[:request_id] = request.uuid
    payload[:host] = request.host
    payload[:remote_ip] = request.remote_ip
    payload[:ip] = request.ip
    payload[:x_forwarded_for] = request.headers["X-Forwarded-For"]
  end

  # Helper for current user (implement later with auth)
  def current_user
    nil # TODO: Implement authentication
  end
end

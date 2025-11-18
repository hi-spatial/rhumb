class DeviseFailureApp < Devise::FailureApp
  def respond
    if inertia_request?
      inertia_redirect
    else
      super
    end
  end

  def http_auth?
    if inertia_request?
      false
    else
      super
    end
  end

  def skip_format?
    if inertia_request?
      request_format.to_s == "js"
    else
      super
    end
  end

  def is_navigational_format?
    if inertia_request?
      true
    else
      super
    end
  end

  private

  def inertia_request?
    request.headers["X-Inertia"].present?
  end

  def inertia_redirect
    store_location!
    flash[:alert] = i18n_message
    redirect_to redirect_url, allow_other_host: false, status: :see_other
  end
end

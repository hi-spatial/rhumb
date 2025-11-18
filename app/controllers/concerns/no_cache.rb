module NoCache
  extend ActiveSupport::Concern

  included do
    before_action :prevent_http_cache
  end

  private

  def prevent_http_cache
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
  end
end


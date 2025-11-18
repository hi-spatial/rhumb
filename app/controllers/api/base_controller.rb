# frozen_string_literal: true

module Api
  class BaseController < ApplicationController
    skip_before_action :verify_authenticity_token, if: :json_request?
    before_action :set_json_format

    private

    def set_json_format
      request.format = :json
    end

    def json_request?
      request.format.json?
    end

    def user_not_authorized
      render json: { error: "Not authorized" }, status: :forbidden
    end
  end
end


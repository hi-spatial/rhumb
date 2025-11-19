# frozen_string_literal: true

class AnalysisController < ApplicationController
  before_action :authenticate_user!

  def index
    authorize :analysis
    render inertia: "Analysis/Index", props: {
      ai_providers: User.ai_providers.keys
    }
  end

  def history
    authorize :analysis
    render inertia: "Analysis/History"
  end
end

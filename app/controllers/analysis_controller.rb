# frozen_string_literal: true

class AnalysisController < ApplicationController
  before_action :authenticate_user!

  def index
    authorize :analysis
    render inertia: "Analysis/Index"
  end
end


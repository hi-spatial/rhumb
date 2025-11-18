# frozen_string_literal: true

class AnalysisPolicy < ApplicationPolicy
  def index?
    authenticated?
  end
end

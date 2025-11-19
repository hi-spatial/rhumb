# frozen_string_literal: true

class AnalysisPolicy < ApplicationPolicy
  def index?
    authenticated?
  end

  def history?
    authenticated?
  end
end

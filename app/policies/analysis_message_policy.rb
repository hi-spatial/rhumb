# frozen_string_literal: true

class AnalysisMessagePolicy < ApplicationPolicy
  def index?
    authenticated? && record.analysis_session.user_id == user.id
  end

  def show?
    authenticated? && record.analysis_session.user_id == user.id
  end

  def create?
    authenticated? && record.analysis_session.user_id == user.id
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user
        scope.joins(:analysis_session).where(analysis_sessions: { user_id: user.id })
      else
        scope.none
      end
    end
  end
end


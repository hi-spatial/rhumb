# frozen_string_literal: true

class AnalysisSessionPolicy < ApplicationPolicy
  def index?
    authenticated?
  end

  def show?
    authenticated? && record.user_id == user.id
  end

  def create?
    authenticated?
  end

  def update?
    authenticated? && record.user_id == user.id
  end

  def destroy?
    authenticated? && record.user_id == user.id
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user
        scope.where(user: user)
      else
        scope.none
      end
    end
  end
end

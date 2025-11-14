class DashboardPolicy < ApplicationPolicy
  def index?
    authenticated?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end

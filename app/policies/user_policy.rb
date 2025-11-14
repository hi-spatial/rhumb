class UserPolicy < ApplicationPolicy
  def index?
    admin?
  end

  def show?
    admin? || user == record
  end

  def create?
    admin?
  end

  def update?
    admin? || user == record
  end

  def destroy?
    admin?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user&.admin?
        scope.all
      else
        scope.where(id: user&.id)
      end
    end
  end
end

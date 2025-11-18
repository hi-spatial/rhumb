# frozen_string_literal: true

class AnalysisMessage < ApplicationRecord
  belongs_to :analysis_session

  enum :role, {
    user: "user",
    assistant: "assistant",
    system: "system"
  }

  validates :role, presence: true
  validates :content, presence: true

  scope :ordered, -> { order(created_at: :asc) }
end

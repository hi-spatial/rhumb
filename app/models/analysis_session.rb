# frozen_string_literal: true

class AnalysisSession < ApplicationRecord
  belongs_to :user
  has_many :analysis_messages, dependent: :destroy

  enum :ai_provider, {
    openai: "openai",
    gemini: "gemini",
    perplexity: "perplexity",
    custom: "custom"
  }, validate: true

  enum :analysis_type, {
    heat_island: "heat_island",
    land_cover: "land_cover",
    land_cover_change: "land_cover_change",
    air_pollution: "air_pollution"
  }

  enum :status, {
    pending: "pending",
    processing: "processing",
    completed: "completed",
    failed: "failed"
  }

  validates :analysis_type, presence: true
  validates :area_of_interest, presence: true
  validates :ai_provider, presence: true
  validate :area_of_interest_is_valid_geojson

  scope :recent, -> { order(created_at: :desc) }

  before_validation :assign_default_ai_provider

  private

  def assign_default_ai_provider
    self.ai_provider ||= user&.ai_provider || "openai"
  end

  def area_of_interest_is_valid_geojson
    return if area_of_interest.blank?

    unless area_of_interest.is_a?(Hash) && area_of_interest["type"].present?
      errors.add(:area_of_interest, "must be a valid GeoJSON object")
    end
  end
end

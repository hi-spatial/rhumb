class AiProviderSetting < ApplicationRecord
  belongs_to :user

  enum :ai_provider, {
    openai: "openai",
    gemini: "gemini",
    custom: "custom"
  }, validate: true

  store_accessor :ai_metadata, :openai_model, :gemini_model, :custom_model, :custom_endpoint

  validates :custom_endpoint, presence: true, if: :custom_endpoint_required?
  validate :api_key_present_when_required

  def ai_metadata
    super || {}
  end

  def requires_personal_key?
    custom?
  end

  def ai_api_key_present?
    ai_api_key.present?
  end

  def effective_api_key
    ai_api_key.presence || env_api_key_for_provider
  end

  private

  def api_key_present_when_required
    return unless requires_personal_key?

    errors.add(:ai_api_key, "must be provided for custom providers") if ai_api_key.blank?
  end

  def custom_endpoint_required?
    custom? && custom_endpoint.blank? && ENV["DEFAULT_CUSTOM_AI_ENDPOINT"].blank?
  end

  def env_api_key_for_provider
    case ai_provider
    when "openai"
      ENV["OPENAI_API_KEY"]
    when "gemini"
      ENV["GOOGLE_GEMINI_API_KEY"]
    end
  end
end

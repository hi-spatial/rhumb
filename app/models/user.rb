class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_one :ai_provider_setting, dependent: :destroy

  enum :role, { user: 0, admin: 1 }

  has_many :analysis_sessions, dependent: :destroy

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true

  after_create :ensure_ai_provider_setting

  delegate :ai_provider, :ai_provider=,
           :ai_api_key, :ai_api_key=,
           :ai_metadata, :ai_metadata=,
           :openai_model, :openai_model=,
           :gemini_model, :gemini_model=,
           :custom_model, :custom_model=,
           :custom_endpoint, :custom_endpoint=,
           :requires_personal_key?, :ai_api_key_present?,
           :effective_api_key,
           to: :ai_provider_configuration

  def self.ai_providers
    AiProviderSetting.ai_providers
  end

  private

  def ai_provider_configuration
    ai_provider_setting || build_ai_provider_setting(ai_provider: "openai", ai_metadata: {})
  end

  def ensure_ai_provider_setting
    create_ai_provider_setting!(ai_provider: "openai", ai_metadata: {}) unless ai_provider_setting
  end
end

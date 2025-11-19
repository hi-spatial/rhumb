require "test_helper"
require "minitest/mock"

class AiProviderFactoryTest < ActiveSupport::TestCase
  def setup
    @user = users(:one)
    # Ensure ai_provider_setting exists and has empty metadata
    setting = @user.ai_provider_setting || @user.create_ai_provider_setting!(ai_provider: "openai", ai_metadata: {})
    setting.update!(ai_metadata: {}) if setting.ai_metadata.present?
  end

  test "builds openai provider with env fallback" do
    previous_key = ENV["OPENAI_API_KEY"]
    ENV["OPENAI_API_KEY"] = "env-openai-token"

    provider = AiProviderFactory.for(user: @user, provider: :openai)

    assert_instance_of AiProviders::OpenAi, provider
    assert_equal "env-openai-token", provider.instance_variable_get(:@api_key)
  ensure
    ENV["OPENAI_API_KEY"] = previous_key
  end

  test "builds gemini provider with user key override" do
    # Update ai_provider_setting since ai_provider is now stored there
    setting = @user.ai_provider_setting || @user.create_ai_provider_setting!(ai_provider: "gemini", ai_metadata: {})
    setting.update!(ai_provider: :gemini, ai_metadata: { "gemini_model" => "gemini-1.5-pro" })
    @user.reload

    @user.stub(:ai_api_key, "user-key") do
      provider = AiProviderFactory.for(user: @user)

      assert_instance_of AiProviders::Gemini, provider
      assert_equal "user-key", provider.instance_variable_get(:@api_key)
      assert_equal "gemini-1.5-pro", provider.instance_variable_get(:@options)[:model]
    end
  end

  test "raises error when custom provider missing configuration" do
    # Update the ai_provider_setting directly since ai_provider is now stored there
    setting = @user.ai_provider_setting || @user.create_ai_provider_setting!(ai_provider: "custom", ai_metadata: {})
    setting.update_columns(ai_provider: "custom", ai_api_key: nil, ai_metadata: {})
    @user.reload
    
    assert_raises(AiProviders::Error) do
      AiProviderFactory.for(user: @user)
    end
  end
end

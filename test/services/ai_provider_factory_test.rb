require "test_helper"
require "minitest/mock"

class AiProviderFactoryTest < ActiveSupport::TestCase
  def setup
    @user = users(:one)
    @user.update!(ai_metadata: {})
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
    @user.update!(ai_provider: :gemini, ai_metadata: { "gemini_model" => "gemini-1.5-pro" })

    @user.stub(:ai_api_key, "user-key") do
      provider = AiProviderFactory.for(user: @user)

      assert_instance_of AiProviders::Gemini, provider
      assert_equal "user-key", provider.instance_variable_get(:@api_key)
      assert_equal "gemini-1.5-pro", provider.instance_variable_get(:@options)[:model]
    end
  end

  test "raises error when custom provider missing configuration" do
    @user.update_columns(ai_provider: "custom", ai_metadata: {})

    assert_raises(AiProviders::Error) do
      @user.stub(:ai_api_key, nil) do
        AiProviderFactory.for(user: @user)
      end
    end
  end
end

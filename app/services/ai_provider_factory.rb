class AiProviderFactory
  def self.for(user:, provider: nil)
    provider_key = (provider || user.ai_provider).to_s
    config = build_config(user, provider_key)

    provider_class = case provider_key
    when "openai"
      AiProviders::OpenAi
    when "gemini"
      AiProviders::Gemini
    when "perplexity"
      AiProviders::Perplexity
    when "custom"
      AiProviders::CustomHttp
    else
      raise AiProviders::Error, "Unsupported AI provider: #{provider_key}"
    end

    provider_class.new(api_key: config.fetch(:api_key), options: config.fetch(:options))
  end

  def self.build_config(user, provider_key)
    metadata = user.ai_metadata || {}

    case provider_key
    when "openai"
      {
        api_key: user.ai_api_key.presence || ENV["OPENAI_API_KEY"],
        options: {
          model: metadata["openai_model"]
        }
      }
    when "gemini"
      {
        api_key: user.ai_api_key.presence || ENV["GOOGLE_GEMINI_API_KEY"],
        options: {
          model: metadata["gemini_model"]
        }
      }
    when "perplexity"
      {
        api_key: user.ai_api_key.presence || ENV["PERPLEXITY_API_KEY"],
        options: {
          model: metadata["perplexity_model"]
        }
      }
    when "custom"
      endpoint = user.custom_endpoint.presence || ENV["DEFAULT_CUSTOM_AI_ENDPOINT"]
      {
        api_key: user.ai_api_key.presence,
        options: {
          model: metadata["custom_model"],
          endpoint: endpoint
        }
      }
    else
      raise AiProviders::Error, "Unsupported AI provider: #{provider_key}"
    end
  end
end

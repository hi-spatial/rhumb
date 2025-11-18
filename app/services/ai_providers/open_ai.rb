module AiProviders
  class OpenAi < Base
    DEFAULT_MODEL = "gpt-4o-mini"

    def chat(messages:, model: nil, temperature: DEFAULT_TEMPERATURE)
      response = client.post("/v1/chat/completions") do |req|
        req.headers["Authorization"] = "Bearer #{api_key}"
        req.headers["Content-Type"] = "application/json"
        req.body = {
          model: model || options[:model] || DEFAULT_MODEL,
          messages: messages,
          temperature: temperature,
          stream: false
        }.to_json
      end

      raise Error, "API request failed: #{response.status}" unless response.success?

      body = response.body.is_a?(String) ? JSON.parse(response.body) : response.body
      body.dig("choices", 0, "message", "content")
    rescue Faraday::Error => e
      raise Error, "Network error: #{e.message}"
    rescue JSON::ParserError => e
      raise Error, "Invalid response: #{e.message}"
    end

    private

    def client
      @client ||= faraday_client(url: "https://api.openai.com")
    end
  end
end

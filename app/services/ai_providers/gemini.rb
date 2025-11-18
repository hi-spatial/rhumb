module AiProviders
  class Gemini < Base
    DEFAULT_MODEL = "gemini-1.5-flash"

    def chat(messages:, model: nil, temperature: DEFAULT_TEMPERATURE)
      system_instruction, content_messages = extract_system_instruction(messages)

      response = client.post("/v1beta/models/#{model || options[:model] || DEFAULT_MODEL}:generateContent") do |req|
        req.params["key"] = api_key
        req.headers["Content-Type"] = "application/json"
        req.body = {
          systemInstruction: system_instruction,
          contents: content_messages,
          generationConfig: {
            temperature: temperature
          }
        }.to_json
      end

      raise Error, "API request failed: #{response.status}" unless response.success?

      body = response.body.is_a?(String) ? JSON.parse(response.body) : response.body
      body.dig("candidates", 0, "content", "parts", 0, "text")
    rescue Faraday::Error => e
      raise Error, "Network error: #{e.message}"
    rescue JSON::ParserError => e
      raise Error, "Invalid response: #{e.message}"
    end

    private

    def client
      @client ||= faraday_client(url: "https://generativelanguage.googleapis.com")
    end

    def extract_system_instruction(messages)
      system_messages, other_messages = messages.partition { |msg| msg[:role] == "system" }

      system_instruction = if system_messages.any?
        {
          parts: system_messages.map { |msg| { text: msg[:content] } }
        }
      end

      formatted_messages = other_messages.map do |message|
        {
          role: map_role(message[:role]),
          parts: [
            { text: message[:content] }
          ]
        }
      end

      [ system_instruction, formatted_messages ]
    end

    def map_role(role)
      case role
      when "assistant"
        "model"
      else
        "user"
      end
    end
  end
end

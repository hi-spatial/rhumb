module AiProviders
  class Perplexity < Base
    DEFAULT_MODEL = "sonar-pro"

    def chat(messages:, model: nil, temperature: DEFAULT_TEMPERATURE)
      normalized_messages = normalize_messages(messages)

      response = client.post("/chat/completions") do |req|
        req.headers["Authorization"] = "Bearer #{api_key}"
        req.body = {
          model: model || options[:model] || DEFAULT_MODEL,
          messages: normalized_messages,
          temperature: temperature
        }
      end

      unless response.success?
        error_body = response.body.is_a?(String) ? JSON.parse(response.body) : response.body rescue response.body
        error_message = error_body.is_a?(Hash) && error_body["error"] ? error_body["error"]["message"] : error_body.to_s
        raise Error, "API request failed (#{response.status}): #{error_message}"
      end

      body = response.body.is_a?(String) ? JSON.parse(response.body) : response.body
      body.dig("choices", 0, "message", "content")
    rescue Faraday::Error => e
      raise Error, "Network error: #{e.message}"
    rescue JSON::ParserError => e
      raise Error, "Invalid response: #{e.message}"
    end

    private

    def client
      @client ||= faraday_client(url: "https://api.perplexity.ai")
    end

    # Perplexity requires strict alternation: system messages first, then user/assistant must alternate
    # After system messages: user -> assistant -> user -> assistant -> ...
    def normalize_messages(messages)
      return messages if messages.empty?

      # Separate system messages from conversation messages
      system_messages = []
      conversation_messages = []

      messages.each do |msg|
        role = msg[:role] || msg["role"]
        content = msg[:content] || msg["content"]

        if role == "system"
          system_messages << { role: role, content: content }
        elsif role == "user" || role == "assistant"
          # Only include user and assistant roles (skip tool, etc.)
          conversation_messages << { role: role, content: content }
        end
      end

      # Merge consecutive messages of the same role to ensure alternation
      normalized_conversation = []

      conversation_messages.each do |msg|
        role = msg[:role]
        content = msg[:content]

        if normalized_conversation.empty?
          # First message - add it
          normalized_conversation << { role: role, content: content }
        elsif normalized_conversation.last[:role] == role
          # Same role as previous - merge content
          prev_content = normalized_conversation.last[:content]
          normalized_conversation[-1] = { role: role, content: "#{prev_content}\n\n#{content}" }
        else
          # Different role - add it (maintains alternation)
          normalized_conversation << { role: role, content: content }
        end
      end

      # Ensure we end with a user message (Perplexity requires user message to generate response)
      if normalized_conversation.any?
        last_role = normalized_conversation.last[:role]
        if last_role == "assistant"
          # Add a user message to trigger response
          normalized_conversation << { role: "user", content: "Please continue" }
        end
      end

      system_messages + normalized_conversation
    end
  end
end

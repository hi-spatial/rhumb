require "uri"

module AiProviders
  class CustomHttp < Base
    def chat(messages:, model: nil, temperature: DEFAULT_TEMPERATURE)
      endpoint = options[:endpoint]
      raise Error, "Custom provider endpoint missing" if endpoint.blank?

      response = faraday_client(url: endpoint_base(endpoint)).post(endpoint_path(endpoint)) do |req|
        req.headers["Authorization"] = "Bearer #{api_key}"
        req.headers["Content-Type"] = "application/json"
        req.body = {
          messages: messages,
          model: model || options[:model],
          temperature: temperature
        }.to_json
      end

      raise Error, "API request failed: #{response.status}" unless response.success?

      body = response.body.is_a?(String) ? JSON.parse(response.body) : response.body
      extract_content(body)
    rescue Faraday::Error => e
      raise Error, "Network error: #{e.message}"
    rescue JSON::ParserError => e
      raise Error, "Invalid response: #{e.message}"
    end

    private

    def endpoint_base(endpoint)
      uri = URI.parse(endpoint)
      "#{uri.scheme}://#{uri.host}#{":#{uri.port}" if uri.port && ![ 80, 443 ].include?(uri.port)}"
    end

    def endpoint_path(endpoint)
      URI.parse(endpoint).request_uri
    end

    def extract_content(body)
      if body.is_a?(Hash)
        return body.dig("choices", 0, "message", "content") if body["choices"]
        return body["content"] if body["content"].is_a?(String)
      end

      raise Error, "Custom provider response missing content"
    end
  end
end

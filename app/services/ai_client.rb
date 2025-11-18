# frozen_string_literal: true

class AiClient
  class Error < StandardError; end

  def initialize(api_key: nil)
    @api_key = api_key || ENV["OPENAI_API_KEY"]
    raise Error, "OpenAI API key not configured" if @api_key.blank?
  end

  def chat(messages:, model: "gpt-4o-mini", temperature: 0.7)
    response = faraday_client.post("/v1/chat/completions") do |req|
      req.headers["Authorization"] = "Bearer #{@api_key}"
      req.headers["Content-Type"] = "application/json"
      req.body = {
        model: model,
        messages: messages,
        temperature: temperature,
        stream: false
      }.to_json
    end

    raise Error, "API request failed: #{response.status}" unless response.success?

    body = JSON.parse(response.body)
    body.dig("choices", 0, "message", "content")
  rescue Faraday::Error => e
    raise Error, "Network error: #{e.message}"
  rescue JSON::ParserError => e
    raise Error, "Invalid response: #{e.message}"
  end

  private

  def faraday_client
    @faraday_client ||= Faraday.new(
      url: "https://api.openai.com",
      headers: {
        "User-Agent" => "GeospatialAnalysis/1.0"
      }
    ) do |f|
      f.request :json
      f.response :json
      f.adapter Faraday.default_adapter
    end
  end
end

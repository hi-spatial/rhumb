module AiProviders
  class Error < StandardError; end

  class Base
    DEFAULT_TEMPERATURE = 0.7

    def initialize(api_key:, options: {})
      @api_key = api_key
      @options = options || {}
      raise Error, "API key not configured" if @api_key.blank?
    end

    def chat(messages:, model: nil, temperature: DEFAULT_TEMPERATURE)
      raise NotImplementedError, "#{self.class.name} must implement #chat"
    end

    private

    attr_reader :api_key, :options

    def faraday_client(url:, headers: {})
      Faraday.new(
        url: url,
        headers: {
          "User-Agent" => "GeospatialAnalysis/1.0"
        }.merge(headers)
      ) do |f|
        f.request :json
        f.response :json
        f.adapter Faraday.default_adapter
      end
    end
  end
end

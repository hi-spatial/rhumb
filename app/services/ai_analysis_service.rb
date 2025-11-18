# frozen_string_literal: true

class AiAnalysisService
  DEFAULT_TEMPERATURE = 0.7

  def initialize(analysis_session:, ai_provider_client: nil)
    @analysis_session = analysis_session
    @ai_client = ai_provider_client || AiProviderFactory.for(user: analysis_session.user, provider: analysis_session.ai_provider)
  end

  def analyze(prompt:, temperature: DEFAULT_TEMPERATURE)
    area_summary = Geospatial::MapHelper.summarize_area(@analysis_session.area_of_interest)
    conversation_history = build_conversation_history

    system_prompt = build_system_prompt(area_summary)
    user_prompt = build_user_prompt(prompt, area_summary)

    messages = [
      { role: "system", content: system_prompt }
    ] + conversation_history + [
      { role: "user", content: user_prompt }
    ]

    response = @ai_client.chat(messages: messages, temperature: temperature)
    response
  rescue AiProviders::Error => e
    Rails.logger.error("AI Analysis error: #{e.message}")
    raise
  end

  private

  def build_system_prompt(area_summary)
    analysis_type_description = {
      "heat_island" => "Urban Heat Island analysis - analyzing temperature variations in urban areas",
      "land_cover" => "Land Use/Land Cover mapping - classifying land cover types",
      "land_cover_change" => "Land Use/Land Cover Change detection - detecting changes over time",
      "air_pollution" => "Air Pollution analysis - analyzing pollution patterns and trends"
    }[@analysis_session.analysis_type] || "Geospatial analysis"

    <<~PROMPT
      You are an expert geospatial analyst assistant. You help users understand and analyze geographic data.

      Current Analysis Type: #{analysis_type_description}
      Analysis Area: Center at #{area_summary[:center][:lat].round(4)}, #{area_summary[:center][:lon].round(4)}
      Area Bounds: #{area_summary[:bounds][:min_lat].round(4)} to #{area_summary[:bounds][:max_lat].round(4)} latitude,
                   #{area_summary[:bounds][:min_lon].round(4)} to #{area_summary[:bounds][:max_lon].round(4)} longitude

      Provide clear, concise, and technically accurate responses about geospatial analysis.
      When discussing the area, refer to the coordinates and geographic context.
      If asked about specific analysis types, explain what they involve and what insights they provide.
    PROMPT
  end

  def build_user_prompt(prompt, area_summary)
    <<~PROMPT
      User question: #{prompt}

      Context: The user has selected an area of interest on the map for #{@analysis_session.analysis_type} analysis.
      The selected area is centered at coordinates (#{area_summary[:center][:lat]}, #{area_summary[:center][:lon]}).
    PROMPT
  end

  def build_conversation_history
    @analysis_session.analysis_messages.ordered.map do |message|
      {
        role: message.role,
        content: message.content
      }
    end
  end
end

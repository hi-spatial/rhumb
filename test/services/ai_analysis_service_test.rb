# frozen_string_literal: true

require "test_helper"

class AiAnalysisServiceTest < ActiveSupport::TestCase
  def setup
    @user = users(:one)
    @session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: {
        "type" => "Feature",
        "geometry" => {
          "type" => "Polygon",
          "coordinates" => [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
        }
      }
    )
  end

  test "should build system prompt with area summary" do
    service = AiAnalysisService.new(analysis_session: @session)
    prompt = service.send(:build_system_prompt, {
      center: { lat: 0.5, lon: 0.5 },
      bounds: { min_lat: 0, max_lat: 1, min_lon: 0, max_lon: 1 }
    })

    assert_includes prompt, "land cover"
    assert_includes prompt, "0.5"
  end

  test "should build user prompt with context" do
    service = AiAnalysisService.new(analysis_session: @session)
    prompt = service.send(:build_user_prompt, "What is this area?", {
      center: { lat: 0.5, lon: 0.5 },
      bounds: { min_lat: 0, max_lat: 1, min_lon: 0, max_lon: 1 }
    })

    assert_includes prompt, "What is this area?"
    assert_includes prompt, "0.5"
  end

  test "should build conversation history from messages" do
    @session.analysis_messages.create!(
      role: :user,
      content: "Hello"
    )
    @session.analysis_messages.create!(
      role: :assistant,
      content: "Hi there"
    )

    service = AiAnalysisService.new(analysis_session: @session)
    history = service.send(:build_conversation_history)

    assert_equal 2, history.length
    assert_equal "user", history[0][:role]
    assert_equal "Hello", history[0][:content]
    assert_equal "assistant", history[1][:role]
    assert_equal "Hi there", history[1][:content]
  end
end


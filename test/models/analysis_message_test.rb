# frozen_string_literal: true

require "test_helper"

class AnalysisMessageTest < ActiveSupport::TestCase
  def setup
    @user = users(:one)
    @session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: {
        "type" => "Feature",
        "geometry" => {
          "type" => "Polygon",
          "coordinates" => [ [ [ 0, 0 ], [ 1, 0 ], [ 1, 1 ], [ 0, 1 ], [ 0, 0 ] ] ]
        }
      }
    )
  end

  test "should create valid analysis message" do
    message = AnalysisMessage.new(
      analysis_session: @session,
      role: :user,
      content: "Test message"
    )
    assert message.valid?
    assert message.save
  end

  test "should require analysis_session" do
    message = AnalysisMessage.new(
      role: :user,
      content: "Test message"
    )
    assert_not message.valid?
    assert_includes message.errors[:analysis_session], "must exist"
  end

  test "should require role" do
    message = AnalysisMessage.new(
      analysis_session: @session,
      content: "Test message"
    )
    assert_not message.valid?
    assert_includes message.errors[:role], "can't be blank"
  end

  test "should require content" do
    message = AnalysisMessage.new(
      analysis_session: @session,
      role: :user
    )
    assert_not message.valid?
    assert_includes message.errors[:content], "can't be blank"
  end

  test "should scope ordered messages" do
    message1 = AnalysisMessage.create!(
      analysis_session: @session,
      role: :user,
      content: "First message",
      created_at: 2.hours.ago
    )
    message2 = AnalysisMessage.create!(
      analysis_session: @session,
      role: :assistant,
      content: "Second message",
      created_at: 1.hour.ago
    )
    ordered = AnalysisMessage.ordered
    assert_equal message1.id, ordered.first.id
    assert_equal message2.id, ordered.last.id
  end
end

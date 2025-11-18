# frozen_string_literal: true

require "test_helper"

class AnalysisSessionTest < ActiveSupport::TestCase
  def setup
    @user = users(:one)
    @valid_geojson = {
      "type" => "Feature",
      "geometry" => {
        "type" => "Polygon",
        "coordinates" => [ [ [ 0, 0 ], [ 1, 0 ], [ 1, 1 ], [ 0, 1 ], [ 0, 0 ] ] ]
      }
    }
  end

  test "should create valid analysis session" do
    session = AnalysisSession.new(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: @valid_geojson
    )
    assert session.valid?
    assert session.save
  end

  test "should require user" do
    session = AnalysisSession.new(
      analysis_type: :land_cover,
      area_of_interest: @valid_geojson
    )
    assert_not session.valid?
    assert_includes session.errors[:user], "must exist"
  end

  test "should require analysis_type" do
    session = AnalysisSession.new(
      user: @user,
      area_of_interest: @valid_geojson
    )
    assert_not session.valid?
    assert_includes session.errors[:analysis_type], "can't be blank"
  end

  test "should require area_of_interest" do
    session = AnalysisSession.new(
      user: @user,
      analysis_type: :land_cover
    )
    assert_not session.valid?
    assert_includes session.errors[:area_of_interest], "can't be blank"
  end

  test "should validate area_of_interest is valid geojson" do
    session = AnalysisSession.new(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: { "invalid" => "data" }
    )
    assert_not session.valid?
    assert_includes session.errors[:area_of_interest], "must be a valid GeoJSON object"
  end

  test "should have default status of pending" do
    session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: @valid_geojson
    )
    assert_equal "pending", session.status
  end

  test "should have many analysis_messages" do
    session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: @valid_geojson
    )
    message = session.analysis_messages.create!(
      role: :user,
      content: "Test message"
    )
    assert_includes session.analysis_messages, message
  end

  test "should scope recent sessions" do
    session1 = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: @valid_geojson,
      created_at: 2.days.ago
    )
    session2 = AnalysisSession.create!(
      user: @user,
      analysis_type: :heat_island,
      area_of_interest: @valid_geojson,
      created_at: 1.day.ago
    )
    recent = AnalysisSession.recent
    assert_equal session2.id, recent.first.id
  end
end

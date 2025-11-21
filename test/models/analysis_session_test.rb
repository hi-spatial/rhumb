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
    @point_geojson = {
      "type" => "Feature",
      "geometry" => {
        "type" => "Point",
        "coordinates" => [ -0.1276, 51.5074 ]
      }
    }
    @line_geojson = {
      "type" => "Feature",
      "geometry" => {
        "type" => "LineString",
        "coordinates" => [ [ -0.1276, 51.5074 ], [ -0.1278, 51.5076 ] ]
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

  # Geometry bounds tests
  test "should calculate bounds for polygon geometry" do
    session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: @valid_geojson
    )

    bounds = session.geometry_bounds
    assert_not_nil bounds
    assert_equal 0.0, bounds[:south]
    assert_equal 1.0, bounds[:north]
    assert_equal 0.0, bounds[:west]
    assert_equal 1.0, bounds[:east]
    assert_equal [ 0.0, 0.0 ], bounds[:southwest]
    assert_equal [ 1.0, 1.0 ], bounds[:northeast]
  end

  test "should calculate bounds for point geometry" do
    session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: @point_geojson
    )

    bounds = session.geometry_bounds
    assert_not_nil bounds
    assert_equal 51.5074, bounds[:south]
    assert_equal 51.5074, bounds[:north]
    assert_equal(-0.1276, bounds[:west])
    assert_equal(-0.1276, bounds[:east])
    assert_equal [ 51.5074, -0.1276 ], bounds[:southwest]
    assert_equal [ 51.5074, -0.1276 ], bounds[:northeast]
  end

  test "should calculate bounds for line geometry" do
    session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: @line_geojson
    )

    bounds = session.geometry_bounds
    assert_not_nil bounds
    assert_equal 51.5074, bounds[:south]
    assert_equal 51.5076, bounds[:north]
    assert_equal(-0.1278, bounds[:west])
    assert_equal(-0.1276, bounds[:east])
  end

  test "should return nil bounds for invalid geometry" do
    session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: {
        "type" => "Feature",
        "geometry" => {
          "type" => "InvalidType",
          "coordinates" => []
        }
      }
    )

    assert_nil session.geometry_bounds
  end

  test "should return nil bounds for missing geometry" do
    session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: { "type" => "Feature" }
    )

    assert_nil session.geometry_bounds
  end

  # Geometry center tests
  test "should calculate center for polygon geometry" do
    session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: @valid_geojson
    )

    center = session.geometry_center
    assert_not_nil center
    assert_equal [ 0.5, 0.5 ], center
  end

  test "should calculate center for point geometry" do
    session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: @point_geojson
    )

    center = session.geometry_center
    assert_not_nil center
    assert_equal [ -0.1276, 51.5074 ], center
  end

  test "should return nil center for invalid geometry" do
    session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: { "type" => "Feature" }
    )

    assert_nil session.geometry_center
  end

  # Geometry type tests
  test "should identify point geometry" do
    session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: @point_geojson
    )

    assert session.point_geometry?
    assert_equal "Point", session.geometry_type
  end

  test "should identify polygon geometry" do
    session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: @valid_geojson
    )

    assert_not session.point_geometry?
    assert_equal "Polygon", session.geometry_type
  end

  test "should identify line geometry" do
    session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: @line_geojson
    )

    assert_not session.point_geometry?
    assert_equal "LineString", session.geometry_type
  end

  # Geometry area tests
  test "should calculate area for polygon geometry" do
    session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: @valid_geojson
    )

    area = session.geometry_area_km2
    assert_not_nil area
    assert area > 0
    # 1 degree x 1 degree square ≈ 12321 km² (111 km/degree)²
    assert_in_delta 12321, area, 1000
  end

  test "should return nil area for point geometry" do
    session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: @point_geojson
    )

    assert_nil session.geometry_area_km2
  end

  test "should return nil area for line geometry" do
    session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: @line_geojson
    )

    assert_nil session.geometry_area_km2
  end

  # Geometry description tests
  test "should provide description for point geometry" do
    session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: @point_geojson
    )

    assert_equal "Point location", session.geometry_description
  end

  test "should provide description for line geometry" do
    session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: @line_geojson
    )

    description = session.geometry_description
    assert_includes description, "Line"
    assert_includes description, "km"
  end

  test "should provide description for polygon geometry" do
    session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: @valid_geojson
    )

    description = session.geometry_description
    assert_includes description, "Polygon"
    assert_includes description, "km²"
  end

  test "should provide description for small polygon in square meters" do
    small_polygon = {
      "type" => "Feature",
      "geometry" => {
        "type" => "Polygon",
        "coordinates" => [ [ [ 0, 0 ], [ 0.001, 0 ], [ 0.001, 0.001 ], [ 0, 0.001 ], [ 0, 0 ] ] ]
      }
    }

    session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: small_polygon
    )

    description = session.geometry_description
    assert_includes description, "Polygon"
    assert_includes description, "m²"
  end

  test "should handle unknown geometry type" do
    session = AnalysisSession.create!(
      user: @user,
      analysis_type: :land_cover,
      area_of_interest: { "type" => "Feature" }
    )

    assert_equal "Unknown geometry", session.geometry_description
  end
end

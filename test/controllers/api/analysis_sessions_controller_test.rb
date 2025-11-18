# frozen_string_literal: true

require "test_helper"

module Api
  class AnalysisSessionsControllerTest < ActionDispatch::IntegrationTest
    def setup
      @user = users(:one)
      sign_in @user
      @valid_geojson = {
        "type" => "Feature",
        "geometry" => {
          "type" => "Polygon",
          "coordinates" => [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
        }
      }
    end

    test "should get index" do
      get api_analysis_sessions_path
      assert_response :success
      json = JSON.parse(response.body)
      assert json.key?("analysis_sessions")
    end

    test "should create analysis session" do
      assert_difference("AnalysisSession.count", 1) do
        post api_analysis_sessions_path, params: {
          analysis_session: {
            analysis_type: "land_cover",
            area_of_interest: @valid_geojson
          }
        }
      end
      assert_response :created
      json = JSON.parse(response.body)
      assert json.key?("analysis_session")
      assert_equal "land_cover", json["analysis_session"]["analysis_type"]
    end

    test "should show analysis session" do
      session = AnalysisSession.create!(
        user: @user,
        analysis_type: :land_cover,
        area_of_interest: @valid_geojson
      )
      get api_analysis_session_path(session)
      assert_response :success
      json = JSON.parse(response.body)
      assert json.key?("analysis_session")
      assert json.key?("messages")
    end

    test "should not show other user's session" do
      other_user = users(:two)
      session = AnalysisSession.create!(
        user: other_user,
        analysis_type: :land_cover,
        area_of_interest: @valid_geojson
      )
      get api_analysis_session_path(session)
      assert_response :forbidden
    end

    test "should update analysis session" do
      session = AnalysisSession.create!(
        user: @user,
        analysis_type: :land_cover,
        area_of_interest: @valid_geojson
      )
      patch api_analysis_session_path(session), params: {
        analysis_session: {
          analysis_type: "heat_island"
        }
      }
      assert_response :success
      session.reload
      assert_equal "heat_island", session.analysis_type
    end

    test "should destroy analysis session" do
      session = AnalysisSession.create!(
        user: @user,
        analysis_type: :land_cover,
        area_of_interest: @valid_geojson
      )
      assert_difference("AnalysisSession.count", -1) do
        delete api_analysis_session_path(session)
      end
      assert_response :no_content
    end
  end
end


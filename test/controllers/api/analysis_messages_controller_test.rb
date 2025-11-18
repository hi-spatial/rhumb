# frozen_string_literal: true

require "test_helper"

module Api
  class AnalysisMessagesControllerTest < ActionDispatch::IntegrationTest
    def setup
      @user = users(:one)
      sign_in @user
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

    test "should get index" do
      get api_analysis_session_analysis_messages_path(@session)
      assert_response :success
      json = JSON.parse(response.body)
      assert json.key?("messages")
    end

    test "should create analysis message" do
      assert_difference("AnalysisMessage.count", 1) do
        post api_analysis_session_analysis_messages_path(@session), params: {
          analysis_message: {
            content: "What is this area?"
          }
        }
      end
      assert_response :created
      json = JSON.parse(response.body)
      assert json.key?("message")
      assert_equal "user", json["message"]["role"]
      assert_equal "What is this area?", json["message"]["content"]
    end

    test "should not create message for other user's session" do
      other_user = users(:two)
      other_session = AnalysisSession.create!(
        user: other_user,
        analysis_type: :land_cover,
        area_of_interest: {
          "type" => "Feature",
          "geometry" => {
            "type" => "Polygon",
            "coordinates" => [ [ [ 0, 0 ], [ 1, 0 ], [ 1, 1 ], [ 0, 1 ], [ 0, 0 ] ] ]
          }
        }
      )
      post api_analysis_session_analysis_messages_path(other_session), params: {
        analysis_message: {
          content: "Test"
        }
      }
      assert_response :forbidden
    end
  end
end

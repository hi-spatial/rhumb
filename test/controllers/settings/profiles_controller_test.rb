# frozen_string_literal: true

require "test_helper"

module Settings
  class ProfilesControllerTest < ActionDispatch::IntegrationTest
    setup do
      @user = users(:one)
      @user.update!(password: "old-password", password_confirmation: "old-password")
    end

    test "requires authentication" do
      get settings_profile_path
      assert_redirected_to new_user_session_path
    end

    test "renders profile page for signed-in user" do
      sign_in @user

      get settings_profile_path

      assert_response :success
    end

    test "updates basic profile attributes" do
      sign_in @user

      patch settings_profile_path, params: {
        user: {
          name: "Updated Name",
          email: "updated@example.com"
        }
      }

      assert_redirected_to settings_profile_path
      @user.reload
      assert_equal "Updated Name", @user.name
      assert_equal "updated@example.com", @user.email
    end

    # Note: AI settings are now handled by Settings::AiProvidersController
    # This test has been removed as AI settings are no longer part of profile settings


    test "persists validation errors when update fails" do
      sign_in @user

      patch settings_profile_path, params: {
        user: {
          email: ""
        }
      }

      assert_redirected_to settings_profile_path
      @user.reload
      assert_not_nil flash[:error]
      assert_not_equal "", @user.email
    end

    test "updates password when current password matches" do
      sign_in @user

      patch settings_profile_path, params: {
        user: {
          current_password: "old-password",
          password: "new-password-123",
          password_confirmation: "new-password-123"
        }
      }

      assert_redirected_to settings_profile_path
      @user.reload
      assert @user.valid_password?("new-password-123")
    end

    test "rejects password change without current password" do
      sign_in @user

      patch settings_profile_path, params: {
        user: {
          password: "another-password",
          password_confirmation: "another-password"
        }
      }

      assert_redirected_to settings_profile_path
      @user.reload
      assert_not_nil flash[:error]
      assert @user.valid_password?("old-password")
    end

    test "rejects password change with incorrect current password" do
      sign_in @user

      patch settings_profile_path, params: {
        user: {
          current_password: "wrong-password",
          password: "another-password",
          password_confirmation: "another-password"
        }
      }

      assert_redirected_to settings_profile_path
      @user.reload
      assert_not_nil flash[:error]
      assert @user.valid_password?("old-password")
    end

    test "rejects password change when confirmation does not match" do
      sign_in @user

      patch settings_profile_path, params: {
        user: {
          current_password: "old-password",
          password: "another-password",
          password_confirmation: "mismatch-password"
        }
      }

      assert_redirected_to settings_profile_path
      @user.reload
      assert_not_nil flash[:error]
      assert @user.valid_password?("old-password")
    end
  end
end

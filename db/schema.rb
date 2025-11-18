# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2025_11_18_133040) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "ai_provider_settings", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.text "ai_api_key"
    t.jsonb "ai_metadata", default: {}, null: false
    t.string "ai_provider", default: "openai", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "user_id", null: false
    t.index ["user_id"], name: "index_ai_provider_settings_on_user_id", unique: true
  end

  create_table "analysis_messages", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "analysis_session_id", null: false
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.jsonb "payload", default: {}
    t.string "role", null: false
    t.datetime "updated_at", null: false
    t.index ["analysis_session_id"], name: "index_analysis_messages_on_analysis_session_id"
    t.index ["role"], name: "index_analysis_messages_on_role"
  end

  create_table "analysis_sessions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "ai_provider", default: "openai", null: false
    t.string "analysis_type", null: false
    t.jsonb "area_of_interest", null: false
    t.datetime "created_at", null: false
    t.jsonb "metadata", default: {}
    t.jsonb "provider_metadata", default: {}, null: false
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.uuid "user_id", null: false
    t.index ["analysis_type"], name: "index_analysis_sessions_on_analysis_type"
    t.index ["status"], name: "index_analysis_sessions_on_status"
    t.index ["user_id"], name: "index_analysis_sessions_on_user_id"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "name", null: false
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.integer "role", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "ai_provider_settings", "users"
  add_foreign_key "analysis_messages", "analysis_sessions"
  add_foreign_key "analysis_sessions", "users"
end

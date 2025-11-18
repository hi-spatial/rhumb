# frozen_string_literal: true

class CreateAnalysisSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :analysis_sessions, id: :uuid do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid, index: true
      t.string :analysis_type, null: false
      t.string :status, default: "pending", null: false
      t.jsonb :area_of_interest, null: false
      t.jsonb :metadata, default: {}
      t.timestamps null: false
    end

    add_index :analysis_sessions, :status
    add_index :analysis_sessions, :analysis_type
  end
end

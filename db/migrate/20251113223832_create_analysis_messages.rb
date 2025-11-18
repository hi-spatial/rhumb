# frozen_string_literal: true

class CreateAnalysisMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :analysis_messages, id: :uuid do |t|
      t.references :analysis_session, null: false, foreign_key: true, type: :uuid, index: true
      t.string :role, null: false
      t.text :content, null: false
      t.jsonb :payload, default: {}
      t.timestamps null: false
    end

    add_index :analysis_messages, :role
  end
end


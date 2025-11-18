class CreateAiProviderSettings < ActiveRecord::Migration[8.1]
  def up
    create_table :ai_provider_settings, id: :uuid do |t|
      t.uuid :user_id, null: false
      t.string :ai_provider, null: false, default: "openai"
      t.text :ai_api_key
      t.jsonb :ai_metadata, null: false, default: {}
      t.timestamps
    end

    add_index :ai_provider_settings, :user_id, unique: true
    add_foreign_key :ai_provider_settings, :users

    execute <<~SQL.squish
      INSERT INTO ai_provider_settings (id, user_id, ai_provider, ai_metadata, created_at, updated_at)
      SELECT gen_random_uuid(), id, ai_provider, ai_metadata, NOW(), NOW() FROM users
    SQL

    remove_column :users, :ai_api_key_ciphertext
    remove_column :users, :ai_metadata
    remove_column :users, :ai_provider
  end

  def down
    add_column :users, :ai_provider, :string, null: false, default: "openai"
    add_column :users, :ai_metadata, :jsonb, null: false, default: {}
    add_column :users, :ai_api_key_ciphertext, :text

    drop_table :ai_provider_settings
  end
end

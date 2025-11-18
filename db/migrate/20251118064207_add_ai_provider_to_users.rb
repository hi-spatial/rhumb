class AddAiProviderToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :ai_provider, :string, null: false, default: "openai"
    add_column :users, :ai_api_key_ciphertext, :text
    add_column :users, :ai_metadata, :jsonb, null: false, default: {}
  end
end

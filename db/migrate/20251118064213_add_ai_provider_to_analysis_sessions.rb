class AddAiProviderToAnalysisSessions < ActiveRecord::Migration[8.1]
  def change
    add_column :analysis_sessions, :ai_provider, :string, null: false, default: "openai"
    add_column :analysis_sessions, :provider_metadata, :jsonb, null: false, default: {}
  end
end

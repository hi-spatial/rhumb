class CreateSquads < ActiveRecord::Migration[8.1]
  def change
    create_table :squads do |t|
      # t.references :user, null: false, foreign_key: true
      t.decimal :budget
      t.integer :total_points

      t.timestamps
    end
  end
end

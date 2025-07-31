class CreateListings < ActiveRecord::Migration[8.0]
  def change
    create_table :listings do |t|
      t.string :title
      t.string :address

      t.timestamps
    end
  end
end

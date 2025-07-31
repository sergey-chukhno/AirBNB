class Listing < ApplicationRecord
  extend FriendlyId
  friendly_id :title, use: :slugged

  has_rich_text :description
  has_many_attached :images
end

json.extract! listing, :id, :title, :address, :description, :images, :created_at, :updated_at
json.url listing_url(listing, format: :json)
json.description listing.description.to_s
json.images do
  json.array!(listing.images) do |image|
    json.id image.id
    json.url url_for(image)
  end
end

# frozen_string_literal: true

class AnalysisSession < ApplicationRecord
  belongs_to :user
  has_many :analysis_messages, dependent: :destroy

  enum :ai_provider, {
    openai: "openai",
    gemini: "gemini",
    perplexity: "perplexity",
    custom: "custom"
  }, validate: true

  enum :analysis_type, {
    heat_island: "heat_island",
    land_cover: "land_cover",
    land_cover_change: "land_cover_change",
    air_pollution: "air_pollution"
  }

  enum :status, {
    pending: "pending",
    processing: "processing",
    completed: "completed",
    failed: "failed"
  }

  validates :analysis_type, presence: true
  validates :area_of_interest, presence: true
  validates :ai_provider, presence: true
  validate :area_of_interest_is_valid_geojson

  scope :recent, -> { order(created_at: :desc) }

  before_validation :assign_default_ai_provider

  # Calculate bounding box for the area of interest
  # @return [Hash, nil] Bounding box with south, north, west, east coordinates
  def geometry_bounds
    return nil unless area_of_interest.present? && area_of_interest.is_a?(Hash)

    geometry = area_of_interest["geometry"]
    return nil unless geometry.present?

    case geometry["type"]
    when "Point"
      coordinates = geometry["coordinates"]
      return nil unless coordinates.is_a?(Array) && coordinates.length >= 2

      lng, lat = coordinates[0], coordinates[1]
      {
        south: lat,
        north: lat,
        west: lng,
        east: lng,
        southwest: [ lat, lng ],
        northeast: [ lat, lng ]
      }
    when "LineString"
      coordinates = geometry["coordinates"]
      return nil unless coordinates.is_a?(Array) && coordinates.any?

      calculate_bounds_from_coordinates(coordinates)
    when "Polygon"
      coordinates = geometry["coordinates"]
      return nil unless coordinates.is_a?(Array) && coordinates.any?

      # Use the exterior ring (first array)
      exterior_ring = coordinates[0]
      return nil unless exterior_ring.is_a?(Array) && exterior_ring.any?

      calculate_bounds_from_coordinates(exterior_ring)
    else
      nil
    end
  end

  # Get the center point of the geometry
  # @return [Array, nil] [lng, lat] coordinates of the center
  def geometry_center
    bounds = geometry_bounds
    return nil unless bounds

    if bounds[:south] == bounds[:north] && bounds[:west] == bounds[:east]
      # Single point
      [ bounds[:west], bounds[:south] ]
    else
      # Calculate center of bounding box
      center_lng = (bounds[:west] + bounds[:east]) / 2.0
      center_lat = (bounds[:south] + bounds[:north]) / 2.0
      [ center_lng, center_lat ]
    end
  end

  # Check if the geometry is a single point
  # @return [Boolean]
  def point_geometry?
    area_of_interest.dig("geometry", "type") == "Point"
  end

  # Get the geometry type
  # @return [String, nil]
  def geometry_type
    area_of_interest.dig("geometry", "type")
  end

  # Calculate the approximate area of the geometry in square kilometers
  # @return [Float, nil] Area in square kilometers, nil for points and lines
  def geometry_area_km2
    return nil unless area_of_interest.present? && geometry_type == "Polygon"

    coordinates = area_of_interest.dig("geometry", "coordinates", 0)
    return nil unless coordinates.is_a?(Array) && coordinates.length >= 4

    # Use shoelace formula for polygon area calculation
    # This is an approximation that works reasonably well for small areas
    area_deg2 = shoelace_area(coordinates)

    # Convert from square degrees to square kilometers (very rough approximation)
    # 1 degree ≈ 111 km at equator
    area_deg2 * (111.0 ** 2)
  end

  # Get a human-readable description of the geometry
  # @return [String]
  def geometry_description
    case geometry_type
    when "Point"
      "Point location"
    when "LineString"
      bounds = geometry_bounds
      if bounds
        distance = approximate_distance_km(bounds[:southwest], bounds[:northeast])
        "Line (≈#{distance.round(1)} km)"
      else
        "Line"
      end
    when "Polygon"
      area = geometry_area_km2
      if area && area > 0
        if area < 1
          "Polygon (≈#{(area * 1000).round(0)} m²)"
        else
          "Polygon (≈#{area.round(1)} km²)"
        end
      else
        "Polygon"
      end
    else
      geometry_type || "Unknown geometry"
    end
  end

  private

  def assign_default_ai_provider
    self.ai_provider ||= user&.ai_provider || "openai"
  end

  def area_of_interest_is_valid_geojson
    return if area_of_interest.blank?

    unless area_of_interest.is_a?(Hash) && area_of_interest["type"].present?
      errors.add(:area_of_interest, "must be a valid GeoJSON object")
    end
  end

  # Calculate bounds from an array of coordinates
  # @param coordinates [Array] Array of [lng, lat] coordinate pairs
  # @return [Hash, nil] Bounding box hash
  def calculate_bounds_from_coordinates(coordinates)
    return nil unless coordinates.is_a?(Array) && coordinates.any?

    lngs = []
    lats = []

    coordinates.each do |coord|
      next unless coord.is_a?(Array) && coord.length >= 2
      lngs << coord[0].to_f
      lats << coord[1].to_f
    end

    return nil if lngs.empty? || lats.empty?

    {
      south: lats.min,
      north: lats.max,
      west: lngs.min,
      east: lngs.max,
      southwest: [ lats.min, lngs.min ],
      northeast: [ lats.max, lngs.max ]
    }
  end

  # Calculate polygon area using shoelace formula
  # @param coordinates [Array] Array of [lng, lat] coordinate pairs
  # @return [Float] Area in square degrees
  def shoelace_area(coordinates)
    return 0.0 unless coordinates.is_a?(Array) && coordinates.length >= 3

    area = 0.0
    n = coordinates.length - 1 # Exclude the closing coordinate

    (0...n).each do |i|
      j = (i + 1) % n
      area += coordinates[i][0] * coordinates[j][1]
      area -= coordinates[j][0] * coordinates[i][1]
    end

    (area / 2.0).abs
  end

  # Approximate distance between two points using Haversine formula
  # @param point1 [Array] [lat, lng] of first point
  # @param point2 [Array] [lat, lng] of second point
  # @return [Float] Distance in kilometers
  def approximate_distance_km(point1, point2)
    return 0.0 unless point1.is_a?(Array) && point2.is_a?(Array)
    return 0.0 unless point1.length >= 2 && point2.length >= 2

    lat1, lng1 = point1[0], point1[1]
    lat2, lng2 = point2[0], point2[1]

    # Haversine formula
    r = 6371 # Earth's radius in kilometers

    dlat = Math::PI * (lat2 - lat1) / 180
    dlng = Math::PI * (lng2 - lng1) / 180

    a = Math.sin(dlat / 2) * Math.sin(dlat / 2) +
        Math.cos(Math::PI * lat1 / 180) * Math.cos(Math::PI * lat2 / 180) *
        Math.sin(dlng / 2) * Math.sin(dlng / 2)

    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    r * c
  end
end

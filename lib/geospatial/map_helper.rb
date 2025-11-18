# frozen_string_literal: true

module Geospatial
  class MapHelper
    def self.extract_bounds(geojson)
      return nil unless geojson.is_a?(Hash)

      coordinates = extract_coordinates(geojson)
      return nil if coordinates.empty?

      lons = coordinates.map { |coord| coord[0] }
      lats = coordinates.map { |coord| coord[1] }

      {
        min_lon: lons.min,
        max_lon: lons.max,
        min_lat: lats.min,
        max_lat: lats.max,
        center: {
          lon: (lons.min + lons.max) / 2,
          lat: (lats.min + lats.max) / 2
        }
      }
    end

    def self.extract_coordinates(geojson)
      coordinates = []
      case geojson["type"]
      when "Point"
        coordinates << geojson["coordinates"]
      when "LineString", "MultiPoint"
        coordinates.concat(geojson["coordinates"])
      when "Polygon", "MultiLineString"
        geojson["coordinates"].each do |ring|
          coordinates.concat(ring)
        end
      when "MultiPolygon"
        geojson["coordinates"].each do |polygon|
          polygon.each do |ring|
            coordinates.concat(ring)
          end
        end
      when "Feature"
        return extract_coordinates(geojson["geometry"])
      when "FeatureCollection"
        geojson["features"].each do |feature|
          coordinates.concat(extract_coordinates(feature["geometry"]))
        end
      end
      coordinates
    end

    def self.summarize_area(geojson)
      bounds = extract_bounds(geojson)
      return "Unknown area" unless bounds

      center = bounds[:center]
      width = bounds[:max_lon] - bounds[:min_lon]
      height = bounds[:max_lat] - bounds[:min_lat]

      {
        center: center,
        bounds: bounds,
        approximate_size: {
          width_degrees: width,
          height_degrees: height
        }
      }
    end
  end
end

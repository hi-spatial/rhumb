# frozen_string_literal: true

require 'net/http'
require 'json'

class GeocodingService
  class GeocodingError < StandardError; end
  class RateLimitError < GeocodingError; end
  class ServiceUnavailableError < GeocodingError; end

  NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'
  DEFAULT_TIMEOUT = 10
  DEFAULT_LIMIT = 5

  def initialize(timeout: DEFAULT_TIMEOUT)
    @timeout = timeout
  end

  # Search for locations using Nominatim
  # @param query [String] The search query
  # @param limit [Integer] Maximum number of results to return
  # @param country_codes [Array<String>] Optional country codes to limit search
  # @return [Array<Hash>] Array of location results
  def search(query, limit: DEFAULT_LIMIT, country_codes: nil)
    raise ArgumentError, 'Query cannot be blank' if query.blank?
    raise ArgumentError, 'Limit must be positive' if limit <= 0

    params = build_search_params(query, limit, country_codes)
    response = make_request('/search', params)
    
    parse_search_results(response)
  rescue Net::TimeoutError, Net::OpenTimeout
    raise ServiceUnavailableError, 'Geocoding service timeout'
  rescue JSON::ParserError
    raise GeocodingError, 'Invalid response from geocoding service'
  end

  # Reverse geocode coordinates to get location information
  # @param lat [Float] Latitude
  # @param lng [Float] Longitude
  # @return [Hash, nil] Location information or nil if not found
  def reverse_geocode(lat, lng)
    raise ArgumentError, 'Invalid coordinates' unless valid_coordinates?(lat, lng)

    params = {
      lat: lat,
      lon: lng,
      format: 'json',
      addressdetails: 1,
      zoom: 18
    }

    response = make_request('/reverse', params)
    
    if response.is_a?(Hash) && response['display_name']
      format_reverse_result(response)
    end
  rescue Net::TimeoutError, Net::OpenTimeout
    raise ServiceUnavailableError, 'Geocoding service timeout'
  rescue JSON::ParserError
    raise GeocodingError, 'Invalid response from geocoding service'
  end

  # Get detailed information about a place by OSM ID
  # @param osm_type [String] OSM type ('N' for node, 'W' for way, 'R' for relation)
  # @param osm_id [Integer] OSM ID
  # @return [Hash, nil] Place details or nil if not found
  def lookup(osm_type, osm_id)
    raise ArgumentError, 'Invalid OSM type' unless %w[N W R].include?(osm_type)
    raise ArgumentError, 'Invalid OSM ID' unless osm_id.is_a?(Integer) && osm_id > 0

    params = {
      osm_ids: "#{osm_type}#{osm_id}",
      format: 'json',
      addressdetails: 1,
      extratags: 1
    }

    response = make_request('/lookup', params)
    
    if response.is_a?(Array) && response.any?
      format_lookup_result(response.first)
    end
  rescue Net::TimeoutError, Net::OpenTimeout
    raise ServiceUnavailableError, 'Geocoding service timeout'
  rescue JSON::ParserError
    raise GeocodingError, 'Invalid response from geocoding service'
  end

  private

  def build_search_params(query, limit, country_codes)
    params = {
      q: query,
      format: 'json',
      limit: [limit, 50].min, # Cap at 50 to prevent abuse
      addressdetails: 1,
      extratags: 1,
      namedetails: 1
    }

    if country_codes.present?
      params[:countrycodes] = Array(country_codes).join(',')
    end

    params
  end

  def make_request(endpoint, params)
    uri = URI("#{NOMINATIM_BASE_URL}#{endpoint}")
    uri.query = URI.encode_www_form(params)

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.read_timeout = @timeout
    http.open_timeout = @timeout

    request = Net::HTTP::Get.new(uri)
    request['User-Agent'] = build_user_agent

    response = http.request(request)

    case response.code.to_i
    when 200
      JSON.parse(response.body)
    when 429
      raise RateLimitError, 'Rate limit exceeded'
    when 500..599
      raise ServiceUnavailableError, 'Geocoding service unavailable'
    else
      raise GeocodingError, "HTTP #{response.code}: #{response.message}"
    end
  end

  def build_user_agent
    app_name = Rails.application.class.module_parent_name
    "#{app_name}/1.0 (#{Rails.env})"
  end

  def parse_search_results(results)
    return [] unless results.is_a?(Array)

    results.map { |result| format_search_result(result) }.compact
  end

  def format_search_result(result)
    return nil unless result.is_a?(Hash)

    {
      place_id: result['place_id']&.to_i,
      osm_type: result['osm_type'],
      osm_id: result['osm_id']&.to_i,
      display_name: result['display_name'],
      name: extract_name(result),
      type: result['type'],
      class: result['class'],
      importance: result['importance']&.to_f,
      coordinates: {
        lat: result['lat']&.to_f,
        lng: result['lon']&.to_f
      },
      bounding_box: parse_bounding_box(result['boundingbox']),
      address: result['address'] || {},
      extra_tags: result['extratags'] || {}
    }
  end

  def format_reverse_result(result)
    {
      place_id: result['place_id']&.to_i,
      osm_type: result['osm_type'],
      osm_id: result['osm_id']&.to_i,
      display_name: result['display_name'],
      name: extract_name(result),
      type: result['type'],
      class: result['class'],
      coordinates: {
        lat: result['lat']&.to_f,
        lng: result['lon']&.to_f
      },
      address: result['address'] || {}
    }
  end

  def format_lookup_result(result)
    format_search_result(result)
  end

  def extract_name(result)
    return result['name'] if result['name'].present?
    return result['namedetails']['name'] if result.dig('namedetails', 'name').present?
    
    # Fallback to first part of display_name
    result['display_name']&.split(',')&.first&.strip
  end

  def parse_bounding_box(bbox)
    return nil unless bbox.is_a?(Array) && bbox.length == 4

    # Nominatim returns [south, north, west, east]
    south, north, west, east = bbox.map(&:to_f)
    {
      south: south,
      north: north,
      west: west,
      east: east,
      southwest: [south, west],
      northeast: [north, east]
    }
  end

  def valid_coordinates?(lat, lng)
    lat.is_a?(Numeric) && lng.is_a?(Numeric) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
  end
end

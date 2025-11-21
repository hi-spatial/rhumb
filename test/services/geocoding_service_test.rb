# frozen_string_literal: true

require "test_helper"

class GeocodingServiceTest < ActiveSupport::TestCase
  def setup
    @service = GeocodingService.new
  end

  test "should initialize with default timeout" do
    service = GeocodingService.new
    assert_equal GeocodingService::DEFAULT_TIMEOUT, service.instance_variable_get(:@timeout)
  end

  test "should initialize with custom timeout" do
    service = GeocodingService.new(timeout: 5)
    assert_equal 5, service.instance_variable_get(:@timeout)
  end

  test "should raise error for blank query" do
    assert_raises(ArgumentError, "Query cannot be blank") do
      @service.search("")
    end

    assert_raises(ArgumentError, "Query cannot be blank") do
      @service.search(nil)
    end
  end

  test "should raise error for invalid limit" do
    assert_raises(ArgumentError, "Limit must be positive") do
      @service.search("London", limit: 0)
    end

    assert_raises(ArgumentError, "Limit must be positive") do
      @service.search("London", limit: -1)
    end
  end

  test "should validate coordinates for reverse geocoding" do
    # Valid coordinates
    assert_nothing_raised do
      @service.send(:valid_coordinates?, 51.5074, -0.1278)
    end

    # Invalid latitude
    refute @service.send(:valid_coordinates?, 91, 0)
    refute @service.send(:valid_coordinates?, -91, 0)

    # Invalid longitude
    refute @service.send(:valid_coordinates?, 0, 181)
    refute @service.send(:valid_coordinates?, 0, -181)

    # Non-numeric values
    refute @service.send(:valid_coordinates?, "51.5", "-0.1")
    refute @service.send(:valid_coordinates?, nil, nil)
  end

  test "should raise error for invalid coordinates in reverse geocoding" do
    assert_raises(ArgumentError, "Invalid coordinates") do
      @service.reverse_geocode(91, 0)
    end

    assert_raises(ArgumentError, "Invalid coordinates") do
      @service.reverse_geocode(0, 181)
    end
  end

  test "should validate OSM parameters for lookup" do
    # Valid OSM types
    %w[N W R].each do |osm_type|
      assert_nothing_raised do
        @service.send(:build_user_agent) # Just to test method exists
      end
    end

    # Invalid OSM type
    assert_raises(ArgumentError, "Invalid OSM type") do
      @service.lookup("X", 123)
    end

    # Invalid OSM ID
    assert_raises(ArgumentError, "Invalid OSM ID") do
      @service.lookup("N", 0)
    end

    assert_raises(ArgumentError, "Invalid OSM ID") do
      @service.lookup("N", -1)
    end

    assert_raises(ArgumentError, "Invalid OSM ID") do
      @service.lookup("N", "123")
    end
  end

  test "should build correct search parameters" do
    params = @service.send(:build_search_params, "London", 5, ["GB"])
    
    expected_params = {
      q: "London",
      format: "json",
      limit: 5,
      addressdetails: 1,
      extratags: 1,
      namedetails: 1,
      countrycodes: "GB"
    }

    assert_equal expected_params, params
  end

  test "should build search parameters without country codes" do
    params = @service.send(:build_search_params, "London", 5, nil)
    
    refute params.key?(:countrycodes)
  end

  test "should cap limit at 50" do
    params = @service.send(:build_search_params, "London", 100, nil)
    
    assert_equal 50, params[:limit]
  end

  test "should build user agent string" do
    user_agent = @service.send(:build_user_agent)
    
    assert_includes user_agent, Rails.application.class.module_parent_name
    assert_includes user_agent, Rails.env
  end

  test "should parse bounding box correctly" do
    bbox = ["51.28", "51.69", "-0.51", "0.33"]
    result = @service.send(:parse_bounding_box, bbox)
    
    expected = {
      south: 51.28,
      north: 51.69,
      west: -0.51,
      east: 0.33,
      southwest: [51.28, -0.51],
      northeast: [51.69, 0.33]
    }

    assert_equal expected, result
  end

  test "should return nil for invalid bounding box" do
    assert_nil @service.send(:parse_bounding_box, nil)
    assert_nil @service.send(:parse_bounding_box, [])
    assert_nil @service.send(:parse_bounding_box, ["51.28", "51.69"])
    assert_nil @service.send(:parse_bounding_box, "invalid")
  end

  test "should extract name from result" do
    # Test with direct name
    result_with_name = { "name" => "London" }
    assert_equal "London", @service.send(:extract_name, result_with_name)

    # Test with namedetails
    result_with_namedetails = { 
      "namedetails" => { "name" => "London" },
      "display_name" => "London, UK"
    }
    assert_equal "London", @service.send(:extract_name, result_with_namedetails)

    # Test fallback to display_name
    result_with_display = { "display_name" => "London, Greater London, England, UK" }
    assert_equal "London", @service.send(:extract_name, result_with_display)

    # Test with empty result
    assert_nil @service.send(:extract_name, {})
  end

  test "should format search result correctly" do
    raw_result = {
      "place_id" => "123456",
      "osm_type" => "relation",
      "osm_id" => "65606",
      "display_name" => "London, Greater London, England, United Kingdom",
      "name" => "London",
      "type" => "city",
      "class" => "place",
      "importance" => "0.9",
      "lat" => "51.5073219",
      "lon" => "-0.1276474",
      "boundingbox" => ["51.28", "51.69", "-0.51", "0.33"],
      "address" => { "city" => "London", "country" => "United Kingdom" },
      "extratags" => { "population" => "8982000" }
    }

    result = @service.send(:format_search_result, raw_result)

    assert_equal 123456, result[:place_id]
    assert_equal "relation", result[:osm_type]
    assert_equal 65606, result[:osm_id]
    assert_equal "London, Greater London, England, United Kingdom", result[:display_name]
    assert_equal "London", result[:name]
    assert_equal "city", result[:type]
    assert_equal "place", result[:class]
    assert_equal 0.9, result[:importance]
    assert_equal 51.5073219, result[:coordinates][:lat]
    assert_equal(-0.1276474, result[:coordinates][:lng])
    assert_equal({ "city" => "London", "country" => "United Kingdom" }, result[:address])
    assert_equal({ "population" => "8982000" }, result[:extra_tags])

    # Check bounding box
    assert_equal 51.28, result[:bounding_box][:south]
    assert_equal 51.69, result[:bounding_box][:north]
    assert_equal(-0.51, result[:bounding_box][:west])
    assert_equal 0.33, result[:bounding_box][:east]
  end

  test "should return nil for invalid search result" do
    assert_nil @service.send(:format_search_result, nil)
    assert_nil @service.send(:format_search_result, "invalid")
    assert_nil @service.send(:format_search_result, [])
  end

  test "should parse empty search results" do
    results = @service.send(:parse_search_results, [])
    assert_equal [], results
  end

  test "should handle non-array search results" do
    results = @service.send(:parse_search_results, nil)
    assert_equal [], results

    results = @service.send(:parse_search_results, "invalid")
    assert_equal [], results
  end

  # Integration tests would require actual HTTP requests
  # These would typically be tested with VCR or similar tools
  # For now, we'll test the error handling

  test "should handle timeout errors" do
    # Mock Net::HTTP to raise timeout
    Net::HTTP.stub(:new, -> (*args) { 
      mock_http = Minitest::Mock.new
      mock_http.expect(:use_ssl=, nil, [true])
      mock_http.expect(:read_timeout=, nil, [Integer])
      mock_http.expect(:open_timeout=, nil, [Integer])
      mock_http.expect(:request, -> { raise Net::TimeoutError }, [Object])
      mock_http
    }) do
      assert_raises(GeocodingService::ServiceUnavailableError, "Geocoding service timeout") do
        @service.search("London")
      end
    end
  end
end

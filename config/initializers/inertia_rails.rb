# config/initializers/inertia_rails.rb
InertiaRails.configure do |config|
  # Inertia version (for cache busting)
  config.version = ViteRuby.digest

  # Set default layout
  config.layout = "application"

  # Always include errors hash in responses (required for InertiaRails 4.0)
  config.always_include_errors_hash = true
end

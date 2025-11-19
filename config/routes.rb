Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Devise routes with custom controllers
  devise_for :users, controllers: {
    registrations: "users/registrations",
    sessions: "users/sessions"
  }

  # Avo admin panel (only accessible to admins)
  authenticate :user, ->(u) { u.admin? } do
    mount_avo
  end

  # Dashboard routes (protected)
  get "/dashboard", to: "dashboards#index", as: :dashboard
  get "/analysis", to: "analysis#index", as: :analysis
  get "/analysis/history", to: "analysis#history", as: :analysis_history

  # API routes (protected)
  namespace :api do
    resources :analysis_sessions, only: %i[index show create update destroy] do
      resources :analysis_messages, only: %i[index show create]
    end
  end

  namespace :settings do
    resource :ai_provider, only: %i[show update], path: "ai", controller: "ai_providers"
    resource :profile, only: %i[show update], controller: "profiles"
  end

  # Chrome DevTools Protocol
  get "/.well-known/appspecific/com.chrome.devtools.json", to: proc { [ 204, {}, [] ] }

  # Root route points to dashboard (redirects to login if not authenticated)
  root to: "dashboards#index"
end

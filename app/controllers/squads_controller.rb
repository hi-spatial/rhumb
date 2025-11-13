# app/controllers/squads_controller.rb
class SquadsController < ApplicationController
  def show
    # Mock data for now (implement auth & real data later)
    squad = mock_squad
    available_players = mock_players

    render inertia: "Squad/Show", props: {
      squad: squad,
      available_players: available_players
    }
  end

  def update
    # Handle squad update
    sleep 1 # Simulate processing

    redirect_to squad_path, success: "Squad saved successfully!"
  end

  private

  def mock_squad
    {
      id: 1,
      user_id: 1,
      budget: 23.5,
      total_points: 145,
      players: [
        {
          id: 1,
          name: "Alisson",
          team_name: "Liverpool",
          position: "GK",
          price: 5.5,
          points: 45,
          avatar_url: "https://via.placeholder.com/100"
        },
        # Add 14 more mock players...
        {
          id: 2,
          name: "Salah",
          team_name: "Liverpool",
          position: "MID",
          price: 13.0,
          points: 89,
          avatar_url: "https://via.placeholder.com/100"
        }
        # ... more players
      ] + Array.new(13) do |i|
        {
          id: i + 3,
          name: "Player #{i + 3}",
          team_name: "Team",
          position: [ "DEF", "MID", "FWD" ].sample,
          price: rand(4.0..10.0).round(1),
          points: rand(0..50),
          avatar_url: "https://via.placeholder.com/100"
        }
      end
    }
  end

  def mock_players
    Array.new(20) do |i|
      {
        id: i + 100,
        name: "Available Player #{i + 1}",
        team_name: [ "Arsenal", "Chelsea", "Man City" ].sample,
        position: [ "GK", "DEF", "MID", "FWD" ].sample,
        price: rand(4.0..13.0).round(1),
        points: rand(0..100),
        avatar_url: "https://via.placeholder.com/100"
      }
    end
  end
end

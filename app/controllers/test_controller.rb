class TestController < ApplicationController
  def index
    render inertia: "Test/Index"
  end
end

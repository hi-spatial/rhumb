# frozen_string_literal: true

# Pagy configuration
# See https://github.com/ddnexus/pagy/blob/master/lib/config/pagy.rb for all options

Pagy::DEFAULT[:items] = 10 # items per page
Pagy::DEFAULT[:size] = [1, 4, 4, 1] # page size: [*first, *before, *current, *after, *last]
Pagy::DEFAULT[:page_param] = :page # page parameter name
Pagy::DEFAULT[:max_items] = 100 # max items per page


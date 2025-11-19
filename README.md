# Rhumb

A modern Rails application built with React, TypeScript, and Inertia.js for geospatial AI analysis.

## About

Rhumb is a full-stack web application that enables interactive geospatial analysis powered by AI. Users can select areas on an interactive map, choose from various analysis types, and chat with AI assistants to gain insights about geographic regions.

### Tech Stack

**Backend:**
- Rails 8.1.1
- PostgreSQL (with UUID primary keys)
- Devise for authentication
- Pundit for authorization
- Avo admin panel
- Solid Queue, Solid Cache, Solid Cable

**Frontend:**
- React 19.2.0 with TypeScript
- Inertia.js
- Tailwind CSS v4
- Shadcn UI
- MapLibre GL for mapping
- React Hook Form + Zod for forms

## Prerequisites

- Ruby 3.4.7 (see `.ruby-version`)
- PostgreSQL
- Node.js
- Yarn 4.11.0

## Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd rhumb
   ```

2. **Install dependencies:**
   ```bash
   bundle install
   yarn install
   ```

3. **Set up the database:**
   ```bash
   bin/rails db:create
   bin/rails db:migrate
   ```
   
   Or use the setup script:
   ```bash
   bin/setup
   ```

4. **Configure environment variables:**
   ```bash
   # Edit Rails credentials for database configuration
   EDITOR="code --wait" bin/rails credentials:edit
   
   # Optional: Set up API keys for AI features
   export OPENAI_API_KEY=your_openai_api_key_here
   export GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. **Create a user (optional):**
   ```bash
   bin/rails console
   ```
   ```ruby
   User.create!(
     name: "Admin User",
     email: "admin@example.com",
     password: "password",
     password_confirmation: "password",
     role: :admin
   )
   ```

6. **Start the development server:**
   ```bash
   bin/dev
   ```

   The application will be available at `http://localhost:3000`.

## Roadmap

Coming soon.

## Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting:
   ```bash
   bin/rails test
   bin/rubocop
   yarn lint
   ```
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

Please ensure your code follows the project's style guidelines and includes appropriate tests.

## License

This project is open source and available under the [MIT License](LICENSE).

Copyright (c) 2024 Rhumb

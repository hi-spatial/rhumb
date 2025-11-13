# Anvil

A modern Rails application built with React, TypeScript, and Inertia.js.

## Tech Stack

- **Backend**: Rails 8.1.1
- **Frontend**: React 19.2.0 with TypeScript
- **Database**: PostgreSQL
- **Asset Pipeline**: Vite
- **Styling**: Tailwind CSS
- **Full-Stack Framework**: Inertia.js
- **Deployment**: Kamal

## Prerequisites

- Ruby 3.4.7 (see `.ruby-version`)
- PostgreSQL
- Node.js (for Yarn 4.11.0)
- Yarn package manager

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd anvil
   ```

2. Install Ruby dependencies:
   ```bash
   bundle install
   ```

3. Install JavaScript dependencies:
   ```bash
   yarn install
   ```

4. Set up the database:
   ```bash
   bin/rails db:create
   bin/rails db:migrate
   ```

   Or use the setup script:
   ```bash
   bin/setup
   ```

### Running the Application

Start the development server:
```bash
bin/dev
```

This will start both the Rails server and Vite dev server concurrently.

The application will be available at `http://localhost:3000`.

## Development

### Code Quality

#### RuboCop

This project uses [RuboCop Rails Omakase](https://github.com/rails/rubocop-rails-omakase) for Ruby code style enforcement.

Run RuboCop:
```bash
bin/rubocop
```

Auto-correct offenses:
```bash
bin/rubocop -A
```

#### Security Scanning

Run security audits:
```bash
# Scan for security vulnerabilities in gems
bin/bundler-audit

# Static analysis for Rails security vulnerabilities
bin/brakeman --no-pager
```

### Running Tests

Run the test suite:
```bash
bin/rails test
bin/rails test:system
```

### Database

Create and migrate the database:
```bash
bin/rails db:create
bin/rails db:migrate
```

Reset the database (development only):
```bash
bin/rails db:reset
```

### Frontend Development

The frontend code is located in `app/frontend/`:
- `entrypoints/` - Application entry points
- `Pages/` - React page components
- `styles/` - CSS and Tailwind styles
- `types/` - TypeScript type definitions

Vite handles hot module replacement during development.

## Configuration

### Database

Database configuration is managed through `config/database.yml`. Credentials are stored in Rails encrypted credentials.

Edit credentials:
```bash
EDITOR="code --wait" bin/rails credentials:edit
```

### Environment Variables

Set up your environment variables as needed. The application uses Rails encrypted credentials for sensitive configuration.

## Services

This application uses Rails' built-in database-backed adapters:

- **Solid Cache** - Database-backed cache store
- **Solid Queue** - Database-backed job queue
- **Solid Cable** - Database-backed Action Cable adapter

These services use separate PostgreSQL databases in production (configured in `config/database.yml`).

## Deployment

This application is configured for deployment with [Kamal](https://kamal-deploy.org).

Deploy to production:
```bash
bin/kamal deploy
```

See `config/deploy.yml` for deployment configuration.

## CI/CD

The project includes GitHub Actions workflows for:
- Code linting (RuboCop)
- Security scanning (Brakeman, bundler-audit)
- Test suite execution

Run the full CI suite locally:
```bash
bin/ci
```

## Additional Tools

- **Solargraph** - Ruby language server for IDE support
- **HTMLBeautifier** - HTML formatter
- **Debug** - Ruby debugger

## License

[Add your license information here]

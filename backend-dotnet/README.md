# .NET Backend for Arm Wrestling Training App

This is a .NET 8 Web API alternative to the Supabase backend. The mobile app currently uses Supabase, but this .NET backend can be used as an alternative backend.

## Important Note

**The mobile app is currently configured to use Supabase directly.** This .NET backend is provided as an alternative implementation for those who prefer to use .NET instead of Supabase's services.

## Architecture

This backend provides:
- RESTful API endpoints for all app functionality
- JWT-based authentication (compatible with Supabase auth or can be standalone)
- PostgreSQL database (can connect to same database as Supabase or separate)
- Role-based authorization (Premium vs Free users)

## Prerequisites

- .NET 8 SDK
- PostgreSQL 14+
- Visual Studio 2022 or VS Code with C# extension

## Project Structure

```
backend-dotnet/
├── ArmWrestlingApi/
│   ├── Controllers/          # API endpoints
│   ├── Models/              # Entity models
│   ├── DTOs/                # Data transfer objects
│   ├── Data/                # DbContext and migrations
│   ├── Services/            # Business logic
│   ├── Middleware/          # Custom middleware
│   └── Program.cs           # App entry point
├── ArmWrestlingApi.sln      # Solution file
└── README.md
```

## Database Schema

The database schema matches the current Supabase implementation:

- **profiles** - User profiles (linked to Supabase auth.users or custom users table)
  - Includes: weight_unit preference, profile_picture, avatar_url
- **workouts** - Training session records
  - Includes: workout_type, duration_minutes, intensity, notes, cycle_id
- **cycles** - Training cycle periods
  - Includes: name, cycle_type, start_date, end_date, description, is_active
- **strength_tests** - Strength assessment records
  - Includes: test_type, result (numeric), notes
- **goals** - User training goals
  - Includes: goal_type, target_value, current_value, deadline, is_completed
- **scheduled_trainings** - Scheduled training sessions
  - Includes: title, description, scheduled_date, scheduled_time, notification_enabled, notification_minutes_before, notification_id, completed
- **body_measurements** - Body measurement tracking
  - Includes: weight, arm_circumference, forearm_circumference, wrist_circumference, notes, measured_at

## Setup Instructions

### 1. Configure Environment Variables

**Important**: Never commit sensitive credentials to version control!

Copy the example configuration file:

```bash
cp appsettings.example.json appsettings.json
```

Edit `appsettings.json` with your values:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=your-server.com;Port=5432;Database=postgres;Username=postgres;Password=your_password_here;SSL Mode=Require;Trust Server Certificate=true"
  },
  "Supabase": {
    "Url": "https://your-server.com:8000",
    "AnonKey": "your_supabase_anon_key_here",
    "ServiceRoleKey": "your_supabase_service_role_key_here"
  },
  "Jwt": {
    "Key": "your-super-secret-jwt-key-at-least-32-characters-long-minimum-256-bits",
    "Issuer": "ArmWrestlingApi",
    "Audience": "ArmWrestlingApp",
    "ExpiresInDays": 30
  },
  "Kestrel": {
    "Endpoints": {
      "Http": {
        "Url": "http://0.0.0.0:5000"
      }
    }
  }
}
```

**For Self-Hosted Supabase:**
- Use your self-hosted Supabase URL (e.g., `https://your-server.com:8000`)
- Use your PostgreSQL connection details
- Get your API keys from Supabase dashboard

**For Cloud Supabase:**
- Use `https://your-project.supabase.co`
- Get connection string from Supabase project settings

### 2. Run Locally

```bash
# Restore packages
dotnet restore

# Run the API
dotnet run
```

The API will be available at `http://localhost:5000`.

Access Swagger UI at: `http://localhost:5000`

### 3. Running with Docker

#### Option A: Using Docker CLI

Build the Docker image:

```bash
docker build -t armwrestling-api .
```

Run the container:

```bash
docker run -d \
  -p 5000:5000 \
  -e ConnectionStrings__DefaultConnection="Host=your-server.com;Port=5432;Database=postgres;Username=postgres;Password=your_password" \
  -e Supabase__Url="https://your-server.com:8000" \
  -e Supabase__AnonKey="your_anon_key" \
  -e Supabase__ServiceRoleKey="your_service_role_key" \
  -e Jwt__Key="your_jwt_secret_key_minimum_256_bits" \
  --name armwrestling-api \
  armwrestling-api
```

#### Option B: Using Docker Compose

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
# Edit .env with your values
```

Start the container:

```bash
docker-compose up -d
```

Stop the container:

```bash
docker-compose down
```

View logs:

```bash
docker-compose logs -f
```

### 4. Connecting Frontend to Local Backend

Update the frontend `.env` file:

```bash
# If running locally (not Docker)
EXPO_PUBLIC_API_URL=http://localhost:5000

# If running in Docker
EXPO_PUBLIC_API_URL=http://your-server-ip:5000

# For self-hosted Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-server.com:8000
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Workouts
- `GET /api/workouts` - Get all workouts for current user
- `GET /api/workouts/{id}` - Get specific workout
- `POST /api/workouts` - Create new workout
- `PUT /api/workouts/{id}` - Update workout
- `DELETE /api/workouts/{id}` - Delete workout

### Exercises
- `GET /api/workouts/{workoutId}/exercises` - Get exercises for workout
- `POST /api/workouts/{workoutId}/exercises` - Add exercise to workout
- `PUT /api/exercises/{id}` - Update exercise
- `DELETE /api/exercises/{id}` - Delete exercise

### Cycles
- `GET /api/cycles` - Get all training cycles
- `GET /api/cycles/{id}` - Get specific cycle
- `POST /api/cycles` - Create new cycle
- `PUT /api/cycles/{id}` - Update cycle
- `DELETE /api/cycles/{id}` - Delete cycle
- `POST /api/cycles/{id}/activate` - Set cycle as active

### Strength Tests
- `GET /api/strength-tests` - Get all strength tests
- `POST /api/strength-tests` - Create new test
- `DELETE /api/strength-tests/{id}` - Delete test

### Goals
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create new goal
- `PUT /api/goals/{id}` - Update goal
- `DELETE /api/goals/{id}` - Delete goal

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Premium Features

Users with `is_premium = true` have access to:
- Unlimited workouts per cycle
- Advanced analytics
- Strength test history
- Custom exercise library

## Testing with Swagger

Navigate to `https://localhost:7000/swagger` to access the interactive API documentation.

## Deployment

### Production Deployment with Docker

For production deployment on your dedicated server:

```bash
# 1. Build the production image
docker build -t armwrestling-api:latest .

# 2. Create production .env file
cp .env.example .env
# Edit .env with production values

# 3. Run with docker-compose
docker-compose up -d

# 4. Verify the API is running
curl http://localhost:5000/swagger
```

### Setting up with Self-Hosted Supabase

1. **Install Self-Hosted Supabase** on your server following [Supabase Self-Hosting Guide](https://supabase.com/docs/guides/self-hosting)

2. **Get your Supabase credentials:**
   - Supabase URL (e.g., `https://your-server.com:8000`)
   - Anon Key (from Supabase dashboard)
   - Service Role Key (from Supabase dashboard)
   - PostgreSQL connection string

3. **Configure the .NET backend:**
   - Update `appsettings.json` or `.env` with Supabase credentials
   - Ensure database connection string points to your Supabase PostgreSQL

4. **Configure the mobile app:**
   - Update `.env` in the project root
   - Set `EXPO_PUBLIC_SUPABASE_URL` to your self-hosted instance
   - Set `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Cloud Deployment Options

- **Azure App Service** - Recommended for .NET apps
- **AWS Elastic Beanstalk** - Good for containerized apps
- **Google Cloud Run** - Serverless option
- **Railway/Render** - Simple deployment platforms
- **Your Own Server** - Use Docker Compose for full control

## Differences from Supabase Backend

| Feature | Supabase | .NET Backend |
|---------|----------|--------------|
| Auth | Built-in | Custom JWT implementation |
| Database | PostgreSQL with RLS | PostgreSQL with EF Core |
| API | Auto-generated | Manual controllers |
| Real-time | Built-in subscriptions | SignalR (optional) |
| Storage | Built-in file storage | Custom or cloud storage |
| Edge Functions | Deno runtime | C# methods |

## Migration from Supabase

To migrate the mobile app to use this backend:

1. Update API URLs in the mobile app
2. Replace Supabase auth with JWT token management
3. Update data fetching to use REST endpoints
4. Remove Supabase client library
5. Implement token refresh logic

## Security Considerations

- Use HTTPS in production
- Store JWT secret in environment variables
- Implement rate limiting
- Add CORS configuration for your mobile app
- Use parameterized queries (EF Core handles this)
- Validate all input data
- Implement proper error handling

## License

This backend is part of the Arm Wrestling Training App project.

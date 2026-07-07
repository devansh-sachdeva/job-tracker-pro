# JobTracker Pro

A premium full-stack job and internship tracking application with a stunning dark UI, built with Node.js, Express, and Supabase.

## Features

- **User Authentication**: Secure signup/login with email and password using Supabase Auth
- **Job Application Management**: Add, edit, and delete job applications with comprehensive details
- **Dashboard**: Visual overview with animated statistics and counts by status
- **Live Search & Filter**: Real-time filtering by status and search by company name
- **Premium Dark UI**: Glassmorphism cards, animated gradients, hover effects, and smooth transitions
- **Responsive Design**: Fully responsive across mobile and desktop devices

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth with JWT tokens
- **Frontend**: EJS Templates, CSS3, Vanilla JavaScript
- **Hosting**: Render-ready configuration

## Prerequisites

- Node.js 18.x or higher
- A Supabase account (free tier works)

## Environment Setup

Create a `.env` file in the root directory with:

```env
# Supabase Configuration (from your Supabase project settings)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Server Configuration
PORT=3000
NODE_ENV=production
JWT_SECRET=your_random_secret_key_at_least_32_characters_long
```

### Getting Supabase Credentials

1. Go to [Supabase](https://supabase.com) and create a new project
2. Navigate to Settings > API
3. Copy the `URL` to `SUPABASE_URL`
4. Copy the `anon public` key to `SUPABASE_ANON_KEY`
5. The database tables and RLS policies are created automatically by the migration file

## Installation

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The application will be available at `http://localhost:3000`

## Deployment on Render

### Option 1: Render Web Service

1. **Push your code to GitHub**

2. **Create a new Render Web Service**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" > "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: job-tracker (or your preferred name)
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free (or Paid)

3. **Add Environment Variables** in Render:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anon key
   - `JWT_SECRET` - A strong random string (32+ characters)
   - `NODE_ENV` - `production`

4. **Deploy**: Click "Create Web Service"

### Option 2: Using render.yaml

```yaml
services:
  - type: web
    name: job-tracker
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: JWT_SECRET
        generateValue: true
```

## Application Structure

```
.
├── index.js              # Express server and routes
├── views/
│   ├── login.ejs         # Login page
│   ├── signup.ejs        # Signup page
│   ├── dashboard.ejs     # Main dashboard
│   ├── add.ejs           # Add application form
│   ├── edit.ejs          # Edit application form
│   └── 404.ejs           # 404 error page
├── public/
│   ├── css/
│   │   ├── auth.css      # Authentication page styles
│   │   ├── dashboard.css # Dashboard styles
│   │   └── form.css      # Form page styles
│   └── js/
│       ├── particles.js  # Particle animation for auth pages
│       └── dashboard.js  # Dashboard search/filter logic
├── package.json
└── README.md
```

## Security Features

- Row Level Security (RLS) on all database tables
- Password hashing via Supabase Auth
- JWT-based session management
- HTTP-only cookies for token storage
- Input validation and sanitization

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Redirect to dashboard or login |
| GET | `/login` | Login page |
| POST | `/login` | Login handler |
| GET | `/signup` | Signup page |
| POST | `/signup` | Signup handler |
| GET | `/logout` | Logout and clear session |
| GET | `/dashboard` | Main dashboard (auth required) |
| GET | `/add` | Add application page (auth required) |
| POST | `/add` | Create new application (auth required) |
| GET | `/edit/:id` | Edit application page (auth required) |
| POST | `/edit/:id` | Update application (auth required) |
| POST | `/delete/:id` | Delete application (auth required) |
| GET | `/api/applications` | API for live search/filter (auth required) |

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

Built with modern web technologies for the modern job seeker.

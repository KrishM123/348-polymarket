# Polymarket - Sports Betting Frontend

A modern sports betting demo built with Next.js 13 App Router, TypeScript, and Tailwind CSS, integrated with a Python Flask backend.

## Features

- **Markets Listing**: Browse all available sports betting markets from the backend database
- **Live Betting**: Place bets in real-time with backend persistence and user balance tracking
- **Market Details**: View all bets placed on specific markets with user information
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Backend Integration**: Fully connected to Flask API with MySQL database

## Tech Stack

- **Framework**: Next.js 13 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API**: Next.js API routes proxying to Flask backend
- **Backend**: Python Flask with MySQL database

## Getting Started

### Prerequisites

Before running the frontend, make sure you have:
1. **Backend server** running on `http://127.0.0.1:5000`
2. **MySQL database** set up with sample data
3. **Node.js** (version 16 or higher)

### Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   - Copy `.env.example` to `.env.local`:
     ```bash
     cp env.example .env.local
     ```
   - The default configuration points to `http://127.0.0.1:5000` for the Flask backend

3. **Start the backend** (if not already running):
   ```bash
   # In the backend directory
   python app.py
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Configuration

The frontend uses the following environment variables:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
```

### Configuration Options:

1. **Backend Integration (current setup)**:
   ```
   NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
   ```
   Connects to the Python/Flask backend running on port 5000.

2. **Production**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-domain.com
   ```
   Connect to your deployed backend server.

If no environment variable is set, the app defaults to `http://localhost:3000` (self-hosted API).

## Project Structure

```
frontend/
├── app/                    # Next.js 13 App Router pages
│   ├── layout.tsx         # Root layout with navigation
│   ├── page.tsx           # Home page
│   ├── api/               # API routes (proxy to backend)
│   │   └── markets/       # Markets and bets endpoints
│   └── markets/           # Markets-related pages
│       ├── page.tsx       # Markets listing
│       └── [marketId]/    # Dynamic market pages
│           └── page.tsx   # Individual market page
├── components/            # Reusable React components
│   ├── Navigation.tsx     # Site navigation
│   └── BetForm.tsx       # Bet placement form
└── types/                # TypeScript type definitions
    └── index.ts          # Market and Bet interfaces
```

## API Integration

The frontend API routes proxy requests to the Flask backend:

- `GET /api/markets` → `GET http://127.0.0.1:5000/markets`
- `GET /api/markets/:marketId/bets` → `GET http://127.0.0.1:5000/markets/:marketId/bets`
- `POST /api/markets/:marketId/bets` → `POST http://127.0.0.1:5000/markets/:marketId/bets`

### Data Transformation

The frontend automatically transforms between the backend API format and the frontend interface:

**Backend → Frontend:**
- `mid` → `mId`
- User information (`uname`, `createdAt`) is preserved and displayed
- Error handling for missing markets and connection issues

**Frontend → Backend:**
- `podd` → `odds`
- `amt` → `amount`
- `yes` → `prediction`
- Adds default `user_id: 1` for demo purposes

## TypeScript Interfaces

### Market
```typescript
interface Market {
  mId: number;        // Market ID (maps to backend 'mid')
  name: string;       // Market name
  description?: string; // Market description
  podd: number;       // Probability/odds
  volume: number;     // Total betting volume
  end_date?: string;  // Market end date
}
```

### Bet
```typescript
interface Bet {
  bId: number;        // Bet ID
  uId: number;        // User ID
  mId: number;        // Market ID
  podd: number;       // Odds/probability
  amt: number;        // Bet amount
  yes: boolean;       // True for YES, false for NO
  uname?: string;     // Username (from backend)
  createdAt?: string; // Creation timestamp
}
```

## Development

- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Lint code**: `npm run lint`

## Backend Connection

This frontend is fully integrated with the Python/Flask backend. Features include:

- **Real-time data**: Markets and bets are fetched from the MySQL database
- **Bet placement**: Bets are stored in the database with user balance validation
- **Error handling**: Proper error messages for invalid operations
- **User information**: Displays usernames and timestamps when available

### Troubleshooting

If you see "No markets available" or connection errors:

1. **Check backend status**: Ensure Flask server is running on port 5000
2. **Verify database**: Make sure MySQL is running with populated data
3. **Check environment**: Verify `.env.local` has the correct API URL
4. **Network issues**: Ensure no firewall blocking localhost connections

## Sample Data

The backend should be populated with sample markets and users. If you see empty markets, run the backend seeding script:

```bash
# In the backend directory
python seed_database.py
```

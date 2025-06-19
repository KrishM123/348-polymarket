# Polymarket - Sports Betting Frontend

A modern sports betting demo built with Next.js 13 App Router, TypeScript, and Tailwind CSS.

## Features

- **Markets Listing**: Browse all available sports betting markets
- **Live Betting**: Place bets in real-time with instant calculations
- **Market Details**: View all bets placed on specific markets
- **Responsive Design**: Works seamlessly on desktop and mobile

## Tech Stack

- **Framework**: Next.js 13 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API**: Native fetch with REST endpoints

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── app/                    # Next.js 13 App Router pages
│   ├── layout.tsx         # Root layout with navigation
│   ├── page.tsx           # Home page
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

## API Endpoints

The frontend consumes these REST endpoints (assumed to be handled by a separate backend):

- `GET /api/markets` - Fetch all markets
- `GET /api/markets/:marketId/bets` - Fetch bets for a specific market
- `POST /api/markets/:marketId/bets` - Place a new bet

## TypeScript Interfaces

### Market
```typescript
interface Market {
  id: number;
  name: string;
  status: 'active' | 'closed' | 'pending';
  description?: string;
  created_at?: string;
}
```

### Bet
```typescript
interface Bet {
  id: number;
  user: string;
  selection: string;
  odds: number;
  stake: number;
  market_id?: number;
  created_at?: string;
}
```

## Development

- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Lint code**: `npm run lint`

## Backend Integration

This frontend is designed to work with a Python/Flask backend that serves the API endpoints listed above. Make sure your backend is running and accessible before using the application.

## Environment Variables

Create a `.env.local` file in the frontend directory to configure the API URL:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Configuration Options:

1. **Local Development (current setup)**:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```
   Uses the built-in Next.js API routes with mock data.

2. **Backend Integration**:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```
   Connect to your Python/Flask backend running on port 5000.

3. **Production**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-domain.com
   ```
   Connect to your deployed backend server.

If no environment variable is set, the app defaults to `http://localhost:3000`.

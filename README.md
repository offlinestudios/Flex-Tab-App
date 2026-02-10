# FlexTab - Workout Tracking App

A professional workout tracking application for serious lifters. Log sets, track progress, monitor body measurements, and visualize your fitness journey.

## Features

- **Workout Logging**: Track exercises, sets, reps, and weight
- **Progress Visualization**: Charts showing exercise progression over time
- **Body Measurements**: Monitor weight, chest, waist, arms, and thighs
- **Calendar View**: Visual workout history with daily summaries
- **Exercise Library**: 50+ preset exercises across all major muscle groups
- **Custom Exercises**: Add your own exercises with custom categories
- **PWA Support**: Install as a mobile app for offline access
- **Responsive Design**: Works seamlessly on desktop and mobile

## Tech Stack

**Frontend:**
- React 19
- TypeScript
- Tailwind CSS 4
- Wouter (routing)
- shadcn/ui components
- Recharts (data visualization)

**Backend:**
- Node.js + Express
- tRPC 11 (end-to-end type safety)
- Drizzle ORM
- Clerk (authentication)
- Cloudflare R2 (file storage)

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- MySQL or PostgreSQL database
- Clerk account
- Cloudflare R2 bucket

### Installation

1. Clone the repository:
```bash
git clone https://github.com/offlinestudios/Flex-Tab-App.git
cd Flex-Tab-App
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables (see **Environment Variables** section below)

4. Run database migrations:
```bash
pnpm db:push
```

5. Start the development server:
```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name

# JWT Secret
JWT_SECRET=your_random_secret

# Server
PORT=3000
NODE_ENV=development
```

## Deployment

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed deployment instructions to Railway.

### Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

1. Click the button above
2. Connect your GitHub repository
3. Add environment variables
4. Deploy!

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm test` - Run tests
- `pnpm db:push` - Push database schema changes
- `pnpm format` - Format code with Prettier

### Project Structure

```
├── client/               # Frontend React app
│   ├── public/          # Static assets
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── pages/       # Page components
│       ├── hooks/       # Custom React hooks
│       └── lib/         # Utilities and tRPC client
├── server/              # Backend Express + tRPC
│   ├── _core/          # Core server infrastructure
│   ├── routers.ts      # tRPC API routes
│   ├── db.ts           # Database queries
│   └── storage.ts      # File storage helpers
├── drizzle/            # Database schema and migrations
└── shared/             # Shared types and constants
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
- Open a GitHub issue
- Email: info@offlinestudios.com

---

Built with ❤️ by Offline Studios

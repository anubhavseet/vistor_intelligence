# Visitor Intelligence - React Frontend

A modern, high-performance React + Vite frontend for the Visitor Intelligence platform.

## 🚀 Tech Stack

- **React 18** - UI library
- **Vite** - Build tool & dev server
- **TypeScript** - Type safety
- **React Router 6** - Client-side routing
- **Apollo Client** - GraphQL client
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Framer Motion** - Animations

## 📁 Project Structure

```
frontend-react/
├── public/                    # Static assets
├── src/
│   ├── assets/               # Images, fonts
│   ├── components/           # Reusable components (13 components migrated)
│   ├── pages/                # Route components (11 pages migrated)
│   ├── lib/                  # Core utilities
│   │   ├── apollo-client.ts
│   │   └── graphql/
│   │       └── site-operations.ts
│   ├── store/                # State management
│   │   └── auth-store.ts
│   ├── App.tsx               # Main app with routes
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── .env                      # Environment variables
├── tailwind.config.js        # Tailwind configuration
├── vite.config.ts            # Vite configuration
└── package.json              # Dependencies
```

## ⚙️ Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🛣️ Routes

- `/` - Landing page with login/signup
- `/dashboard` - Main dashboard
- `/dashboard/sites` - Sites management
- `/dashboard/sites/:siteId` - Site overview
- `/dashboard/sites/:siteId/settings` - Site settings
- Plus 6 more routes...

## 🔧 Configuration

Environment variables in `.env`:
```
VITE_API_URL=http://localhost:4000
VITE_GRAPHQL_URI=http://localhost:4000/graphql
```

## 📚 Documentation

See `NEXTJS_TO_VITE_MIGRATION.md` for migration details.

---

Built with ❤️ using React + Vite

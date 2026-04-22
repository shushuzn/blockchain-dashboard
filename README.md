# Blockchain Dashboard

A modern blockchain monitoring dashboard built with Vue 3 and Node.js. Monitor ETH, Base, Arbitrum, Optimism, Solana, BSC, and Polygon chains in real-time, track DeFi protocols, and receive alerts for gas/TVL thresholds.

## Features

### Chain Monitoring
- **Multi-chain support**: Ethereum, Base, Arbitrum, Optimism, Solana, BSC, Polygon
- **Real-time metrics**: Block height, gas fees, base fee, blob fee, gas utilization
- **Historical charts**: 7-day data with multiple metric views
- **MEV tracking**: Flashbots MEV rewards (Ethereum, Arbitrum, Optimism)

### DeFi Monitoring
- **Lido TVL**: Staking metrics and APR
- **Aave/Compound**: Lending protocol TVL (planned)
- **Market data**: ETH, BTC, SOL prices via CoinGecko

### Alerts
- **Telegram notifications**: Real-time alerts via Bot
- **Email alerts**: SMTP support for email notifications
- **Configurable thresholds**: Per-chain gas/base fee/blob fee limits
- **Cooldown system**: Prevent alert spam

### Data Persistence
- **LocalStorage**: Offline-first for single-file version
- **SQLite**: Production database for history storage
- **Redis cache**: Fast API responses (production)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Vue 3)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Monitor  │ │  Charts  │ │   Meme   │ │ Dashboard    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │ API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Node.js + Express)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ History  │ │  Alerts  │ │   Lido   │ │    Meme     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│                             │                                  │
│  ┌─────────────────────────┴──────────────────────────────┐  │
│  │              SQLite / Redis                          │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Frontend Only (GitHub Pages)

Visit the live dashboard:
```
https://shushuzn.github.io/blockchain-dashboard/
```

### Full Stack (Local Development)

#### Prerequisites
- Node.js 18+
- npm or yarn
- (Optional) Redis for caching
- (Optional) onchainos CLI for meme coin data

#### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration

# Start backend
npm run dev
```

#### Frontend Setup

```bash
cd src/webapp
npm install
npm run dev
```

Open http://localhost:3000

### Docker Deployment

```bash
# Build and run
docker-compose up -d

# Or build image manually
docker build -t blockchain-dashboard .
docker run -p 8000:8000 blockchain-dashboard
```

## Project Structure

```
blockchain-dashboard/
├── multi_chain_monitor.html   # Single-file version (GitHub Pages)
├── base_monitor.html          # Base chain standalone monitor
├── meme_proxy.py              # Local meme coin proxy
│
├── backend/                   # Node.js API server
│   ├── src/
│   │   ├── config/          # Database, Redis, encryption
│   │   ├── models/           # Sequelize models
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   └── utils/            # Utilities
│   └── server.js            # Express entry point
│
├── src/
│   ├── css/                 # Legacy styles
│   ├── js/                  # Legacy scripts
│   └── webapp/              # Vue 3 application
│       ├── src/
│       │   ├── api/          # API client
│       │   ├── components/    # Vue components
│       │   ├── stores/        # Pinia stores
│       │   └── views/        # Page views
│       └── vite.config.js    # Vite configuration
│
├── DEPLOYMENT.md             # Deployment guide
└── docker-compose.yml        # Docker setup
```

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check with cache status |
| GET | `/api/history` | Get chain history data |
| POST | `/api/history` | Add history data point |
| GET | `/api/config` | Get user configuration |
| POST | `/api/config` | Save user configuration |
| POST | `/api/alerts` | Trigger alert |
| GET | `/api/lido` | Get Lido TVL metrics (cached) |
| GET | `/api/meme` | Get Solana meme coins |

### Example Response

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "cache": "connected"
}
```

## Configuration

### Environment Variables

#### Backend (.env)

```env
PORT=8000
NODE_ENV=development

# Database
DATABASE_URL=sqlite:///database.db

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Security
ENCRYPTION_KEY=your-32-char-strong-key

# onchainos CLI path (optional)
ONCHAINOS_PATH=/usr/local/bin/onchainos
```

#### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## Deployment

### GitHub Pages (Frontend Only)

1. Push code to GitHub
2. Enable GitHub Pages in repository settings
3. Select `gh-pages` branch
4. Dashboard available at: `https://username.github.io/repository/`

### Railway + GitHub Pages

1. Deploy backend to Railway
2. Set environment variables (ENCRYPTION_KEY, REDIS_URL)
3. Deploy frontend to GitHub Pages
4. Update `VITE_API_BASE_URL` to Railway URL

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Tech Stack

### Frontend
- Vue 3 with Composition API
- Pinia for state management
- Lightweight Charts for visualization
- Vite for build tooling
- Axios for API calls

### Backend
- Node.js + Express
- SQLite with Sequelize ORM
- Redis for caching
- Nodemailer for email alerts

### Infrastructure
- Docker & Docker Compose
- GitHub Actions for CI/CD
- Railway/Render for hosting

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT License - feel free to use and modify!

## Acknowledgments

- [Lightweight Charts](https://tradingview.github.io/lightweight-charts/) for charting
- [CoinGecko API](https://www.coingecko.com/) for price data
- [Flashbots](https://flashbots.net/) for MEV data
- [The Graph](https://thegraph.com/) for DeFi protocol data

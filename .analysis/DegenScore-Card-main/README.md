<div align="center">

# 🎴 DegenScore

### **The Credit Score for Crypto Degenerates**

**Your reputation is your wealth. Prove it on-chain.**

[![Solana](https://img.shields.io/badge/Solana-mainnet-blueviolet?logo=solana)](https://solana.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Anchor](https://img.shields.io/badge/Anchor-0.29-orange?logo=rust)](https://www.anchor-lang.com/)
[![Security](https://img.shields.io/badge/Security-9.5%2F10-green)](./SECURITY_AUDIT.md)
[![License](https://img.shields.io/badge/License-MIT-yellow)](./LICENSE)

[Website](https://degenscore.com) • [Whitepaper](./WHITEPAPER.md) • [Docs](./docs) • [Twitter](https://twitter.com/DegenScore) • [Discord](https://discord.gg/degenscore)

![DegenScore Banner](https://via.placeholder.com/1200x400/0F172A/00FFFF?text=DegenScore+-+Prove+Your+Edge+On-Chain)

</div>

---

## 🔥 What is DegenScore?

DegenScore transforms your Solana trading history into a **verifiable, gamified, and tradeable NFT** with a dynamic score (0-100).

Think **LinkedIn + FICO Score + Pokémon Cards** for crypto traders.

### The Problem We Solve

- ✅ **No reputation system** in crypto (whales look like noobs on-chain)
- ✅ **Influencers shill without accountability**
- ✅ **Good traders can't prove their edge**
- ✅ **Analytics tools are boring** (no incentive to use)

### Our Solution

1. **Analyze** your wallet (100k+ transactions in 30 seconds)
2. **Score** your trading skill (real P&L, win rate, moonshots, rugs)
3. **Mint** an NFT trading card (dynamic metadata, tradeable)
4. **Earn** $DEGEN tokens (rewards for skill)
5. **Compete** in weekly challenges (prize pools)
6. **Flex** on social media (proof of skill)

---

## ✨ Features

### 🎯 Professional Analytics

- **Real Profit/Loss Calculation** (FIFO position tracking)
- **Win Rate** (based on closed positions, not guesses)
- **Moonshot Detection** (100x+ gains)
- **Rug Detection** (-90%+ losses)
- **Diamond Hands Score** (30+ day holds)
- **Volatility Analysis** (risk score)
- **Favorite Tokens** (most traded)
- **Trading Streaks** (win/loss streaks)

### 🎮 Gamification

- **DegenScore (0-100)** - Your ultimate reputation metric
- **Dynamic NFTs** - Updates as you trade better
- **Badges & Achievements** - Unlock via milestones
- **Daily Check-ins** - Build streaks, earn XP
- **Weekly Challenges** - Compete for prizes
- **Leaderboards** - Global rankings by score/volume/win rate

### 💰 Tokenomics

- **$DEGEN Token** - Native utility token (1B supply)
- **Earn by Trading** - Daily quests, referrals, achievements
- **Stake for Perks** - 2x-5x reward multipliers
- **Burn Mechanism** - 5% of transfers burned
- **Multi-Level Referrals** - Earn from 3 levels deep

### 🔒 Enterprise Security

- **9.5/10 Security Score** ([Audit Report](./SECURITY_AUDIT.md))
- **Ed25519 Signatures** - Cryptographic wallet verification
- **Payment Verification** - On-chain validation (double-spend proof)
- **Rate Limiting** - Multi-tier anti-bot protection
- **XSS Prevention** - Input sanitization
- **TypeScript Strict Mode** - Type safety

---

## 🚀 Quick Start
> 📘 **For a complete production setup, see the [Deployment Guide](./DEPLOYMENT_GUIDE.md).**

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- Solana Wallet (Phantom, Backpack, Solflare)
- Helius API Key ([Free tier](https://helius.dev))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/DegenScore-Card.git
cd DegenScore-Card

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Edit .env.local with your credentials
nano .env.local

# Generate Prisma client
npx prisma generate

# Run database migrations (optional, for local dev)
npx prisma db push

# Start development server
npm run dev

# Open http://localhost:3000
```

### Deploy Smart Contracts (Optional)

```bash
# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli

# Build programs
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Or to mainnet (requires SOL for rent)
anchor deploy --provider.cluster mainnet-beta
```

---

## 🏗️ Tech Stack

### Frontend

- **Framework**: Next.js 14 (React 18, TypeScript)
- **Styling**: Tailwind CSS 3 + Framer Motion
- **Charts**: Chart.js + Recharts
- **Wallet**: @solana/wallet-adapter-react
- **Real-time**: Pusher (WebSocket)
- **i18n**: 3 languages (EN, ES, ZH)

### Backend

- **API**: Serverless (Next.js API Routes)
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Cache**: Upstash Redis (sub-ms latency)
- **Queue**: BullMQ (background jobs)
- **Storage**: Cloudflare R2 (image CDN)
- **Monitoring**: Sentry

### Blockchain

- **Network**: Solana mainnet-beta
- **RPC**: Helius (enterprise-grade)
- **Programs**: 3 Anchor smart contracts
  - `degen_token` - $DEGEN SPL token with fees & burn
  - `degen_nft` - Dynamic NFTs with on-chain metadata
  - `staking` - Tiered staking (20%-150% APY)

### DevOps

- **Hosting**: Vercel / Render.com
- **CI/CD**: GitHub Actions
- **Database**: Supabase (hosted PostgreSQL)
- **Analytics**: Plausible (privacy-focused)

---

## 📊 DegenScore Algorithm

The **DegenScore (0-100)** is calculated using 9 weighted factors:

| Factor            | Weight | Description                                |
| ----------------- | ------ | ------------------------------------------ |
| **Profit/Loss**   | 30%    | Actual SOL made/lost (+10 SOL = max score) |
| **Win Rate**      | 20%    | % of profitable trades (50%+ = good)       |
| **Volume**        | 10%    | Total SOL traded (100+ SOL = max score)    |
| **Moonshots**     | +10%   | 100x+ gains (each = +5 points, max 2)      |
| **Rugs**          | -15%   | Tokens that went to zero (-1 point each)   |
| **Diamond Hands** | +10%   | Profitable holds >30 days (+2 points each) |
| **Quick Flips**   | -10%   | Paperhanded <1 hour (-0.5 points each)     |
| **Volatility**    | -10%   | Risk score (high volatility = penalty)     |
| **Activity**      | 10%    | Consistency bonus (100+ trades = max)      |

**Formula**: Weighted sum, normalized to 0-100, rounded.

See [`lib/metricsEngine.ts`](./lib/metricsEngine.ts) for full implementation.

---

## 📚 Documentation

- 📖 [Whitepaper](./WHITEPAPER.md) - Full vision, tokenomics, roadmap
- 🔒 [Security Audit](./SECURITY_AUDIT.md) - Vulnerability report & fixes
- 🛣️ [Roadmap](./ROADMAP.md) - Q1-Q4 2025 milestones
- 🧪 [API Docs](./docs/API.md) - Endpoint reference (coming soon)
- 📚 [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- 🐛 [Bug Reports](https://github.com/yourusername/DegenScore-Card/issues) - Found a bug?

---

## 🎯 Roadmap

### ✅ Q1 2025: Launch

- [x] Smart contracts deployed (Token, NFT, Staking)
- [x] Security audit (Internal - 9.5/10)
- [ ] External audit (OtterSec - $40k)
- [ ] IDO on Jupiter LFG ($500k raise)
- [ ] Public launch (50k users target)

### 🔄 Q2 2025: Growth

- [ ] Mobile app (iOS + Android)
- [ ] CEX listing (Gate.io)
- [ ] Partnerships (Jupiter, Phantom, Magic Eden)
- [ ] 500k users target

### 🚀 Q3 2025: Expansion

- [ ] Cross-chain (Ethereum, Base, Arbitrum)
- [ ] AI predictions (ML moonshot detector)
- [ ] Binance listing
- [ ] 2M users target

### 🏆 Q4 2025: Domination

- [ ] White-label offering (DAOs)
- [ ] Enterprise partnerships
- [ ] Series A fundraise ($20M @ $200M valuation)
- [ ] 10M users target

---

## 💼 Business Model

| Revenue Stream      | Price      | Target     | Annual Revenue |
| ------------------- | ---------- | ---------- | -------------- |
| Premium Memberships | 1 SOL      | 120k/year  | $16.8M         |
| Marketplace Fees    | 5%         | $6M volume | $300k          |
| Sponsored Badges    | $5k/brand  | 240/year   | $1.2M          |
| White-Label         | $50k       | 20 clients | $1M            |
| API Subscriptions   | 50k $DEGEN | 12k devs   | Token burn     |
| **TOTAL**           |            |            | **$19.3M**     |

**LTV/CAC**: 28x (viral referrals = near-zero acquisition cost)
**Payback Period**: 1 day

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Conventional Commits format

---

## 🛡️ Security

We take security seriously. Our codebase has a **9.5/10 security score**.

- ✅ All critical vulnerabilities fixed ([Audit Report](./SECURITY_AUDIT.md))
- ✅ External audit scheduled (OtterSec, Q1 2025)
- ✅ Bug bounty program ($100k pool, coming Q1 2025)

**Found a vulnerability?** Email security@degenscore.com (responsible disclosure).

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Solana Foundation** - For building the fastest blockchain
- **Helius** - For enterprise-grade RPC infrastructure
- **Anchor** - For making Solana development amazing
- **Metaplex** - For NFT standards
- **Our Community** - For believing in the vision

---

## 📞 Contact

- **Website**: https://degenscore.com
- **Twitter**: [@DegenScore](https://twitter.com/DegenScore)
- **Discord**: [discord.gg/degenscore](https://discord.gg/degenscore)
- **Email**: hello@degenscore.com

---

<div align="center">

### ⭐ Star us on GitHub!

If you find DegenScore useful, give us a star! It helps us grow. 🚀

**Built with ❤️ on Solana**

</div>

# CertChain - Blockchain-Based Digital Certificate Issuing Platform

Full source code for the assignment (B13 S4 Assignment 1). One Next.js 14
application provides both the frontend (React pages) and the backend
(API routes) - see "How the frontend/backend split works" below. The
`blockchain/` folder is a separate Hardhat project for the smart contract.

## Folder layout

```
certchain/
  blockchain/      Hardhat project - the Solidity smart contract
  web/              Next.js 14 app - frontend UI + backend API routes
```

## Quick start

### 1. Smart contract

```bash
cd blockchain
npm install
cp .env.example .env        # fill in RPC_URL and ISSUER_PRIVATE_KEY
npx hardhat test            # should show 6 passing tests
npx hardhat run scripts/deploy.js --network sepolia
```

Copy the printed contract address - you need it in the next step.

### 2. Web app

```bash
cd web
npm install
cp .env.example .env.local  # fill in DATABASE_URL, AUTH_SECRET, CONTRACT_ADDRESS, SMTP_*
npx drizzle-kit push        # creates the database tables
npm run dev                 # http://localhost:3000
```

Full step-by-step setup (Neon DB, Sepolia RPC, test wallet, Gmail app
password) is in the "02 - System Architecture" and the assignment report
documents that came with this project.

## How the frontend/backend split works

This is a single Next.js app - there is no separate backend server.

| | Location |
|---|---|
| **Frontend** (React UI) | `web/src/app/**/page.tsx`, `web/src/app/**/layout.tsx`, `web/src/components/` |
| **Backend** (API, server-only) | `web/src/app/api/**/route.ts`, `web/src/lib/`, `web/src/db/` |

Frontend pages never touch the database or the blockchain directly - they
call the app's own `/api/...` routes with `fetch()`. Only the backend
route handlers hold the database connection and the blockchain wallet
private key (from `.env.local`, never sent to the browser).

## Tech stack

Next.js 14 (App Router, TypeScript) - Tailwind CSS - PostgreSQL (Neon) via
Drizzle ORM - Solidity 0.8.20 on Ethereum Sepolia via ethers.js v6 -
pdf-lib + qrcode - Nodemailer (Gmail SMTP) - html5-qrcode - deployed on
Vercel.

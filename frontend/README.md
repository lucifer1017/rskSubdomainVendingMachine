# RNS Subdomain Vending Machine – Frontend

Next.js dApp for minting and managing RNS subdomains on Rootstock. Connects to the Factory and vending machine contracts via Wagmi/Viem.

## Routes

| Route | Purpose |
|-------|---------|
| `/` | **Minting page.** Enter a parent domain, check subdomain availability, mint subdomains.  |
| `/admin` | **Admin dashboard.** Deploy vending machines for domains you own, transfer domain ownership to vending machine, set price, pause/unpause, withdraw RIF. |
| `/records` | **Record management.** Set address and text records for subdomains you minted. Enter parent domain and subdomain label. |

## Components & Lib

| File | Purpose |
|------|---------|
| `connect-button.tsx` | Wallet connect/disconnect. Prefers MetaMask when available. |
| `providers.tsx` | Wagmi + React Query providers. |
| `constants.ts` | RNS Registry address (testnet). |
| `contract.ts` | SubdomainVendingMachine ABI and fallback address. |
| `factory.ts` | Factory ABI and address from `NEXT_PUBLIC_FACTORY_ADDRESS`. |
| `rns-resolver.ts` | RNS Resolver and Registry ABIs for record reads/writes. |
| `wagmi.ts` | Wagmi config, Rootstock Testnet chain, injected connector. |

## Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`: set `NEXT_PUBLIC_FACTORY_ADDRESS` (deployed Factory address). Optional: `NEXT_PUBLIC_RSK_TESTNET_RPC_URL`.

## Commands

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

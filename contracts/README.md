# RNS Subdomain Vending Machine – Contracts

Smart contracts enabling any `.rsk` domain owner to become a subdomain registrar. Domain owners deploy a vending machine via the Factory; users mint subdomains (e.g. `player1.guild.rsk`) for free or for a fee.

## Contracts & Interfaces

| Contract / Interface | Purpose |
|----------------------|---------|
| **SubdomainVendingMachineFactory** | Deploys a `SubdomainVendingMachine` per domain. Only the domain owner can deploy. |
| **SubdomainVendingMachine** | Holds parent domain ownership and exposes `register(label, owner)`. Collects RIF payments, supports pause/withdraw. |
| **IRNSRegistry** | Interface for RNS Registry: `owner`, `resolver`, `setOwner`, `setSubnodeOwner`. |
| **IRNSResolver** | Interface for RNS Public Resolver: `addr`, `setAddr`, `text`, `setText`. |
| **MockRNSRegistry**, **MockRNSResolver**, **ERC20Mock** | Mocks for unit tests. |

## Setup

```bash
cd contracts
npm install
cp .env.example .env
```

Edit `.env`: set `PRIVATE_KEY` and `DEPLOY_NETWORK=testnet`. See `.env.example` for RNS addresses.

## Commands

```bash
npx hardhat compile
npx hardhat test
```

## Scripts

| Script | Purpose |
|--------|---------|
| `check-ownership.ts` | Verify who owns a domain and whether the vending machine owns it. Set `CHECK_DOMAIN` env var (default: `test123.rsk`). |
| `reclaim-parent.ts` | Pause a vending machine and reclaim the parent domain back to your wallet. Edit addresses in the file before running. |

```bash
npx hardhat run scripts/check-ownership.ts --network rskTestnet
npx hardhat run scripts/reclaim-parent.ts --network rskTestnet
```

## Deployment

Everything is done from the **UI** except deploying the Factory.

### Step 1: Deploy Factory (once)

```bash
npx hardhat ignition deploy ignition/modules/SubdomainVendingMachineFactory.ts --network rskTestnet
```

Copy the deployed Factory address and set `NEXT_PUBLIC_FACTORY_ADDRESS` in `frontend/.env`.

### Step 2: Use the UI

1. **Register a domain** on [RNS Manager](https://testnet.manager.rns.rifos.org/) (testnet)
2. **Deploy vending machine** – Admin page → enter your domain → Deploy
3. **Transfer ownership** – Admin page → Transfer Domain to Vending Machine
4. **Mint subdomains** – Minting page → enter domain → mint
5. **Manage records** – Records page → set address/text for your subdomain

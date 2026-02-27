# RNS Subdomain Vending Machine

A system enabling any `.rsk` domain owner to become a subdomain registrar. Domain owners deploy a vending machine via the Factory; users mint subdomains (e.g. `player1.guild.rsk`) for free or for a fee.

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `contracts/` | Solidity contracts, Factory, deploy scripts. See [contracts/README.md](https://github.com/lucifer1017/rskSubdomainVendingMachine/blob/main/contracts/README.md). |
| `frontend/` | Next.js dApp. Minting, Admin, Records. See [frontend/README.md](https://github.com/lucifer1017/rskSubdomainVendingMachine/blob/main/frontend/README.md). |

## Quick Start

1. **Contracts:** `cd contracts && npm install && cp .env.example .env` — set `PRIVATE_KEY`, `DEPLOY_NETWORK=testnet`
2. **Deploy Factory:** `npx hardhat ignition deploy ignition/modules/SubdomainVendingMachineFactory.ts --network rskTestnet`
3. **Frontend:** `cd frontend && npm install && cp .env.example .env` — set `NEXT_PUBLIC_FACTORY_ADDRESS`
4. **Run:** `npm run dev` in `frontend/`

## Additional Resources

| Resource | URL |
|----------|-----|
| **RIF Testnet Faucet** | [https://faucet.rifos.org/](https://faucet.rifos.org/) (RIF for Rootstock Testnet) |
| **RNS Manager Testnet** | [https://testnet.manager.rns.rifos.org/](https://testnet.manager.rns.rifos.org/) (register .rsk domains) |

Register a domain on RNS Manager, deploy a vending machine from the Admin page, then mint subdomains from the Minting page.

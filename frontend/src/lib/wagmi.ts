import { createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { injected } from "wagmi/connectors";

// Rootstock Testnet chain definition
const rootstockTestnet = defineChain({
  id: 31,
  name: "Rootstock Testnet",
  nativeCurrency: {
    name: "Rootstock Bitcoin",
    symbol: "tRBTC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_RSK_TESTNET_RPC_URL ||
          "https://public-node.testnet.rsk.co",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "RSK Testnet Explorer",
      url: "https://explorer.testnet.rootstock.io",
    },
  },
});

export const wagmiConfig = createConfig({
  chains: [rootstockTestnet],
  connectors: [
    injected(), // Works with MetaMask, Coinbase Wallet, and other injected wallets
  ],
  transports: {
    [rootstockTestnet.id]: http(),
  },
});

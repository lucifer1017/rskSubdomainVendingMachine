import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

function getRnsAddress(key: string): string {
  const network = process.env.DEPLOY_NETWORK === "mainnet" ? "MAINNET" : "TESTNET";
  return process.env[`${key}_${network}`] ?? "";
}

export default buildModule("SubdomainVendingMachineFactoryModule", (m) => {
  const registry = getRnsAddress("RNS_REGISTRY_ADDRESS");
  const resolver = getRnsAddress("RNS_RESOLVER_ADDRESS");
  const rifToken = getRnsAddress("RIF_TOKEN_ADDRESS");
  if (!registry || !resolver || !rifToken) {
    throw new Error(
      "RNS_REGISTRY_ADDRESS_*, RNS_RESOLVER_ADDRESS_*, RIF_TOKEN_ADDRESS_* must be set in .env"
    );
  }

  const factory = m.contract("SubdomainVendingMachineFactory", [
    registry,
    resolver,
    rifToken,
  ]);

  return { factory };
});

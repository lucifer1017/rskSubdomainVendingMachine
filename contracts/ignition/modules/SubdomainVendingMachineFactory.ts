import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SubdomainVendingMachineFactoryModule", (m) => {
  const registry = m.getParameter(
    "registry",
    "0x7d284aaac6e925aad802a53c0c69efe3764597b8", // RNS Registry (testnet)
  );
  const resolver = m.getParameter(
    "resolver",
    "0x1e7ae43e3503efb886104ace36051ea72b301cdf", // Public Resolver (testnet)
  );
  const rifToken = m.getParameter(
    "rifToken",
    "0x19f64674d8a5b4e652319f5e239efd3bc969a1fe", // RIF (testnet)
  );

  const factory = m.contract("SubdomainVendingMachineFactory", [
    registry,
    resolver,
    rifToken,
  ]);

  return { factory };
});

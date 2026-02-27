import { network } from "hardhat";
import { namehash } from "viem";

const domainName = process.env.CHECK_DOMAIN || "test123.rsk";

async function main() {
  const { viem } = await network.connect({ network: "rskTestnet", chainType: "l1" });

  const registryAddress = "0x7d284aaac6e925aad802a53c0c69efe3764597b8";
  const factoryAddress = "0x2F84B74069566Cc9674B6F99C698B933E1506d5f";

  const parentNode = namehash(domainName);

  const registry = await viem.getContractAt("IRNSRegistry", registryAddress);
  const factory = await viem.getContractAt("SubdomainVendingMachineFactory", factoryAddress);

  const onChainOwner = await registry.read.owner([parentNode]);
  const vmAddress = await factory.read.getVendingMachine([parentNode]);

  console.log("=== On-Chain Ownership Check ===");
  console.log("Domain:", domainName);
  console.log("Parent Node:", parentNode);
  console.log("");
  console.log("registry.owner(parentNode):", onChainOwner);
  console.log("Vending machine (from factory):", vmAddress);
  console.log("");
  if (onChainOwner === "0x0000000000000000000000000000000000000000") {
    console.log("Domain not registered or doesn't exist.");
  } else if (vmAddress && vmAddress !== "0x0000000000000000000000000000000000000000") {
    const match = onChainOwner.toLowerCase() === vmAddress.toLowerCase();
    console.log(
      match
        ? "✅ Vending machine OWNS the domain. Transfer succeeded."
        : "❌ Vending machine does NOT own the domain. Transfer may have failed or not been done."
    );
  } else {
    console.log("No vending machine deployed for this domain.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

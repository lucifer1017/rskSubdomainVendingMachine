import { network } from "hardhat";
import { namehash } from "viem";

const vendingAddress = "0xA5aDE9b4A6076c88f007D261f0562C0657a20d2E";
const label = "player1";

async function main() {
  const { viem } = await network.connect({ network: "rskTestnet", chainType: "l1" });

  const svm = await viem.getContractAt("SubdomainVendingMachine", vendingAddress);
  const registryAddress = await svm.read.registry();
  const parentNode = await svm.read.parentNode();
  const resolverAddress = await svm.read.resolver();
  const paused = await svm.read.paused();
  const price = await svm.read.pricePerSubdomain();

  console.log("=== Vending Machine State ===");
  console.log("Address:", vendingAddress);
  console.log("Paused:", paused);
  console.log("Price:", price.toString());
  console.log("Parent Node:", parentNode);
  console.log("Resolver:", resolverAddress);

  // Check RNS Registry state
  const registry = await viem.getContractAt("IRNSRegistry", registryAddress);
  const parentOwner = await registry.read.owner([parentNode]);
  const parentResolver = await registry.read.resolver([parentNode]);

  console.log("\n=== RNS Registry State ===");
  console.log("Registry:", registryAddress);
  console.log("registry.owner(parentNode):", parentOwner);
  console.log("  Expected:", vendingAddress.toLowerCase());
  console.log("  Match:", parentOwner.toLowerCase() === vendingAddress.toLowerCase());
  if (parentOwner.toLowerCase() !== vendingAddress.toLowerCase()) {
    console.log("\n❌ ERROR: Vending machine does NOT own the parent node!");
    console.log("   You need to transfer ownership of random1996.rsk to:", vendingAddress);
  } else {
    console.log("\n✅ Vending machine owns the parent node!");
  }
  console.log("registry.resolver(parentNode):", parentResolver);

  // Check subdomain availability
  const subnode = await svm.read.subnodeOf([label]);
  const subnodeOwner = await registry.read.owner([subnode]);

  console.log("\n=== Subdomain State ===");
  console.log(`Subdomain: ${label}.random1996.rsk`);
  console.log("Subnode:", subnode);
  console.log("registry.owner(subnode):", subnodeOwner);
  console.log("Available:", subnodeOwner === "0x0000000000000000000000000000000000000000");

  // Verify namehash matches
  const expectedParentNode = namehash("random1996.rsk");
  console.log("\n=== Namehash Verification ===");
  console.log("Expected parentNode (namehash('random1996.rsk')):", expectedParentNode);
  console.log("Contract parentNode:", parentNode);
  console.log("Match:", parentNode.toLowerCase() === expectedParentNode.toLowerCase());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

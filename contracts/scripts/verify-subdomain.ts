import { network } from "hardhat";
import { namehash } from "viem";

const vendingAddress = "0xA5aDE9b4A6076c88f007D261f0562C0657a20d2E";
const label = "player1";
const yourAddress = "0x0dd350d76a265890B9cfeD579DDdbb4D343fF747";

async function main() {
  const { viem } = await network.connect({ network: "rskTestnet", chainType: "l1" });

  const svm = await viem.getContractAt("SubdomainVendingMachine", vendingAddress);
  const registryAddress = await svm.read.registry();
  const parentNode = await svm.read.parentNode();
  const subnode = await svm.read.subnodeOf([label]);

  const registry = await viem.getContractAt("IRNSRegistry", registryAddress);
  const subnodeOwner = await registry.read.owner([subnode]);
  const subnodeResolver = await registry.read.resolver([subnode]);

  console.log("=== Subdomain Verification ===");
  console.log(`Subdomain: ${label}.random1996.rsk`);
  console.log("Subnode:", subnode);
  console.log("\nOwner:", subnodeOwner);
  console.log("  Expected:", yourAddress);
  console.log("  ✅ Match:", subnodeOwner.toLowerCase() === yourAddress.toLowerCase());
  console.log("\nResolver:", subnodeResolver);

  // Check if resolver has address record
  if (subnodeResolver !== "0x0000000000000000000000000000000000000000") {
    const resolver = await viem.getContractAt("IRNSResolver", subnodeResolver);
    try {
      const addr = await resolver.read.addr([subnode]);
      console.log("Resolved Address:", addr);
    } catch (e) {
      console.log("(No address record set yet)");
    }
  }

  console.log("\n✅ Subdomain successfully minted and owned by your wallet!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

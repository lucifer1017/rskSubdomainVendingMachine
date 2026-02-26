import { network } from "hardhat";
import { namehash } from "viem";

const vendingAddress = "0xA5aDE9b4A6076c88f007D261f0562C0657a20d2E";
const yourAddress = "0x0dd350d76a265890B9cfeD579DDdbb4D343fF747";

async function main() {
  const { viem } = await network.connect({ network: "rskTestnet", chainType: "l1" });

  const registryAddress = "0x7d284aaAc6e925AAd802A53c0c69EFE3764597B8";
  const parentNode = namehash("random1996.rsk");

  const registry = await viem.getContractAt("IRNSRegistry", registryAddress);
  
  const owner = await registry.read.owner([parentNode]);
  const resolver = await registry.read.resolver([parentNode]);

  console.log("=== Current On-Chain State ===");
  console.log("Parent Node (namehash('random1996.rsk')):", parentNode);
  console.log("Owner:", owner);
  console.log("  Your wallet:", yourAddress);
  console.log("  Vending machine:", vendingAddress);
  console.log("  Match (wallet):", owner.toLowerCase() === yourAddress.toLowerCase());
  console.log("  Match (vending):", owner.toLowerCase() === vendingAddress.toLowerCase());
  console.log("Resolver:", resolver);

  // Check if there's a controller concept (some RNS implementations have this)
  console.log("\n=== Checking for Transfer Events ===");
  const publicClient = await viem.getPublicClient();
  
  // Get recent Transfer events for this node
  const transferEvents = await publicClient.getLogs({
    address: registryAddress,
    event: {
      type: "event",
      name: "Transfer",
      inputs: [
        { type: "bytes32", indexed: true, name: "node" },
        { type: "address", indexed: false, name: "owner" }
      ]
    },
    args: {
      node: parentNode
    },
    fromBlock: "earliest"
  });

  console.log(`Found ${transferEvents.length} Transfer event(s) for this node`);
  if (transferEvents.length > 0) {
    const latest = transferEvents[transferEvents.length - 1];
    console.log("Latest Transfer event:");
    console.log("  Block:", latest.blockNumber);
    console.log("  Transaction:", latest.transactionHash);
    console.log("  Owner:", latest.args.owner);
  }

  // Also check NewOwner events (for subdomain creation)
  const newOwnerEvents = await publicClient.getLogs({
    address: registryAddress,
    event: {
      type: "event",
      name: "NewOwner",
      inputs: [
        { type: "bytes32", indexed: true, name: "node" },
        { type: "bytes32", indexed: true, name: "label" },
        { type: "address", indexed: false, name: "owner" }
      ]
    },
    fromBlock: "earliest"
  });

  console.log(`\nFound ${newOwnerEvents.length} NewOwner event(s) total`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

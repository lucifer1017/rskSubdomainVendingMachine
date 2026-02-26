import { network } from "hardhat";

const vendingAddress = "0xB3bf60b97D57d46588e8Ba5Eb51D6C05E46014E5";
const label = "player1";

async function main() {
  const { viem } = await network.connect({ network: "rskTestnet", chainType: "l1" });

  const svm = await viem.getContractAt("SubdomainVendingMachine", vendingAddress);

  const registryAddress = await svm.read.registry();
  const parentNode = await svm.read.parentNode();
  const subnode = await svm.read.subnodeOf([label]);

  console.log("Vending machine:", vendingAddress);
  console.log("Registry:", registryAddress);
  console.log("parentNode:", parentNode);
  console.log(`subnode("${label}") :`, subnode);

  const registry = await viem.getContractAt("MockRNSRegistry", registryAddress as `0x${string}`);

  const ownerParent = await registry.read.owner([parentNode]);
  const ownerSub = await registry.read.owner([subnode]);

  console.log("registry.owner(parentNode):", ownerParent);
  console.log(`registry.owner(subnode("${label}")):`, ownerSub);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


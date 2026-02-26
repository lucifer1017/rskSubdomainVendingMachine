import { network } from "hardhat";
import { namehash } from "viem";

const vendingAddress = "0xa5ade9b4a6076c88f007d261f0562c0657a20d2e"; // lowercase to avoid checksum issues
const yourAddress = "0x0dd350d76a265890b9cfed579dddbb4d343ff747";

async function main() {
  const { viem } = await network.connect({ network: "rskTestnet", chainType: "l1" });

  const registryAddress = "0x7d284aaAc6e925AAd802A53c0c69EFE3764597B8";
  const parentNode = namehash("random1996.rsk");

  const registry = await viem.getContractAt("IRNSRegistry", registryAddress);
  const [wallet] = await viem.getWalletClients();

  console.log("=== Direct Transfer Script ===");
  console.log("From:", wallet.account.address);
  console.log("To (vending machine):", vendingAddress);
  console.log("Parent Node:", parentNode);

  // Check current owner
  const currentOwner = await registry.read.owner([parentNode]);
  console.log("\nCurrent owner:", currentOwner);
  
  if (currentOwner.toLowerCase() !== wallet.account.address.toLowerCase()) {
    console.log("❌ You are not the current owner. Cannot transfer.");
    process.exit(1);
  }

  console.log("\nTransferring ownership...");
  const txHash = await registry.write.setOwner([parentNode, vendingAddress as `0x${string}`], {
    account: wallet.account,
  });

  console.log("Transaction sent:", txHash);

  const publicClient = await viem.getPublicClient();
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  console.log("Transaction mined in block:", receipt.blockNumber);

  // Verify
  const newOwner = await registry.read.owner([parentNode]);
  console.log("\nNew owner:", newOwner);
  console.log("Transfer successful:", newOwner.toLowerCase() === vendingAddress.toLowerCase());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

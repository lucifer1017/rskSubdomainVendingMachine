import { network } from "hardhat";

const vendingAddress = "0xB3bf60b97D57d46588e8Ba5Eb51D6C05E46014E5"; // old vending machine
const yourAddress = "0x0dd350d76a265890B9cfeD579DDdbb4D343fF747";   // your EOA

async function main() {
  const { viem } = await network.connect({ network: "rskTestnet", chainType: "l1" });

  const [deployer] = await viem.getWalletClients();
  console.log("Using account:", deployer.account.address);

  const svm = await viem.getContractAt("SubdomainVendingMachine", vendingAddress);

  console.log("Pausing vending machine…");
  await svm.write.pause({ account: deployer.account });

  console.log("Reclaiming parent node to:", yourAddress);
  await svm.write.reclaimParentNode([yourAddress], { account: deployer.account });

  console.log("Done. Check RNS Manager to confirm random123.rsk owner is now your address.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


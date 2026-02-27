import { network } from "hardhat";

const vendingAddress = "0xA5aDE9b4A6076c88f007D261f0562C0657a20d2E";
const label = "player1";

async function main() {
  const { viem } = await network.connect({ network: "rskTestnet", chainType: "l1" });

  const [wallet] = await viem.getWalletClients();

  console.log("Using account:", wallet.account.address);
  console.log("Subdomain vending machine:", vendingAddress);
  console.log(`Registering subdomain "${label}.random1996.rsk"`);

  const svm = await viem.getContractAt("SubdomainVendingMachine", vendingAddress);

  const txHash = await svm.write.register([label, wallet.account.address], {
    account: wallet.account,
  });

  console.log("Sent register tx:", txHash);

  const publicClient = await viem.getPublicClient();
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  console.log("Tx mined in block", receipt.blockNumber);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


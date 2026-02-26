import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { keccak256, encodePacked, stringToBytes } from "viem";
import { network } from "hardhat";

describe("SubdomainVendingMachine", async function () {
  const { viem } = await network.connect();

  it("registers a subdomain, sets resolver, and transfers ownership", async function () {
    // Deploy mocks
    const registry = await viem.deployContract("MockRNSRegistry");
    const resolver = await viem.deployContract("MockRNSResolver");
    const rifToken = await viem.deployContract("ERC20Mock", ["RIF", "RIF"]);

    const [deployer, user] = await viem.getWalletClients();

    const parentNode = ("0x" +
      "aa".repeat(32)) as `0x${string}`; // arbitrary non-zero node
    const initialPrice = 10n * 10n ** 18n;

    // Deploy the vending machine
    const svm = await viem.deployContract("SubdomainVendingMachine", [
      registry.address,
      resolver.address,
      rifToken.address,
      parentNode,
      initialPrice,
      deployer.account.address,
    ]);

    // Give the vending machine contract ownership of the parent node.
    await registry.write.setOwner([parentNode, svm.address]);

    // Mint RIF to user and approve vending machine
    await rifToken.write.mint([user.account.address, initialPrice]);
    await rifToken.write.approve([svm.address, initialPrice], {
      account: user.account,
    });

    // Register subdomain "player1"
    const label = "player1";
    await svm.write.register([label, user.account.address], {
      account: user.account,
    });

    // Compute labelhash and subnode exactly as in the Solidity contract
    const labelhash = keccak256(stringToBytes(label));
    const subnode = keccak256(
      encodePacked(["bytes32", "bytes32"], [parentNode, labelhash]),
    );

    const owner = await registry.read.owner([subnode]);
    assert.equal(
      owner.toLowerCase(),
      user.account.address.toLowerCase(),
    );

    const configuredResolver = await registry.read.resolver([subnode]);
    assert.equal(
      configuredResolver.toLowerCase(),
      resolver.address.toLowerCase(),
    );
  });
});



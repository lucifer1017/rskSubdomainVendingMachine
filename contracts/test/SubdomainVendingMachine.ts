import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { keccak256, encodePacked, stringToBytes } from "viem";
import { network } from "hardhat";

describe("SubdomainVendingMachine", async function () {
  const { viem } = await network.connect();

  it("registers a subdomain, sets resolver, and transfers ownership", async function () {
    const registry = await viem.deployContract("MockRNSRegistry");
    const resolver = await viem.deployContract("MockRNSResolver");
    const rifToken = await viem.deployContract("ERC20Mock", ["RIF", "RIF"]);

    const [deployer, user] = await viem.getWalletClients();

    const parentNode = ("0x" + "aa".repeat(32)) as `0x${string}`;
    const initialPrice = 10n * 10n ** 18n;

    const svm = await viem.deployContract("SubdomainVendingMachine", [
      registry.address,
      resolver.address,
      rifToken.address,
      parentNode,
      initialPrice,
      deployer.account.address,
    ]);

    await registry.write.setOwner([parentNode, svm.address]);

    await rifToken.write.mint([user.account.address, initialPrice]);
    await rifToken.write.approve([svm.address, initialPrice], {
      account: user.account,
    });

    const label = "player1";

    await svm.write.register([label, user.account.address], {
      account: user.account,
    });

    const subnode = await svm.read.subnodeOf([label]);

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

  it("reverts on empty label, double registration, and when paused", async function () {
    const registry = await viem.deployContract("MockRNSRegistry");
    const resolver = await viem.deployContract("MockRNSResolver");
    const rifToken = await viem.deployContract("ERC20Mock", ["RIF", "RIF"]);

    const [deployer, user] = await viem.getWalletClients();

    const parentNode = ("0x" + "bb".repeat(32)) as `0x${string}`;
    const initialPrice = 0n;

    const svm = await viem.deployContract("SubdomainVendingMachine", [
      registry.address,
      resolver.address,
      rifToken.address,
      parentNode,
      initialPrice,
      deployer.account.address,
    ]);

    await registry.write.setOwner([parentNode, svm.address]);

    await assert.rejects(
      svm.write.register(["", user.account.address], {
        account: user.account,
      }),
    );

    const label = "taken";
    await svm.write.register([label, user.account.address], {
      account: user.account,
    });

    await assert.rejects(
      svm.write.register([label, user.account.address], {
        account: user.account,
      }),
    );

    await svm.write.pause();

    await assert.rejects(
      svm.write.register(["other", user.account.address], {
        account: user.account,
      }),
    );
  });

  it("supports withdraw and reclaimParentNode", async function () {
    const registry = await viem.deployContract("MockRNSRegistry");
    const resolver = await viem.deployContract("MockRNSResolver");
    const rifToken = await viem.deployContract("ERC20Mock", ["RIF", "RIF"]);

    const [deployer, user] = await viem.getWalletClients();

    const parentNode = ("0x" + "cc".repeat(32)) as `0x${string}`;
    const initialPrice = 100n;

    const svm = await viem.deployContract("SubdomainVendingMachine", [
      registry.address,
      resolver.address,
      rifToken.address,
      parentNode,
      initialPrice,
      deployer.account.address,
    ]);

    await registry.write.setOwner([parentNode, svm.address]);

    await rifToken.write.mint([user.account.address, initialPrice]);
    await rifToken.write.approve([svm.address, initialPrice], {
      account: user.account,
    });

    await svm.write.register(["paid", user.account.address], {
      account: user.account,
    });

    const before = await rifToken.read.balanceOf([deployer.account.address]);
    await svm.write.withdraw([deployer.account.address, initialPrice]);
    const after = await rifToken.read.balanceOf([deployer.account.address]);
    assert.equal(after - before, initialPrice);

    await svm.write.pause();
    await svm.write.reclaimParentNode([deployer.account.address]);
    const owner = await registry.read.owner([parentNode]);
    assert.equal(
      owner.toLowerCase(),
      deployer.account.address.toLowerCase(),
    );
  });
});



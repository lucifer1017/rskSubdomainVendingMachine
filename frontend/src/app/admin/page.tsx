"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther, namehash } from "viem";
import { ConnectButton } from "@/components/connect-button";
import {
  SUBDOMAIN_VENDING_MACHINE_ADDRESS,
  SUBDOMAIN_VENDING_MACHINE_ABI,
} from "@/lib/contract";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/lib/factory";
import { RNS_REGISTRY_ABI } from "@/lib/rns-resolver";
import { RNS_REGISTRY_ADDRESS } from "@/lib/constants";
import Link from "next/link";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

type DomainStatus = "idle" | "checking" | "not_found" | "not_owned" | "ready" | "already_deployed";

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [newPrice, setNewPrice] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawTo, setWithdrawTo] = useState("");

  // Deployment section
  const [domainName, setDomainName] = useState("");
  const [initialPrice, setInitialPrice] = useState("");

  // Transfer section
  const [transferDomainName, setTransferDomainName] = useState("");

  // Manage section - which domain's vending machine to manage
  const [manageDomainName, setManageDomainName] = useState("random1996.rsk");

  const factoryDeployed = FACTORY_ADDRESS !== ZERO_ADDRESS;

  // Write contracts and tx receipts (must be declared before canDeploy/canTransfer)
  const { writeContract: setPriceWrite, data: setPriceHash } = useWriteContract();
  const { writeContract: pauseWrite, data: pauseHash } = useWriteContract();
  const { writeContract: unpauseWrite, data: unpauseHash } = useWriteContract();
  const { writeContract: withdrawWrite, data: withdrawHash } = useWriteContract();
  const { writeContract: deployWrite, data: deployHash } = useWriteContract();
  const { writeContract: transferWrite, data: transferHash } = useWriteContract();

  const { isLoading: isSettingPrice } = useWaitForTransactionReceipt({
    hash: setPriceHash,
  });
  const { isLoading: isPausing } = useWaitForTransactionReceipt({
    hash: pauseHash,
  });
  const { isLoading: isUnpausing } = useWaitForTransactionReceipt({
    hash: unpauseHash,
  });
  const { isLoading: isWithdrawing } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });
  const { isLoading: isDeploying, isSuccess: deploySuccess } = useWaitForTransactionReceipt({
    hash: deployHash,
  });
  const { isLoading: isTransferring, isSuccess: transferSuccess } = useWaitForTransactionReceipt({
    hash: transferHash,
  });

  // Domain ownership check for deploy
  const deployParentNode = domainName.trim() ? namehash(domainName.trim()) : undefined;
  const { data: deployDomainOwner } = useReadContract({
    address: RNS_REGISTRY_ADDRESS,
    abi: RNS_REGISTRY_ABI,
    functionName: "owner",
    args: deployParentNode ? [deployParentNode] : undefined,
    query: {
      enabled: !!deployParentNode,
    },
  });

  const deployDomainStatus = (): DomainStatus => {
    if (!domainName.trim()) return "idle";
    if (!deployDomainOwner) return "checking";
    if (deployDomainOwner === ZERO_ADDRESS) return "not_found";
    if (address && deployDomainOwner.toLowerCase() !== address.toLowerCase()) return "not_owned";
    return "ready";
  };

  const canDeploy =
    domainName.trim() &&
    address &&
    factoryDeployed &&
    deployDomainStatus() === "ready" &&
    !isDeploying;

  // Vending machine lookup for deploy (check if already deployed)
  const { data: existingVm } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getVendingMachine",
    args: deployParentNode ? [deployParentNode] : undefined,
    query: {
      enabled: !!deployParentNode && factoryDeployed,
    },
  });

  const deployStatus = deployDomainStatus();
  const alreadyHasVm = existingVm && existingVm !== ZERO_ADDRESS;

  // Transfer section
  const transferParentNode = transferDomainName.trim()
    ? namehash(transferDomainName.trim())
    : undefined;
  const { data: transferDomainOwner } = useReadContract({
    address: RNS_REGISTRY_ADDRESS,
    abi: RNS_REGISTRY_ABI,
    functionName: "owner",
    args: transferParentNode ? [transferParentNode] : undefined,
    query: {
      enabled: !!transferParentNode,
    },
  });
  const { data: transferVmAddress } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getVendingMachine",
    args: transferParentNode ? [transferParentNode] : undefined,
    query: {
      enabled: !!transferParentNode && factoryDeployed,
    },
  });

  const userOwnsTransferDomain =
    address &&
    transferDomainOwner &&
    transferDomainOwner !== ZERO_ADDRESS &&
    transferDomainOwner.toLowerCase() === address.toLowerCase();
  const vmExistsForTransfer =
    transferVmAddress && transferVmAddress !== ZERO_ADDRESS;
  const vmAlreadyOwnsTransfer =
    transferDomainOwner &&
    transferVmAddress &&
    transferDomainOwner.toLowerCase() === transferVmAddress.toLowerCase();

  const canTransfer =
    transferDomainName.trim() &&
    userOwnsTransferDomain &&
    vmExistsForTransfer &&
    !vmAlreadyOwnsTransfer &&
    !isTransferring;

  // Manage section
  const manageParentNode = manageDomainName.trim()
    ? namehash(manageDomainName.trim())
    : undefined;
  const { data: manageVmAddress } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getVendingMachine",
    args: manageParentNode ? [manageParentNode] : undefined,
    query: {
      enabled: !!manageParentNode && factoryDeployed,
    },
  });

  const activeVmAddress =
    manageVmAddress && manageVmAddress !== ZERO_ADDRESS
      ? manageVmAddress
      : manageDomainName === "random1996.rsk"
        ? SUBDOMAIN_VENDING_MACHINE_ADDRESS
        : null;

  const { data: vmContractOwner } = useReadContract({
    address: activeVmAddress as `0x${string}`,
    abi: SUBDOMAIN_VENDING_MACHINE_ABI,
    functionName: "owner",
    query: {
      enabled: !!activeVmAddress,
    },
  });

  const { data: price } = useReadContract({
    address: activeVmAddress as `0x${string}`,
    abi: SUBDOMAIN_VENDING_MACHINE_ABI,
    functionName: "pricePerSubdomain",
    query: {
      enabled: !!activeVmAddress,
    },
  });

  const { data: paused } = useReadContract({
    address: activeVmAddress as `0x${string}`,
    abi: SUBDOMAIN_VENDING_MACHINE_ABI,
    functionName: "paused",
    query: {
      enabled: !!activeVmAddress,
    },
  });

  const isManageAdmin =
    address &&
    vmContractOwner &&
    address.toLowerCase() === vmContractOwner.toLowerCase();

  useEffect(() => {
    if (deploySuccess && domainName.trim()) {
      setTransferDomainName(domainName.trim());
    }
  }, [deploySuccess, domainName]);

  const handleSetPrice = () => {
    if (!newPrice || !activeVmAddress) return;
    try {
      setPriceWrite({
        address: activeVmAddress as `0x${string}`,
        abi: SUBDOMAIN_VENDING_MACHINE_ABI,
        functionName: "setPrice",
        args: [parseEther(newPrice)],
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handlePause = () => {
    if (!activeVmAddress) return;
    pauseWrite({
      address: activeVmAddress as `0x${string}`,
      abi: SUBDOMAIN_VENDING_MACHINE_ABI,
      functionName: "pause",
    });
  };

  const handleUnpause = () => {
    if (!activeVmAddress) return;
    unpauseWrite({
      address: activeVmAddress as `0x${string}`,
      abi: SUBDOMAIN_VENDING_MACHINE_ABI,
      functionName: "unpause",
    });
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || !withdrawTo || !activeVmAddress) return;
    try {
      withdrawWrite({
        address: activeVmAddress as `0x${string}`,
        abi: SUBDOMAIN_VENDING_MACHINE_ABI,
        functionName: "withdraw",
        args: [withdrawTo as `0x${string}`, parseEther(withdrawAmount)],
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeploy = () => {
    if (!domainName.trim() || !address || !factoryDeployed) return;
    try {
      const parentNode = namehash(domainName.trim());
      const priceInWei = initialPrice ? parseEther(initialPrice) : 0n;
      deployWrite({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "deployVendingMachine",
        args: [parentNode, priceInWei, address],
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleTransfer = () => {
    if (!transferDomainName.trim() || !transferVmAddress) return;
    try {
      const parentNode = namehash(transferDomainName.trim());
      transferWrite({
        address: RNS_REGISTRY_ADDRESS,
        abi: RNS_REGISTRY_ABI,
        functionName: "setOwner",
        args: [parentNode, transferVmAddress],
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            Please connect your wallet to access the admin dashboard
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Deploy vending machines, transfer domains, and manage pricing
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <Link
              href="/"
              className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors"
            >
              Minting Page
            </Link>
            <ConnectButton />
          </div>
        </div>

        {!factoryDeployed && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
            <p className="text-yellow-800 dark:text-yellow-200">
              ⚠️ Factory contract not deployed. Set NEXT_PUBLIC_FACTORY_ADDRESS in your .env file.
            </p>
          </div>
        )}

        {/* 1. Deploy Section */}
        {factoryDeployed && (
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 border border-zinc-200 dark:border-zinc-700 mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
              1. Deploy New Vending Machine
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Deploy a vending machine for your .rsk domain. You must own the domain in RNS Registry.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Domain Name (e.g., guild.rsk)
                </label>
                <input
                  type="text"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  placeholder="guild.rsk"
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                />
                {domainName.trim() && (
                  <div className="mt-2">
                    {deployStatus === "checking" && (
                      <p className="text-sm text-zinc-500">Checking domain...</p>
                    )}
                    {deployStatus === "not_found" && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Domain not found or not registered.
                      </p>
                    )}
                    {deployStatus === "not_owned" && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        You don&apos;t own this domain.
                      </p>
                    )}
                    {deployStatus === "ready" && alreadyHasVm && (
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        A vending machine already exists for this domain.
                      </p>
                    )}
                    {deployStatus === "ready" && !alreadyHasVm && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        ✓ You own this domain. Ready to deploy.
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Initial Price (RIF) — Leave empty for FREE
                </label>
                <input
                  type="text"
                  value={initialPrice}
                  onChange={(e) => setInitialPrice(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                />
              </div>
              <button
                onClick={handleDeploy}
                disabled={!canDeploy || !!(deployStatus === "ready" && alreadyHasVm)}
                className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50 font-semibold"
              >
                {isDeploying ? "Deploying..." : "Deploy Vending Machine"}
              </button>
              {deployHash && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-green-800 dark:text-green-200 text-sm mb-2">
                    {deploySuccess ? "✅ Deployment successful! Now transfer ownership below." : "⏳ Deployment in progress..."}
                  </p>
                  <a
                    href={`https://explorer.testnet.rootstock.io/tx/${deployHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 dark:text-green-400 hover:underline"
                  >
                    View Transaction
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Transfer Ownership Section */}
        {factoryDeployed && (
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 border border-zinc-200 dark:border-zinc-700 mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
              2. Transfer Domain to Vending Machine
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              After deploying, transfer ownership of your domain to the vending machine so it can mint subdomains.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Domain Name
                </label>
                <input
                  type="text"
                  value={transferDomainName}
                  onChange={(e) => setTransferDomainName(e.target.value)}
                  placeholder="guild.rsk"
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                />
                {transferDomainName.trim() && (
                  <div className="mt-2 space-y-1">
                    {!userOwnsTransferDomain && transferDomainOwner && transferDomainOwner !== ZERO_ADDRESS && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        You don&apos;t own this domain.
                      </p>
                    )}
                    {transferDomainOwner === ZERO_ADDRESS && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Domain not found.
                      </p>
                    )}
                    {userOwnsTransferDomain && !vmExistsForTransfer && (
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        No vending machine for this domain. Deploy one first.
                      </p>
                    )}
                    {userOwnsTransferDomain && vmExistsForTransfer && vmAlreadyOwnsTransfer && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        ✓ Vending machine already owns this domain. Ready to mint!
                      </p>
                    )}
                    {userOwnsTransferDomain && vmExistsForTransfer && !vmAlreadyOwnsTransfer && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        ✓ Ready to transfer. Click the button below.
                      </p>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={handleTransfer}
                disabled={!canTransfer}
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 font-semibold"
              >
                {isTransferring ? "Transferring..." : "Transfer Ownership"}
              </button>
              {transferHash && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-green-800 dark:text-green-200 text-sm mb-2">
                    {transferSuccess ? "✅ Transfer complete! Subdomain minting is now active." : "⏳ Transfer in progress..."}
                  </p>
                  <a
                    href={`https://explorer.testnet.rootstock.io/tx/${transferHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 dark:text-green-400 hover:underline"
                  >
                    View Transaction
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Manage Section */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 border border-zinc-200 dark:border-zinc-700 mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
            3. Manage Vending Machine
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Set price, pause/unpause, and withdraw funds. Only the contract owner can manage.
          </p>
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Domain to manage
            </label>
            <input
              type="text"
              value={manageDomainName}
              onChange={(e) => setManageDomainName(e.target.value)}
              placeholder="random1996.rsk"
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
            />
          </div>

          {!activeVmAddress && (
            <p className="text-zinc-600 dark:text-zinc-400">
              No vending machine found for this domain.
            </p>
          )}

          {activeVmAddress && !isManageAdmin && (
            <p className="text-red-600 dark:text-red-400 mb-4">
              You are not the owner of this vending machine.
            </p>
          )}

          {activeVmAddress && isManageAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Current Price</p>
                  <p className="text-xl font-bold">
                    {price !== undefined
                      ? price === 0n
                        ? "FREE"
                        : `${formatEther(price)} RIF`
                      : "Loading..."}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Set Price (RIF)</label>
                  <input
                    type="text"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="0.0"
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900"
                  />
                  <button
                    onClick={handleSetPrice}
                    disabled={!newPrice || isSettingPrice}
                    className="mt-2 w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {isSettingPrice ? "Setting..." : "Set Price"}
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Status</p>
                  <p className="text-xl font-bold">
                    {paused ? (
                      <span className="text-red-600">Paused</span>
                    ) : (
                      <span className="text-green-600">Active</span>
                    )}
                  </p>
                </div>
                <div>
                  {paused ? (
                    <button
                      onClick={handleUnpause}
                      disabled={isUnpausing}
                      className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50"
                    >
                      {isUnpausing ? "Unpausing..." : "Unpause Minting"}
                    </button>
                  ) : (
                    <button
                      onClick={handlePause}
                      disabled={isPausing}
                      className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50"
                    >
                      {isPausing ? "Pausing..." : "Pause Minting"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeVmAddress && isManageAdmin && (
            <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
              <h3 className="font-bold mb-4">Withdraw Funds</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={withdrawTo}
                  onChange={(e) => setWithdrawTo(e.target.value)}
                  placeholder="Recipient address"
                  className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 font-mono"
                />
                <input
                  type="text"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Amount (RIF)"
                  className="w-32 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900"
                />
                <button
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || !withdrawTo || isWithdrawing}
                  className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg disabled:opacity-50"
                >
                  {isWithdrawing ? "Withdrawing..." : "Withdraw"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

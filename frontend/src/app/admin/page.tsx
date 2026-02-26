"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther } from "viem";
import { ConnectButton } from "@/components/connect-button";
import {
  SUBDOMAIN_VENDING_MACHINE_ADDRESS,
  SUBDOMAIN_VENDING_MACHINE_ABI,
} from "@/lib/contract";
import Link from "next/link";

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [newPrice, setNewPrice] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawTo, setWithdrawTo] = useState("");

  // Read contract state
  const { data: contractOwner } = useReadContract({
    address: SUBDOMAIN_VENDING_MACHINE_ADDRESS,
    abi: SUBDOMAIN_VENDING_MACHINE_ABI,
    functionName: "owner",
  });

  const { data: price } = useReadContract({
    address: SUBDOMAIN_VENDING_MACHINE_ADDRESS,
    abi: SUBDOMAIN_VENDING_MACHINE_ABI,
    functionName: "pricePerSubdomain",
  });

  const { data: paused } = useReadContract({
    address: SUBDOMAIN_VENDING_MACHINE_ADDRESS,
    abi: SUBDOMAIN_VENDING_MACHINE_ABI,
    functionName: "paused",
  });

  const { data: rifToken } = useReadContract({
    address: SUBDOMAIN_VENDING_MACHINE_ADDRESS,
    abi: SUBDOMAIN_VENDING_MACHINE_ABI,
    functionName: "rifToken",
  });

  const isAdmin = isConnected && address && address.toLowerCase() === contractOwner?.toLowerCase();

  // Write contracts
  const { writeContract: setPriceWrite, data: setPriceHash } = useWriteContract();
  const { writeContract: pauseWrite, data: pauseHash } = useWriteContract();
  const { writeContract: unpauseWrite, data: unpauseHash } = useWriteContract();
  const { writeContract: withdrawWrite, data: withdrawHash } = useWriteContract();

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

  const handleSetPrice = () => {
    if (!newPrice) return;
    try {
      const priceInWei = parseEther(newPrice);
      setPriceWrite({
        address: SUBDOMAIN_VENDING_MACHINE_ADDRESS,
        abi: SUBDOMAIN_VENDING_MACHINE_ABI,
        functionName: "setPrice",
        args: [priceInWei],
      });
    } catch (error) {
      console.error("Error setting price:", error);
    }
  };

  const handlePause = () => {
    pauseWrite({
      address: SUBDOMAIN_VENDING_MACHINE_ADDRESS,
      abi: SUBDOMAIN_VENDING_MACHINE_ABI,
      functionName: "pause",
    });
  };

  const handleUnpause = () => {
    unpauseWrite({
      address: SUBDOMAIN_VENDING_MACHINE_ADDRESS,
      abi: SUBDOMAIN_VENDING_MACHINE_ABI,
      functionName: "unpause",
    });
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || !withdrawTo) return;
    try {
      const amountInWei = parseEther(withdrawAmount);
      withdrawWrite({
        address: SUBDOMAIN_VENDING_MACHINE_ADDRESS,
        abi: SUBDOMAIN_VENDING_MACHINE_ABI,
        functionName: "withdraw",
        args: [withdrawTo as `0x${string}`, amountInWei],
      });
    } catch (error) {
      console.error("Error withdrawing:", error);
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-red-600">Access Denied</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            You are not the contract owner
          </p>
          <Link
            href="/"
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Go to Minting Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Manage your subdomain vending machine
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 border border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Current Price</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              {price !== undefined
                ? price === 0n
                  ? "FREE"
                  : `${formatEther(price)} RIF`
                : "Loading..."}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 border border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Status</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              {paused ? (
                <span className="text-red-600">Paused</span>
              ) : (
                <span className="text-green-600">Active</span>
              )}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 border border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Contract</p>
            <p className="text-sm font-mono text-zinc-600 dark:text-zinc-400 break-all">
              {SUBDOMAIN_VENDING_MACHINE_ADDRESS}
            </p>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Set Price */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 border border-zinc-200 dark:border-zinc-700">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
              Set Price
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.0"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
              />
              <button
                onClick={handleSetPrice}
                disabled={!newPrice || isSettingPrice}
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isSettingPrice ? "Setting..." : "Set Price (RIF)"}
              </button>
            </div>
          </div>

          {/* Pause/Unpause */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 border border-zinc-200 dark:border-zinc-700">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
              Control Minting
            </h2>
            <div className="space-y-2">
              {paused ? (
                <button
                  onClick={handleUnpause}
                  disabled={isUnpausing}
                  className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isUnpausing ? "Unpausing..." : "Unpause Minting"}
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  disabled={isPausing}
                  className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isPausing ? "Pausing..." : "Pause Minting"}
                </button>
              )}
            </div>
          </div>

          {/* Withdraw */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 border border-zinc-200 dark:border-zinc-700 md:col-span-2">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
              Withdraw Funds
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                value={withdrawTo}
                onChange={(e) => setWithdrawTo(e.target.value)}
                placeholder="Recipient address (0x...)"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-mono"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Amount (RIF)"
                  className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                />
                <button
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || !withdrawTo || isWithdrawing}
                  className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isWithdrawing ? "Withdrawing..." : "Withdraw"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

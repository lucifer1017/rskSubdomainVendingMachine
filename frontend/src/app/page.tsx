"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther } from "viem";
import { ConnectButton } from "@/components/connect-button";
import {
  SUBDOMAIN_VENDING_MACHINE_ADDRESS,
  SUBDOMAIN_VENDING_MACHINE_ABI,
} from "@/lib/contract";

export default function Home() {
  const { address, isConnected } = useAccount();
  const [label, setLabel] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // Read contract state
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

  // Write contract
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const { data: availability } = useReadContract({
    address: SUBDOMAIN_VENDING_MACHINE_ADDRESS,
    abi: SUBDOMAIN_VENDING_MACHINE_ABI,
    functionName: "isAvailable",
    args: label.trim() ? [label.trim()] : undefined,
    query: {
      enabled: !!label.trim(),
    },
  });

  const checkAvailability = () => {
    if (availability !== undefined) {
      setIsAvailable(availability);
    }
  };

  const handleMint = async () => {
    if (!isConnected || !address || !label.trim()) return;

    try {
      writeContract({
        address: SUBDOMAIN_VENDING_MACHINE_ADDRESS,
        abi: SUBDOMAIN_VENDING_MACHINE_ABI,
        functionName: "register",
        args: [label.trim(), address],
      });
    } catch (error) {
      console.error("Error minting:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">
              RNS Subdomain Vending
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Mint your subdomain on random1996.rsk
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <Link
              href="/records"
              className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors"
            >
              Manage Records
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors"
            >
              Admin
            </Link>
            <ConnectButton />
          </div>
        </div>

        {/* Main Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-700">
            {/* Status Badge */}
            {paused && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 font-medium">
                  ⚠️ Minting is currently paused
                </p>
              </div>
            )}

            {/* Price Display */}
            {price !== undefined && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                  Price per subdomain
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {price === 0n ? "FREE" : `${formatEther(price)} RIF`}
                </p>
              </div>
            )}

            {/* Input Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Subdomain Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="yourname"
                    className="flex-1 px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="px-4 py-3 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg font-mono">
                    .random1996.rsk
                  </span>
                </div>
              </div>

              {/* Availability Check */}
              {label.trim() && (
                <button
                  onClick={checkAvailability}
                  className="w-full px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors"
                >
                  Check Availability
                </button>
              )}

              {/* Availability Result */}
              {isAvailable !== null && (
                <div
                  className={`p-4 rounded-lg ${
                    isAvailable
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  }`}
                >
                  <p
                    className={
                      isAvailable
                        ? "text-green-800 dark:text-green-200"
                        : "text-red-800 dark:text-red-200"
                    }
                  >
                    {isAvailable ? "✅ Available!" : "❌ Already taken"}
                  </p>
                </div>
              )}

              {/* Mint Button */}
              <button
                onClick={handleMint}
                disabled={
                  !isConnected ||
                  !label.trim() ||
                  !!paused ||
                  isPending ||
                  isConfirming ||
                  isAvailable === false
                }
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {!isConnected
                  ? "Connect Wallet to Mint"
                  : isPending || isConfirming
                    ? "Processing..."
                    : isSuccess
                      ? "✅ Minted!"
                      : `Mint ${label.trim() || "Subdomain"}.random1996.rsk`}
              </button>

              {/* Success Message */}
              {isSuccess && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-green-800 dark:text-green-200 font-medium">
                    🎉 Successfully minted! Your subdomain is ready.
                  </p>
                  {hash && (
                    <a
                      href={`https://explorer.testnet.rootstock.io/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 dark:text-green-400 hover:underline mt-2 inline-block"
                    >
                      View on Explorer
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

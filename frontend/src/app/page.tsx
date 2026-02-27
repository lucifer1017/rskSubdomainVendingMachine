"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther, namehash } from "viem";
import { ConnectButton } from "@/components/connect-button";
import {
  SUBDOMAIN_VENDING_MACHINE_ADDRESS,
  SUBDOMAIN_VENDING_MACHINE_ABI,
} from "@/lib/contract";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/lib/factory";

function HomePageContent() {
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const [label, setLabel] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [domainName, setDomainName] = useState(searchParams.get("domain") || "");
  const [vendingMachineAddress, setVendingMachineAddress] = useState<`0x${string}` | null>(null);

  const parentNode = domainName ? namehash(domainName) : undefined;
  const { data: vmAddress } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getVendingMachine",
    args: parentNode ? [parentNode] : undefined,
    query: {
      enabled: !!parentNode && FACTORY_ADDRESS !== "0x0000000000000000000000000000000000000000",
    },
  });
  
  useEffect(() => {
    if (searchParams.get("domain")) {
      setDomainName(searchParams.get("domain") || "");
    }
  }, [searchParams]);

  useEffect(() => {
    if (vmAddress && vmAddress !== "0x0000000000000000000000000000000000000000") {
      setVendingMachineAddress(vmAddress);
    } else if (domainName === "random1996.rsk") {
      setVendingMachineAddress(SUBDOMAIN_VENDING_MACHINE_ADDRESS);
    } else {
      setVendingMachineAddress(null);
    }
  }, [vmAddress, domainName]);

  const { data: price } = useReadContract({
    address: vendingMachineAddress || SUBDOMAIN_VENDING_MACHINE_ADDRESS,
    abi: SUBDOMAIN_VENDING_MACHINE_ABI,
    functionName: "pricePerSubdomain",
    query: {
      enabled: !!vendingMachineAddress,
    },
  });

  const { data: paused } = useReadContract({
    address: vendingMachineAddress || SUBDOMAIN_VENDING_MACHINE_ADDRESS,
    abi: SUBDOMAIN_VENDING_MACHINE_ABI,
    functionName: "paused",
    query: {
      enabled: !!vendingMachineAddress,
    },
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const { data: availability } = useReadContract({
    address: vendingMachineAddress || SUBDOMAIN_VENDING_MACHINE_ADDRESS,
    abi: SUBDOMAIN_VENDING_MACHINE_ABI,
    functionName: "isAvailable",
    args: label.trim() ? [label.trim()] : undefined,
    query: {
      enabled: !!label.trim() && !!vendingMachineAddress,
    },
  });

  const checkAvailability = () => {
    if (availability !== undefined) {
      setIsAvailable(availability);
    }
  };

  const handleMint = async () => {
    if (!isConnected || !address || !label.trim() || !vendingMachineAddress) return;

    try {
      writeContract({
        address: vendingMachineAddress,
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
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">
              RNS Subdomain Vending
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Mint subdomains on any .rsk domain with a vending machine
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

        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-700">
            {paused && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 font-medium">
                  ⚠️ Minting is currently paused
                </p>
              </div>
            )}

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

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Parent Domain (e.g., guild.rsk, random1996.rsk)
                </label>
                <input
                  type="text"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  placeholder="random1996.rsk"
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white mb-4"
                />
              </div>
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
                    .{domainName || "domain.rsk"}
                  </span>
                </div>
              </div>

              {label.trim() && (
                <button
                  onClick={checkAvailability}
                  className="w-full px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors"
                >
                  Check Availability
                </button>
              )}

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

              {!vendingMachineAddress && domainName && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    No vending machine for {domainName}. The domain owner must deploy one via Admin first.
                  </p>
                </div>
              )}

              <button
                onClick={handleMint}
                disabled={
                  !isConnected ||
                  !label.trim() ||
                  !domainName ||
                  !vendingMachineAddress ||
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
                      : `Mint ${label.trim() || "Subdomain"}.${domainName || "domain.rsk"}`}
              </button>

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

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 flex items-center justify-center">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}

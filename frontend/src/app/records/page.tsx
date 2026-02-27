"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { namehash } from "viem";
import { ConnectButton } from "@/components/connect-button";
import {
  SUBDOMAIN_VENDING_MACHINE_ADDRESS,
  SUBDOMAIN_VENDING_MACHINE_ABI,
} from "@/lib/contract";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/lib/factory";
import { RNS_RESOLVER_ABI, RNS_REGISTRY_ABI } from "@/lib/rns-resolver";
import Link from "next/link";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export default function RecordsPage() {
  const { address, isConnected } = useAccount();
  const [parentDomain, setParentDomain] = useState("random1996.rsk");
  const [subdomainLabel, setSubdomainLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [textKey, setTextKey] = useState("");
  const [textValue, setTextValue] = useState("");

  const parentNode = parentDomain.trim() ? namehash(parentDomain.trim()) : undefined;
  const { data: vmAddress } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getVendingMachine",
    args: parentNode ? [parentNode] : undefined,
    query: {
      enabled: !!parentNode && FACTORY_ADDRESS !== ZERO_ADDRESS,
    },
  });

  const activeVmAddress =
    vmAddress && vmAddress !== ZERO_ADDRESS
      ? vmAddress
      : parentDomain === "random1996.rsk"
        ? SUBDOMAIN_VENDING_MACHINE_ADDRESS
        : null;

  const { data: registryAddress } = useReadContract({
    address: activeVmAddress as `0x${string}`,
    abi: SUBDOMAIN_VENDING_MACHINE_ABI,
    functionName: "registry",
    query: { enabled: !!activeVmAddress },
  });

  const { data: resolverAddress } = useReadContract({
    address: activeVmAddress as `0x${string}`,
    abi: SUBDOMAIN_VENDING_MACHINE_ABI,
    functionName: "resolver",
    query: { enabled: !!activeVmAddress },
  });

  const { data: subnode } = useReadContract({
    address: activeVmAddress as `0x${string}`,
    abi: SUBDOMAIN_VENDING_MACHINE_ABI,
    functionName: "subnodeOf",
    args: subdomainLabel.trim() ? [subdomainLabel.trim()] : undefined,
    query: {
      enabled: !!subdomainLabel.trim() && !!activeVmAddress,
    },
  });

  const { data: subdomainOwner } = useReadContract({
    address: registryAddress as `0x${string}`,
    abi: RNS_REGISTRY_ABI,
    functionName: "owner",
    args: subnode ? [subnode] : undefined,
    query: {
      enabled: !!subnode && !!registryAddress,
    },
  });

  const isOwner =
    isConnected &&
    address &&
    subdomainOwner &&
    address.toLowerCase() === subdomainOwner.toLowerCase();

  const { data: currentAddress } = useReadContract({
    address: resolverAddress as `0x${string}`,
    abi: RNS_RESOLVER_ABI,
    functionName: "addr",
    args: subnode ? [subnode] : undefined,
    query: {
      enabled: !!subnode && !!resolverAddress && isOwner,
    },
  });

  const { data: currentText } = useReadContract({
    address: resolverAddress as `0x${string}`,
    abi: RNS_RESOLVER_ABI,
    functionName: "text",
    args: subnode && textKey ? [subnode, textKey] : undefined,
    query: {
      enabled: !!subnode && !!resolverAddress && !!textKey && isOwner,
    },
  });

  const { writeContract: setAddrWrite, data: setAddrHash } = useWriteContract();
  const { writeContract: setTextWrite, data: setTextHash } = useWriteContract();

  const { isLoading: isSettingAddr } = useWaitForTransactionReceipt({
    hash: setAddrHash,
  });
  const { isLoading: isSettingText } = useWaitForTransactionReceipt({
    hash: setTextHash,
  });

  useEffect(() => {
    if (currentAddress) {
      setNewAddress(currentAddress);
    }
  }, [currentAddress]);

  useEffect(() => {
    if (currentText) {
      setTextValue(currentText);
    }
  }, [currentText]);

  const handleSetAddress = () => {
    if (!subnode || !newAddress) return;
    setAddrWrite({
      address: resolverAddress as `0x${string}`,
      abi: RNS_RESOLVER_ABI,
      functionName: "setAddr",
      args: [subnode, newAddress as `0x${string}`],
    });
  };

  const handleSetText = () => {
    if (!subnode || !textKey || !textValue) return;
    setTextWrite({
      address: resolverAddress as `0x${string}`,
      abi: RNS_RESOLVER_ABI,
      functionName: "setText",
      args: [subnode, textKey, textValue],
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">
              Record Management
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Set address and text records for subdomains you minted
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

        <div className="max-w-2xl mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Ownership:</strong> You own <em>subdomains you minted</em> (e.g. player1.random1996.rsk). Enter the label you minted (e.g. player1) below. The parent domain is owned by the vending machine—that&apos;s correct.
          </p>
        </div>

        {!isConnected ? (
          <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-8 border border-zinc-200 dark:border-zinc-700 text-center">
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Please connect your wallet to manage records
            </p>
            <ConnectButton />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 border border-zinc-200 dark:border-zinc-700">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Parent Domain
              </label>
              <input
                type="text"
                value={parentDomain}
                onChange={(e) => setParentDomain(e.target.value)}
                placeholder="random1996.rsk"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white mb-4"
              />
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Subdomain Label (the part you minted, e.g. player1)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={subdomainLabel}
                  onChange={(e) => setSubdomainLabel(e.target.value)}
                  placeholder="player1"
                  className="flex-1 px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="px-4 py-3 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg font-mono">
                  .{parentDomain || "domain.rsk"}
                </span>
              </div>
              {subdomainLabel.trim() && (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {isOwner ? (
                    <span className="text-green-600">✅ You own this subdomain</span>
                  ) : subdomainOwner ? (
                    <span className="text-red-600">
                      ❌ You don't own this subdomain (Owner: {subdomainOwner.slice(0, 6)}...
                      {subdomainOwner.slice(-4)})
                    </span>
                  ) : (
                    <span className="text-yellow-600">Checking ownership...</span>
                  )}
                </p>
              )}
            </div>

            {isOwner && (
              <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 border border-zinc-200 dark:border-zinc-700">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
                  Address Record
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Set the RSK address that your subdomain resolves to
                </p>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-mono"
                  />
                  <button
                    onClick={handleSetAddress}
                    disabled={!newAddress || isSettingAddr}
                    className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isSettingAddr ? "Setting..." : "Set Address"}
                  </button>
                  {setAddrHash && (
                    <a
                      href={`https://explorer.testnet.rootstock.io/tx/${setAddrHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Transaction
                    </a>
                  )}
                </div>
              </div>
            )}

            {isOwner && (
              <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 border border-zinc-200 dark:border-zinc-700">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
                  Text Records
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Set metadata for your subdomain (e.g., description, url, email)
                </p>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={textKey}
                    onChange={(e) => setTextKey(e.target.value)}
                    placeholder="Key (e.g., description, url, email)"
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                  <textarea
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                    placeholder="Value"
                    rows={3}
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                  <button
                    onClick={handleSetText}
                    disabled={!textKey || !textValue || isSettingText}
                    className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isSettingText ? "Setting..." : "Set Text Record"}
                  </button>
                  {setTextHash && (
                    <a
                      href={`https://explorer.testnet.rootstock.io/tx/${setTextHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Transaction
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

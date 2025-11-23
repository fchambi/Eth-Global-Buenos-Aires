"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { formatEther, parseEther } from "viem";
import { AssetSelector, Asset } from "~~/components/AssetSelector";
import { useScaffoldReadContract, useScaffoldWriteContract, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { Address } from "@scaffold-ui/components";

const RouletteGame: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<Asset | null>(null);
  const [lastWon, setLastWon] = useState<boolean | null>(null);
  const [pendingSequenceNumber, setPendingSequenceNumber] = useState<bigint | null>(null);

  // Read current day
  const { data: currentDay } = useScaffoldReadContract({
    contractName: "CryptoRoulette",
    functionName: "getCurrentDay",
  });

  // Read total spin cost
  const { data: totalSpinCost } = useScaffoldReadContract({
    contractName: "CryptoRoulette",
    functionName: "getTotalSpinCost",
  });

  // Read ticket price
  const { data: ticketPrice } = useScaffoldReadContract({
    contractName: "CryptoRoulette",
    functionName: "ticketPrice",
  });

  // Write contract hook
  const { writeContractAsync: writeRouletteAsync } = useScaffoldWriteContract({
    contractName: "CryptoRoulette",
  });

  // Listen for SpinRequested events from the current user
  const { data: spinRequestedEvents } = useScaffoldEventHistory({
    contractName: "CryptoRoulette",
    eventName: "SpinRequested",
    fromBlock: BigInt(36038675), // Block where contract was deployed on Optimism Sepolia
    watch: true,
  });

  // Listen for SpinCompleted events
  const { data: spinCompletedEvents } = useScaffoldEventHistory({
    contractName: "CryptoRoulette",
    eventName: "SpinCompleted",
    fromBlock: BigInt(36038675), // Block where contract was deployed on Optimism Sepolia
    watch: true,
  });

  // Debugging: Log events
  useEffect(() => {
    console.log("📊 SpinRequested Events:", spinRequestedEvents?.length || 0);
    console.log("📊 SpinCompleted Events:", spinCompletedEvents?.length || 0);
    console.log("🎲 Pending Sequence Number:", pendingSequenceNumber);
    
    // Log detailed info of last completed event
    if (spinCompletedEvents && spinCompletedEvents.length > 0) {
      const lastEvent = spinCompletedEvents[spinCompletedEvents.length - 1];
      console.log("🔍 Last SpinCompleted Event Details:", {
        sequenceNumber: lastEvent.args.sequenceNumber?.toString(),
        result: lastEvent.args.result,
        resultNumber: Number(lastEvent.args.result),
        won: lastEvent.args.won,
        player: lastEvent.args.player,
      });
    }
  }, [spinRequestedEvents, spinCompletedEvents, pendingSequenceNumber]);

  // Monitor for completed spins
  useEffect(() => {
    if (pendingSequenceNumber && spinCompletedEvents) {
      const completedSpin = spinCompletedEvents.find(
        event => event.args.sequenceNumber === pendingSequenceNumber,
      );

      if (completedSpin) {
        // Map the result number to asset
        const assetNames: Asset[] = ["BTC", "ETH", "SOL", "AVAX", "DOGE"];
        const resultAsset = assetNames[Number(completedSpin.args.result)];

        console.log("✅ Spin completed! Result:", resultAsset, "Won:", completedSpin.args.won);
        setLastResult(resultAsset);
        setLastWon(completedSpin.args.won || false);
        setIsSpinning(false);
        setPendingSequenceNumber(null);
      }
    }
  }, [spinCompletedEvents, pendingSequenceNumber]);

  // Add timeout for Pyth Entropy callback (60 seconds)
  useEffect(() => {
    if (isSpinning && pendingSequenceNumber) {
      console.log("⏳ Waiting for Pyth Entropy callback... Sequence:", pendingSequenceNumber);
      
      const timeout = setTimeout(() => {
        console.error("⚠️ TIMEOUT: Pyth Entropy callback did not arrive after 60 seconds");
        console.error("This might mean:");
        console.error("1. Pyth Entropy providers are not active on Optimism Sepolia");
        console.error("2. The entropy address is incorrect");
        console.error("3. There's an issue with the callback function");
        
        setIsSpinning(false);
        alert("Timeout: Pyth Entropy callback did not arrive. Please check the console for details.");
      }, 60000);

      return () => clearTimeout(timeout);
    }
  }, [isSpinning, pendingSequenceNumber]);

  const handleSpin = async () => {
    if (!selectedAsset || !totalSpinCost) return;

    try {
      setIsSpinning(true);
      setLastResult(null);
      setLastWon(null);

      // Map asset to index (0-4)
      const assetIndex = ["BTC", "ETH", "SOL", "AVAX", "DOGE"].indexOf(selectedAsset);

      // Call spinRoulette with the correct value
      await writeRouletteAsync({
        functionName: "spinRoulette",
        args: [BigInt(assetIndex)],
        value: totalSpinCost,
      });

      // Get the latest SpinRequested event for this user
      if (spinRequestedEvents && spinRequestedEvents.length > 0) {
        const latestEvent = spinRequestedEvents[spinRequestedEvents.length - 1];
        setPendingSequenceNumber(latestEvent.args.sequenceNumber || null);
      }
    } catch (error) {
      console.error("Error spinning roulette:", error);
      setIsSpinning(false);
    }
  };

  // Get user's recent spins (reversed for display)
  const userSpins = useMemo(() => {
    const filtered = spinCompletedEvents?.filter(event => event.args.player === connectedAddress) || [];
    return [...filtered].slice(-5).reverse();
  }, [spinCompletedEvents, connectedAddress]);

  return (
    <div className="flex items-center flex-col grow pt-10 px-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Crypto Roulette
          </h1>
          <p className="text-xl text-gray-600">Guess the crypto, win big!</p>
        </div>

        {/* Game Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-base-100 rounded-xl p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Current Day</h3>
            <p className="text-3xl font-bold">{currentDay?.toString() || "..."}</p>
          </div>
          <div className="bg-base-100 rounded-xl p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Spin Cost</h3>
            <p className="text-3xl font-bold">
              {totalSpinCost ? `${formatEther(totalSpinCost)} ETH` : "..."}
            </p>
          </div>
          <div className="bg-base-100 rounded-xl p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Ticket Price</h3>
            <p className="text-3xl font-bold">{ticketPrice ? `${formatEther(ticketPrice)} ETH` : "..."}</p>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="bg-base-100 rounded-2xl p-8 shadow-xl mb-8">
          <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
            {/* Asset Selection */}
            <AssetSelector
              selectedAsset={selectedAsset}
              onSelectAsset={setSelectedAsset}
              disabled={isSpinning}
            />

            {/* Spin Button */}
            <button
              onClick={handleSpin}
              disabled={!selectedAsset || isSpinning || !connectedAddress}
              className={`
                w-full py-4 px-8 rounded-xl font-bold text-2xl text-white
                transition-all transform
                ${
                  !selectedAsset || isSpinning || !connectedAddress
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-105"
                }
              `}
            >
              {isSpinning ? "Spinning..." : !connectedAddress ? "Connect Wallet" : "SPIN!"}
            </button>

            {/* Good Luck Message */}
            {isSpinning && (
              <div className="w-full p-6 rounded-xl bg-blue-50 border-2 border-blue-300 text-center animate-pulse">
                <p className="text-lg font-semibold text-blue-800">
                  🍀 ¡Buena suerte! Refresca si fuiste el ganador
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Spins History */}
        <div className="bg-base-100 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Your Recent Spins</h2>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-sm btn-outline"
            >
              🔄 Refresh
            </button>
          </div>
          {userSpins.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No spins yet. Try your luck!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Sequence #</th>
                    <th>Result</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {userSpins.map((spin, idx) => {
                    const assetNames: Asset[] = ["BTC", "ETH", "SOL", "AVAX", "DOGE"];
                    const resultAsset = assetNames[Number(spin.args.result)];
                    return (
                      <tr key={idx}>
                        <td>{spin.args.sequenceNumber?.toString()}</td>
                        <td className="font-bold">{resultAsset}</td>
                        <td>
                          {spin.args.won ? (
                            <span className="badge badge-success">Won</span>
                          ) : (
                            <span className="badge badge-error">Lost</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouletteGame;


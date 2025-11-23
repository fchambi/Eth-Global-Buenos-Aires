"use client";

import React, { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { formatEther, parseEther } from "viem";
import { AssetSelector, Asset } from "~~/components/AssetSelector";
import { CryptoRouletteWheel } from "~~/components/CryptoRouletteWheel";
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
    fromBlock: 0n,
    watch: true,
  });

  // Listen for SpinCompleted events
  const { data: spinCompletedEvents } = useScaffoldEventHistory({
    contractName: "CryptoRoulette",
    eventName: "SpinCompleted",
    fromBlock: 0n,
    watch: true,
  });

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

        setLastResult(resultAsset);
        setLastWon(completedSpin.args.won || false);
        setIsSpinning(false);
        setPendingSequenceNumber(null);
      }
    }
  }, [spinCompletedEvents, pendingSequenceNumber]);

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

  // Get user's recent spins
  const userSpins = spinCompletedEvents?.filter(event => event.args.player === connectedAddress).slice(-5) || [];

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left side - Wheel */}
            <div className="flex items-center justify-center">
              <CryptoRouletteWheel isSpinning={isSpinning} result={lastResult} />
            </div>

            {/* Right side - Controls */}
            <div className="flex flex-col justify-center gap-6">
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
                  py-4 px-8 rounded-xl font-bold text-2xl text-white
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

              {/* Result Display */}
              {lastResult && !isSpinning && (
                <div
                  className={`p-6 rounded-xl text-center ${
                    lastWon ? "bg-green-100 border-4 border-green-500" : "bg-red-100 border-4 border-red-500"
                  }`}
                >
                  <p className="text-2xl font-bold mb-2">{lastWon ? "🎉 YOU WON!" : "😢 Try Again!"}</p>
                  <p className="text-lg">
                    Result: <span className="font-bold">{lastResult}</span>
                  </p>
                  {lastWon && <p className="text-sm mt-2">You've been added to today's lottery!</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Spins History */}
        <div className="bg-base-100 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4">Your Recent Spins</h2>
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
                  {userSpins.reverse().map((spin, idx) => {
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


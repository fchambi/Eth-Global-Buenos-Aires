"use client";

import React, { useMemo } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { useScaffoldReadContract, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { Address } from "@scaffold-ui/components";

const LotteryPage: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  // Read current day from CryptoRoulette
  const { data: currentDay } = useScaffoldReadContract({
    contractName: "CryptoRoulette",
    functionName: "getCurrentDay",
  });

  // Read pool amount for current day
  const { data: poolAmount } = useScaffoldReadContract({
    contractName: "DailyLottery",
    functionName: "getPoolAmount",
    args: currentDay !== undefined ? [currentDay] : undefined,
  });

  // Read whitelist size for current day
  const { data: whitelistSize } = useScaffoldReadContract({
    contractName: "DailyLottery",
    functionName: "getWhitelistSize",
    args: currentDay !== undefined ? [currentDay] : undefined,
  });

  // Read full whitelist for current day
  const { data: whitelist } = useScaffoldReadContract({
    contractName: "DailyLottery",
    functionName: "getWhitelist",
    args: currentDay !== undefined ? [currentDay] : undefined,
  });

  // Check if user is in whitelist
  const userEntries = useMemo(() => {
    if (!whitelist || !connectedAddress) return 0;
    return whitelist.filter((addr: string) => addr.toLowerCase() === connectedAddress.toLowerCase()).length;
  }, [whitelist, connectedAddress]);

  // Listen for WinnerSelected events
  const { data: winnerEvents } = useScaffoldEventHistory({
    contractName: "DailyLottery",
    eventName: "WinnerSelected",
    fromBlock: 0n,
    watch: true,
  });

  // Get last 5 winners
  const recentWinners = winnerEvents?.slice(-5).reverse() || [];

  return (
    <div className="flex items-center flex-col grow pt-10 px-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">
            Daily Lottery
          </h1>
          <p className="text-xl text-gray-600">Win the roulette to join today's lottery!</p>
        </div>

        {/* Current Day Info */}
        <div className="bg-base-100 rounded-2xl p-8 shadow-xl mb-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">Day {currentDay?.toString() || "..."}</h2>
            <p className="text-gray-600">Current lottery status</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Prize Pool */}
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
              <h3 className="text-sm font-semibold mb-2 opacity-90">Prize Pool</h3>
              <p className="text-4xl font-bold">{poolAmount ? `${formatEther(poolAmount)} ETH` : "0 ETH"}</p>
              <p className="text-xs mt-2 opacity-75">Total accumulated</p>
            </div>

            {/* Total Entries */}
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <h3 className="text-sm font-semibold mb-2 opacity-90">Total Entries</h3>
              <p className="text-4xl font-bold">{whitelistSize?.toString() || "0"}</p>
              <p className="text-xs mt-2 opacity-75">Participants today</p>
            </div>

            {/* Your Entries */}
            <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <h3 className="text-sm font-semibold mb-2 opacity-90">Your Entries</h3>
              <p className="text-4xl font-bold">{userEntries}</p>
              <p className="text-xs mt-2 opacity-75">
                {userEntries === 0 ? "Win roulette to participate!" : "Good luck!"}
              </p>
            </div>
          </div>

          {/* User Status */}
          {connectedAddress && (
            <div className="mt-6 p-4 bg-base-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Your Address</p>
                  <Address address={connectedAddress} />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Status</p>
                  {userEntries > 0 ? (
                    <span className="badge badge-success badge-lg">Eligible ✓</span>
                  ) : (
                    <span className="badge badge-warning badge-lg">Not Eligible</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="bg-base-100 rounded-2xl p-8 shadow-xl mb-8">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold">Play the Roulette</h3>
                <p className="text-gray-600">Win the crypto roulette game to get added to today's lottery whitelist</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold">Multiple Entries</h3>
                <p className="text-gray-600">Win multiple times to get more entries and increase your chances!</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold">Daily Draw</h3>
                <p className="text-gray-600">
                  At the end of the day, one lucky winner is randomly selected to win the entire pool!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Winners */}
        <div className="bg-base-100 rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-4">Recent Winners</h2>
          {recentWinners.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No winners yet. Be the first!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Winner</th>
                    <th>Prize</th>
                  </tr>
                </thead>
                <tbody>
                  {recentWinners.map((event, idx) => (
                    <tr key={idx}>
                      <td className="font-bold">Day {event.args.day?.toString()}</td>
                      <td>
                        <Address address={event.args.winner} />
                      </td>
                      <td className="font-bold text-green-600">
                        {event.args.prize ? `${formatEther(event.args.prize)} ETH` : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LotteryPage;


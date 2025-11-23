"use client";

import Link from "next/link";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { hardhat } from "viem/chains";
import { useAccount } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon, CurrencyDollarIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        {/* Hero Section */}
        <div className="px-5 text-center mb-12">
          <h1 className="text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Crypto Roulette
            </span>
          </h1>
          <p className="text-2xl text-gray-600 mb-6">Spin the wheel, win crypto, and join the daily lottery!</p>
          <div className="flex justify-center items-center space-x-2 flex-col">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address
              address={connectedAddress}
              chain={targetNetwork}
              blockExplorerAddressLink={
                targetNetwork.id === hardhat.id ? `/blockexplorer/address/${connectedAddress}` : undefined
              }
            />
          </div>
        </div>

        {/* Game Cards */}
        <div className="w-full max-w-6xl px-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Roulette Card */}
            <Link href="/roulette">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl hover:scale-105 transition-transform cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  <SparklesIcon className="h-12 w-12" />
                  <h2 className="text-3xl font-bold">Crypto Roulette</h2>
                </div>
                <p className="text-lg mb-6 opacity-90">
                  Guess which crypto will be selected! Win to join today's lottery and get a chance at the jackpot.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold bg-white/20 px-4 py-2 rounded-full">🎰 5 Cryptos</span>
                  <span className="text-sm font-semibold bg-white/20 px-4 py-2 rounded-full">⚡ Instant Results</span>
                </div>
                <div className="mt-6 text-right">
                  <span className="text-xl font-bold">Play Now →</span>
                </div>
              </div>
            </Link>

            {/* Lottery Card */}
            <Link href="/lottery">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl p-8 text-white shadow-2xl hover:scale-105 transition-transform cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  <CurrencyDollarIcon className="h-12 w-12" />
                  <h2 className="text-3xl font-bold">Daily Lottery</h2>
                </div>
                <p className="text-lg mb-6 opacity-90">
                  Win the roulette to join! One lucky winner takes the entire daily prize pool at the end of each day.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold bg-white/20 px-4 py-2 rounded-full">💰 Big Prizes</span>
                  <span className="text-sm font-semibold bg-white/20 px-4 py-2 rounded-full">🎲 Fair & Random</span>
                </div>
                <div className="mt-6 text-right">
                  <span className="text-xl font-bold">View Lottery →</span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* How It Works */}
        <div className="w-full max-w-6xl px-8 mb-12">
          <div className="bg-base-100 rounded-3xl p-8 shadow-xl">
            <h2 className="text-3xl font-bold mb-6 text-center">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold mb-2">Play Roulette</h3>
                <p className="text-gray-600">Pick your crypto and spin the wheel. Guess correctly to win!</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold mb-2">Join Lottery</h3>
                <p className="text-gray-600">Winners are automatically added to today's lottery whitelist.</p>
              </div>
              <div className="text-center">
                <div className="bg-pink-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold mb-2">Win Big</h3>
                <p className="text-gray-600">One winner takes home the entire daily prize pool!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Developer Tools */}
        <div className="grow bg-base-300 w-full px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col md:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <BugAntIcon className="h-8 w-8 fill-secondary" />
              <p>
                Tinker with your smart contract using the{" "}
                <Link href="/debug" passHref className="link">
                  Debug Contracts
                </Link>{" "}
                tab.
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
              <p>
                Explore your local transactions with the{" "}
                <Link href="/blockexplorer" passHref className="link">
                  Block Explorer
                </Link>{" "}
                tab.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;

"use client";

import React from "react";
import { Asset } from "./AssetSelector";

interface CryptoRouletteWheelProps {
  isSpinning: boolean;
  result: Asset | null;
}

const assets: Asset[] = ["BTC", "ETH", "SOL", "AVAX", "DOGE"];

const assetColors: Record<Asset, string> = {
  BTC: "#f7931a",
  ETH: "#627eea",
  SOL: "#9945ff",
  AVAX: "#e84142",
  DOGE: "#c2a633",
};

export const CryptoRouletteWheel: React.FC<CryptoRouletteWheelProps> = ({ isSpinning, result }) => {
  // Calculate rotation based on result
  const getRotation = () => {
    if (!result) return 0;
    const index = assets.indexOf(result);
    // Each segment is 72 degrees (360/5)
    // Add extra rotations for visual effect
    const baseRotation = 360 * 5; // 5 full rotations
    const segmentRotation = index * 72;
    return baseRotation + segmentRotation;
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-80 h-80">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-white"></div>
        </div>

        {/* Wheel */}
        <div
          className={`w-full h-full rounded-full relative overflow-hidden shadow-2xl border-8 border-white ${
            isSpinning ? "animate-spin-wheel" : ""
          }`}
          style={{
            transform: !isSpinning && result ? `rotate(${getRotation()}deg)` : undefined,
            transition: !isSpinning && result ? "transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : undefined,
          }}
        >
          {assets.map((asset, index) => {
            const rotation = index * 72; // 360/5
            return (
              <div
                key={asset}
                className="absolute w-full h-full"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  clipPath: "polygon(50% 50%, 100% 0%, 100% 100%)",
                  background: assetColors[asset],
                }}
              >
                <div
                  className="absolute top-1/4 left-2/3 text-white font-bold text-2xl"
                  style={{
                    transform: `rotate(36deg)`,
                  }}
                >
                  {asset}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Result Display */}
      {result && !isSpinning && (
        <div className="text-center">
          <p className="text-xl font-bold">Result:</p>
          <p
            className="text-4xl font-bold mt-2"
            style={{
              color: assetColors[result],
            }}
          >
            {result}
          </p>
        </div>
      )}

      {/* Add custom keyframes in global styles */}
      <style jsx global>{`
        @keyframes spin-wheel {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(1800deg);
          }
        }

        .animate-spin-wheel {
          animation: spin-wheel 2s cubic-bezier(0.17, 0.67, 0.12, 0.99) infinite;
        }
      `}</style>
    </div>
  );
};


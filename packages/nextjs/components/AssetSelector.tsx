"use client";

import React from "react";

export type Asset = "BTC" | "ETH" | "SOL" | "AVAX" | "DOGE";

interface AssetSelectorProps {
  selectedAsset: Asset | null;
  onSelectAsset: (asset: Asset) => void;
  disabled?: boolean;
}

const assets: Asset[] = ["BTC", "ETH", "SOL", "AVAX", "DOGE"];

const assetColors: Record<Asset, string> = {
  BTC: "bg-orange-500 hover:bg-orange-600",
  ETH: "bg-blue-500 hover:bg-blue-600",
  SOL: "bg-purple-500 hover:bg-purple-600",
  AVAX: "bg-red-500 hover:bg-red-600",
  DOGE: "bg-yellow-500 hover:bg-yellow-600",
};

export const AssetSelector: React.FC<AssetSelectorProps> = ({ selectedAsset, onSelectAsset, disabled = false }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-xl font-bold">Choose Your Crypto</h3>
      <div className="grid grid-cols-5 gap-3 w-full max-w-2xl">
        {assets.map(asset => (
          <button
            key={asset}
            onClick={() => onSelectAsset(asset)}
            disabled={disabled}
            className={`
              py-6 px-4 rounded-xl font-bold text-lg text-white
              transition-all transform
              ${selectedAsset === asset ? "ring-4 ring-white scale-110" : "scale-100"}
              ${disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}
              ${assetColors[asset]}
            `}
          >
            {asset}
          </button>
        ))}
      </div>
    </div>
  );
};


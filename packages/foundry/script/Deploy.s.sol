//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import { DeployYourContract } from "./DeployYourContract.s.sol";
import { DeployCryptoRoulette } from "./DeployCryptoRoulette.s.sol";

/**
 * @notice Main deployment script for all contracts
 * @dev Run this when you want to deploy multiple contracts at once
 *
 * Example: yarn deploy # runs this script(without`--file` flag)
 */
contract DeployScript is ScaffoldETHDeploy {
    function run() external {
        // Deploys all your contracts sequentially
        // Add new deployments here when needed

        // Deploy CryptoRoulette and DailyLottery
        DeployCryptoRoulette deployCryptoRoulette = new DeployCryptoRoulette();
        deployCryptoRoulette.run();

        // Deploy YourContract (for reference/testing)
        DeployYourContract deployYourContract = new DeployYourContract();
        deployYourContract.run();
    }
}

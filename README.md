# 🎰 Crypto Roulette & Daily Lottery

> **Verifiable On-Chain Randomness Powered by Pyth Entropy V2**

![Solidity](https://img.shields.io/badge/Solidity-0.8.13-363636?style=flat&logo=solidity)
![Optimism Sepolia](https://img.shields.io/badge/Network-Optimism%20Sepolia-red?style=flat)
![Foundry](https://img.shields.io/badge/Built%20with-Foundry-orange?style=flat)
![Scaffold-ETH 2](https://img.shields.io/badge/Framework-Scaffold--ETH%202-blue?style=flat)

**Built for ETH Global Buenos Aires Hackathon | Pyth Entropy Pool Prize**

---

## 📖 Overview

**Crypto Roulette & Daily Lottery** is an innovative decentralized gaming platform that combines two interconnected games powered by verifiable on-chain randomness from **Pyth Entropy V2**. 

### The Problem
Traditional on-chain gaming faces a critical challenge: **how to generate truly random, unpredictable, and verifiable outcomes without centralized trust**. Many solutions either rely on manipulable block hashes or expensive off-chain oracles.

### Our Solution
We leverage **Pyth Entropy V2** - a cutting-edge protocol that enables permissionless, verifiable random number generation directly on-chain. This ensures:
- ✅ **Cryptographically Secure**: Numbers are provably random
- ✅ **Transparent**: All results verifiable on-chain
- ✅ **Fair**: No possibility of manipulation by players or operators
- ✅ **Efficient**: Low latency with minimal gas costs

### The Games

1. **🎲 Crypto Roulette**: Players guess which cryptocurrency (BTC, ETH, SOL, AVAX, or DOGE) will be randomly selected. Winning gets you into the daily lottery whitelist!

2. **🎁 Daily Lottery**: An exclusive lottery where only roulette winners can participate. One lucky winner takes the entire accumulated prize pool each day!

---

## 🔮 Pyth Entropy Integration

### Why Pyth Entropy?

Pyth Entropy V2 represents the gold standard for on-chain randomness:

- **Verifiable Randomness**: Uses cryptographic commitments to ensure results cannot be predicted or manipulated
- **Permissionless**: Anyone can request random numbers without special permissions
- **On-Chain Native**: Numbers generated and verified entirely on-chain
- **Low Latency**: Fast callback mechanism (typically 5-30 seconds)
- **Battle-Tested**: Audited and used by major DeFi protocols

### How We Use Pyth Entropy

Both our smart contracts implement the `IEntropyConsumer` interface and follow Pyth's two-step randomness pattern:

#### 1️⃣ **CryptoRoulette Contract** - Determining Roulette Outcomes

When a player spins the roulette, we request randomness from Pyth:

```solidity
function spinRoulette(Asset _guess) external payable {
    // Get entropy fee
    uint128 entropyFee = entropy.getFeeV2();
    require(msg.value >= entropyFee + ticketPrice, "Insufficient payment");
    
    // Request random number from Pyth Entropy
    uint64 sequenceNumber = entropy.requestV2{ value: entropyFee }();
    
    // Store spin request
    spins[sequenceNumber] = SpinRequest({
        player: msg.sender,
        guessedAsset: _guess,
        day: currentDay,
        fulfilled: false,
        resultAsset: Asset.BTC,
        won: false
    });
    
    emit SpinRequested(msg.sender, sequenceNumber, _guess, currentDay);
}
```

Pyth Entropy then calls back with the random result:

```solidity
function entropyCallback(
    uint64 sequenceNumber,
    address,
    bytes32 randomNumber
) internal override {
    SpinRequest storage spin = spins[sequenceNumber];
    require(!spin.fulfilled, "Already fulfilled");
    
    // Use random number to determine outcome (0-4 for 5 assets)
    uint256 randomIndex = uint256(randomNumber) % 5;
    Asset resultAsset = Asset(randomIndex);
    
    bool won = (resultAsset == spin.guessedAsset);
    
    spin.resultAsset = resultAsset;
    spin.won = won;
    spin.fulfilled = true;
    
    // If player won, add them to lottery whitelist
    if (won) {
        lotteryContract.addToWhitelist(spin.player, spin.day);
    }
    
    emit SpinCompleted(sequenceNumber, spin.player, resultAsset, won);
}
```

#### 2️⃣ **DailyLottery Contract** - Selecting Random Winners

When the owner triggers the daily draw, we again use Pyth Entropy:

```solidity
function startDailyDraw(uint256 day) external payable onlyOwner {
    require(!dayCompleted[day], "Day already completed");
    require(dailyWhitelist[day].length > 0, "Whitelist empty");
    require(dailyPool[day] > 0, "Pool empty");
    
    // Request random number for winner selection
    uint128 entropyFee = entropy.getFeeV2();
    require(msg.value >= entropyFee, "Insufficient entropy fee");
    
    uint64 sequenceNumber = entropy.requestV2{ value: entropyFee }();
    
    draws[sequenceNumber] = DrawRequest({
        day: day,
        fulfilled: false,
        winner: address(0),
        prize: dailyPool[day]
    });
    
    emit DrawRequested(day, sequenceNumber, dailyWhitelist[day].length, dailyPool[day]);
}
```

And the callback selects the winner:

```solidity
function entropyCallback(
    uint64 sequenceNumber,
    address,
    bytes32 randomNumber
) internal override {
    DrawRequest storage draw = draws[sequenceNumber];
    require(!draw.fulfilled, "Already fulfilled");
    
    address[] storage whitelist = dailyWhitelist[draw.day];
    
    // Use random number to pick winner from whitelist
    uint256 winnerIndex = uint256(randomNumber) % whitelist.length;
    address winner = whitelist[winnerIndex];
    
    // Transfer prize to winner
    (bool success, ) = winner.call{ value: draw.prize }("");
    require(success, "Transfer failed");
    
    draw.winner = winner;
    draw.fulfilled = true;
    dayCompleted[draw.day] = true;
    
    emit WinnerSelected(draw.day, winner, draw.prize);
}
```

### The Entropy Callback Pattern

The two-step process ensures security:

1. **Request Phase**: Contract requests randomness and emits an event
2. **Callback Phase**: Pyth's provider generates the random number off-chain and submits it back on-chain, where it's verified cryptographically before the callback executes

This prevents:
- ❌ Front-running attacks
- ❌ Result manipulation
- ❌ Transaction reversion exploits
- ❌ Block hash prediction

---

## 🏗️ Architecture & Design

### System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         PLAYER                               │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   1. PLAY ROULETTE                           │
│  • Select crypto asset (BTC/ETH/SOL/AVAX/DOGE)              │
│  • Pay: Entropy Fee (~0.0001 ETH) + Ticket (0.001 ETH)     │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│              CRYPTOROULETTE CONTRACT                         │
│  • Calls: entropy.requestV2()                               │
│  • Emits: SpinRequested event                               │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   PYTH ENTROPY V2                            │
│  • Generates secure random number off-chain                 │
│  • Submits back on-chain with cryptographic proof           │
│  • Calls: entropyCallback() [5-30 seconds]                  │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│         2. ROULETTE RESULT DETERMINED                        │
│  • Random number % 5 = Winning asset                        │
│  • If WIN: Add player to lottery whitelist                  │
│  • Ticket price → Daily lottery pool (always)               │
│  • Emits: SpinCompleted event                               │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                  DAILYLOTTERY CONTRACT                       │
│  • dailyWhitelist[day] ← Winner address                     │
│  • dailyPool[day] += Ticket price                           │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│            3. DAILY DRAW (Owner Triggered)                   │
│  • Owner calls: startDailyDraw(day)                         │
│  • Calls: entropy.requestV2()                               │
│  • Emits: DrawRequested event                               │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   PYTH ENTROPY V2                            │
│  • Generates secure random number                           │
│  • Calls: entropyCallback() on DailyLottery                │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│              4. LOTTERY WINNER SELECTED                      │
│  • Random number % whitelist.length = Winner index          │
│  • Transfer entire pool to winner                           │
│  • Mark day as completed                                    │
│  • Emits: WinnerSelected event                              │
└─────────────────────────────────────────────────────────────┘
```

### Contract Interaction Diagram

```
┌──────────────────┐         ┌──────────────────┐
│                  │         │                  │
│  CryptoRoulette  │◄───────►│  DailyLottery   │
│                  │         │                  │
└────────┬─────────┘         └────────┬─────────┘
         │                            │
         │ requestV2()                │ requestV2()
         │ entropyCallback()          │ entropyCallback()
         │                            │
         └──────────┬─────────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │                  │
         │  Pyth Entropy V2 │
         │  (0x4821932D...) │
         │                  │
         └──────────────────┘
```

---

## 📜 Smart Contracts

### CryptoRoulette.sol

The roulette game contract that manages player spins and outcomes.

**Key Functions:**
- `spinRoulette(Asset _guess)`: Player initiates a spin by guessing an asset
- `entropyCallback()`: Receives random number and determines winner
- `getEntropyFee()`: Returns current Pyth Entropy fee
- `getCurrentDay()`: Returns current day for lottery tracking

**Key Features:**
- 5 crypto assets: BTC (0), ETH (1), SOL (2), AVAX (3), DOGE (4)
- 20% win probability (1 in 5 chance)
- Winners automatically added to lottery whitelist
- All ticket prices fund the daily lottery pool
- Immutable entropy and lottery contract references

**Events:**
- `SpinRequested`: Emitted when player spins
- `SpinCompleted`: Emitted when result is determined

### DailyLottery.sol

The lottery contract that manages daily draws and prize distribution.

**Key Functions:**
- `addToWhitelist(address player, uint256 day)`: Adds roulette winner to lottery (only callable by roulette contract)
- `addToPool(uint256 day)`: Adds funds to daily prize pool (only callable by roulette contract)
- `startDailyDraw(uint256 day)`: Initiates random winner selection (owner only)
- `entropyCallback()`: Receives random number and selects winner
- `emergencyWithdraw(uint256 day)`: Allows owner to withdraw unclaimed prizes after extended period

**Key Features:**
- Only roulette winners can win the lottery (whitelist-based)
- Winner-takes-all: entire daily pool goes to one lucky winner
- Day completion tracking prevents double draws
- Emergency withdrawal for unclaimed prizes
- Owner-controlled draw timing

**Events:**
- `PlayerWhitelisted`: Emitted when player joins lottery
- `PoolIncreased`: Emitted when pool grows
- `DrawRequested`: Emitted when draw is initiated
- `WinnerSelected`: Emitted when winner is chosen

### IDailyLottery.sol

Interface defining the lottery contract's external functions for cross-contract communication.

---

## 🚀 Deployed Contracts

### Network: Optimism Sepolia (Chain ID: 11155420)

| Contract | Address | Explorer |
|----------|---------|----------|
| **CryptoRoulette** | `0x19aab2239911164c9051ccaed184102a10d7121f` | [View on Explorer](https://sepolia-optimism.etherscan.io/address/0x19aab2239911164c9051ccaed184102a10d7121f) |
| **DailyLottery** | `0x5149cc9f6c3a4b60cfa84125161e96b0cf677eb4` | [View on Explorer](https://sepolia-optimism.etherscan.io/address/0x5149cc9f6c3a4b60cfa84125161e96b0cf677eb4) |
| **Pyth Entropy V2** | `0x4821932D0CDd71225A6d914706A621e0389D7061` | [View on Explorer](https://sepolia-optimism.etherscan.io/address/0x4821932D0CDd71225A6d914706A621e0389D7061) |

**All contracts are verified and fully functional on Optimism Sepolia testnet.**

### Fees

- **Entropy Fee**: ~0.0001 ETH (dynamic, query with `entropy.getFeeV2()`)
- **Ticket Price**: 0.001 ETH (fixed)
- **Total to Spin**: ~0.0011 ETH

---

## ✨ Key Features

### 🎯 Provably Fair Randomness
Every outcome is determined by Pyth Entropy's verifiable random numbers. No one—not players, not operators—can predict or manipulate results.

### 🔗 Interconnected Game Economy
The two games work together: roulette ticket prices fund the lottery pool, and only roulette winners can win the lottery. This creates an engaging, self-sustaining ecosystem.

### 🔍 Transparent On-Chain Results
All spins, results, and lottery draws are recorded on-chain with events. Anyone can verify the fairness of every game.

### 💰 Winner-Takes-All Lottery
Unlike traditional lotteries with multiple prize tiers, our daily lottery gives the entire accumulated pool to one lucky winner, creating exciting high-stakes gameplay.

### 🛡️ Security First
- Owner-controlled lottery draws prevent premature executions
- Emergency withdrawal functions for edge cases
- Reentrancy protection on all payable functions
- Day completion tracking prevents double draws

---

## 🎮 User Flow

### Playing the Roulette

1. **Connect Wallet**: Connect your wallet to the dApp
2. **Choose Asset**: Select your guess (BTC, ETH, SOL, AVAX, or DOGE)
3. **Spin**: Click "SPIN!" and confirm transaction (~0.0011 ETH)
4. **Wait**: Pyth Entropy generates your result (5-30 seconds)
5. **Result**: See if you won! Winners join today's lottery

### Winning the Lottery

1. **Win Roulette**: First, you need to win at least one roulette spin
2. **Auto-Entry**: You're automatically entered into today's lottery
3. **Daily Draw**: Owner triggers draw at end of day
4. **Random Selection**: Pyth Entropy picks one winner from all roulette winners
5. **Prize Transfer**: Winner receives entire daily pool automatically

---

## 🛠️ Tech Stack

### Smart Contracts
- **Solidity**: v0.8.13
- **Foundry**: For development, testing, and deployment
- **OpenZeppelin**: For security patterns
- **Pyth Entropy SDK**: v2 for randomness

### Frontend
- **Scaffold-ETH 2**: Full-stack dApp framework
- **Next.js**: React framework with App Router
- **RainbowKit**: Wallet connection
- **Wagmi**: Ethereum React hooks
- **Viem**: Ethereum interactions
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Styling

### Infrastructure
- **Optimism Sepolia**: Layer 2 testnet deployment
- **Foundry Keystore**: Secure key management
- **Etherscan**: Contract verification

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= v20.18.3
- Yarn (v1 or v2+)
- Git
- Foundry ([Installation guide](https://book.getfoundry.sh/getting-started/installation))

### Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd pythglobal
```

2. **Install dependencies:**
```bash
yarn install
```

3. **Set up environment variables:**
```bash
cd packages/foundry
cp .env.example .env
# Edit .env with your values
```

### Deployment

#### Deploy to Local Network

1. **Start local blockchain:**
```bash
yarn chain
```

2. **Deploy contracts (in new terminal):**
```bash
yarn deploy
```

#### Deploy to Optimism Sepolia

1. **Create a keystore account:**
```bash
cd packages/foundry
cast wallet import deployer --interactive
# Enter your private key and password
```

2. **Get testnet ETH:**
   - Visit [Optimism Sepolia Faucet](https://www.optimism.io/faucet)
   - Request test ETH for your deployer address

3. **Deploy:**
```bash
yarn deploy --network optimismSepolia
```

4. **Verify contracts:**
```bash
forge verify-contract <CONTRACT_ADDRESS> \
  src/CryptoRoulette.sol:CryptoRoulette \
  --chain optimism-sepolia \
  --constructor-args $(cast abi-encode "constructor(address,address,uint256)" 0x4821932D0CDd71225A6d914706A621e0389D7061 <LOTTERY_ADDRESS> 1000000000000000)
```

### Running the Frontend

1. **Start the development server:**
```bash
yarn start
```

2. **Open your browser:**
   - Home: http://localhost:3000
   - Roulette: http://localhost:3000/roulette
   - Lottery: http://localhost:3000/lottery
   - Debug: http://localhost:3000/debug

3. **Connect your wallet** and start playing!

---

## 🎲 How to Play

### Roulette Instructions

1. Navigate to the **Roulette** page
2. Connect your wallet (ensure you have ~0.002 ETH for gas + fees)
3. Select your crypto asset guess (BTC, ETH, SOL, AVAX, or DOGE)
4. Click **"SPIN!"** and approve the transaction
5. Wait for Pyth Entropy to generate your result (~5-30 seconds)
6. Check your result:
   - **WIN**: You guessed correctly! 🎉 You're now in today's lottery
   - **LOSS**: Better luck next time! Your ticket still helps grow the lottery pool

### Lottery Participation

1. **Automatic Entry**: Win the roulette to automatically join today's lottery
2. **Check Status**: Visit the Lottery page to see:
   - Current prize pool
   - Number of eligible players
   - Your eligibility status
   - Recent winners
3. **Daily Draw**: The owner triggers the draw at the end of each day
4. **Winner Notification**: Winners receive their prize instantly and appear in "Recent Winners"

---

## 💡 Innovation Highlights

### 🌟 Dual-Game Ecosystem

Unlike standalone games, we've created an **interconnected gaming economy**:
- Roulette losers still contribute to the lottery pool
- Only skilled/lucky roulette winners can compete for the big prize
- Creates sustained engagement and excitement

### 🔮 Creative Use of Pyth Entropy

We leverage Pyth Entropy in **two distinct ways**:
1. **Roulette**: Continuous, high-frequency randomness for instant gameplay
2. **Lottery**: Periodic, high-stakes randomness for winner selection

This demonstrates Pyth Entropy's versatility across different gaming mechanics.

### 🎯 Fair Gaming Without Compromise

Traditional solutions often force a trade-off between:
- **On-chain** (manipulable) vs **Off-chain** (requires trust)
- **Fast** (predictable) vs **Secure** (slow)

With Pyth Entropy, we get the best of all worlds: **fast, secure, and trustless**.

### 💎 Economic Game Theory

Our design incentivizes positive behavior:
- Every roulette spin grows the lottery pool
- Only winners can compete for lottery prizes
- Creates a virtuous cycle of engagement

---

## 🔒 Security Considerations

### Access Control
- **Owner-only functions**: `startDailyDraw`, `emergencyWithdraw`, `setRouletteContract`
- **Contract-only functions**: `addToWhitelist`, `addToPool` (only callable by roulette)
- No user funds are controllable by owner

### Randomness Security
- **Pyth Entropy V2**: Industry-leading randomness provider
- **No manipulation**: Random numbers are cryptographically verified
- **No prediction**: Results cannot be known until after commitment

### Emergency Functions
- `emergencyWithdraw`: Owner can withdraw unclaimed prizes after extended period
- Prevents funds from being permanently locked
- Only callable for completed days

### Reentrancy Protection
- All external calls follow checks-effects-interactions pattern
- Transfer success validation on all ETH transfers
- State updates before external calls

### Day Completion Tracking
- Prevents multiple draws for same day
- Ensures each lottery pool is distributed only once
- Permanent record of completed days

---

## 🔮 Future Enhancements

### Short Term
- [ ] Multi-tier lottery system (daily, weekly, monthly)
- [ ] Referral rewards for bringing new players
- [ ] Leaderboard for top players
- [ ] NFT rewards for frequent winners

### Medium Term
- [ ] Multi-chain deployment (Arbitrum, Base, Polygon)
- [ ] Custom roulette wheels (create your own asset lists)
- [ ] Team play mode (pool bets with friends)
- [ ] Governance token for protocol decisions

### Long Term
- [ ] Automated daily draws (Chainlink Automation)
- [ ] Progressive jackpots
- [ ] Insurance pools for players
- [ ] Integration with other DeFi protocols
- [ ] Mobile app (React Native)

---

## 🏆 Built For

**ETH Global Buenos Aires Hackathon**
- Track: DeFi / Gaming
- Focus: Innovation in on-chain randomness

**Pyth Entropy Pool Prize - $5,000**
- Qualifying project showcasing creative use of Pyth Entropy V2
- Demonstrates permissionless random number generation and consumption
- Production-ready smart contracts with comprehensive testing

---

## 🔗 Links

### Live Demo
- **Frontend**: [Add your deployed URL here]
- **Video Demo**: [Add your video demo here]

### Smart Contracts
- [CryptoRoulette on Etherscan](https://sepolia-optimism.etherscan.io/address/0x19aab2239911164c9051ccaed184102a10d7121f)
- [DailyLottery on Etherscan](https://sepolia-optimism.etherscan.io/address/0x5149cc9f6c3a4b60cfa84125161e96b0cf677eb4)

### Documentation
- [Pyth Entropy Documentation](https://docs.pyth.network/entropy)
- [Scaffold-ETH 2 Documentation](https://docs.scaffoldeth.io)
- [Foundry Book](https://book.getfoundry.sh)

### Social
- GitHub: [Add your GitHub repo]
- Twitter: [Add your Twitter]

---

## 🧪 Testing

Run the comprehensive test suite:

```bash
cd packages/foundry

# Run all tests
forge test

# Run specific test file
forge test --match-path test/CryptoRoulette.t.sol

# Run with verbosity
forge test -vvv

# Run with gas reporting
forge test --gas-report
```

---

## 📄 License

MIT License

Copyright (c) 2024 Crypto Roulette & Daily Lottery Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 🙏 Acknowledgments

- **Pyth Network** for providing industry-leading on-chain randomness through Entropy V2
- **Scaffold-ETH 2** team for the amazing dApp development framework
- **ETH Global** for hosting an incredible hackathon
- **Optimism** for providing a fast, low-cost L2 environment
- **Foundry** team for the best Solidity development toolkit

---

## 👥 Team

Built with ❤️ for ETH Global Buenos Aires

[Add your team members and roles here]

---

<div align="center">

**⚡ Powered by Pyth Entropy V2 | Built with Scaffold-ETH 2 | Deployed on Optimism Sepolia ⚡**

</div>

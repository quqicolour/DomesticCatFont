# DomesticCatFont

Frontend dApp for the DomesticCat NFT ecosystem on **ARC Testnet**.

## Project Structure

```
DomesticCatFont/
├── abis/                     # Contract ABIs (source of truth)
│   ├── DomesticCatNFT.json
│   ├── CatSVGRegistry.json
│   ├── AMEowToken.json
│   └── ERC20.json
├── deployedAddress.json       # Deployed contract addresses
├── domestic-cat-ui/           # React + Vite frontend
│   ├── src/
│   │   ├── abis/             # Copied ABIs for the UI
│   │   ├── config/           # wagmi, contract addresses
│   │   ├── components/       # TxModal, WalletButton
│   │   └── pages/            # Home, MyCats, Gallery, Prize
│   └── dist/                 # Built static assets (deploy from here)
└── DomesticCat/              # Hardhat contracts (separate repo)
    └── contracts/
```

## Contracts (ARC Testnet)

| Contract | Address |
|----------|---------|
| DomesticCatNFT | `0x5b3ca13089bd8274fc901d1cadff8f7f644af0e0` |
| AMeowToken | `0x5c439c05c08b8450015fa4a741c624b7dabf5d31` |
| CatSVGRegistry | `0x13d4ce8b3166c7d6949396b6a12078732f6f41aa` |

Chain: **ARC Testnet** — chainId `5042002`, RPC `https://rpc.testnet.arc.network`, explorer `https://testnet.arcscan.app`

## Quick Start

```bash
cd domestic-cat-ui
npm install
npm run dev
```

## Deploy Frontend

```bash
npm run build    # outputs to dist/
# serve dist/ with any static host (Vercel, Netlify, IPFS, etc.)
```

See [domestic-cat-ui/README.md](domestic-cat-ui/README.md) for full frontend documentation.

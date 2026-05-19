import { createConfig, createStorage, http } from 'wagmi'

const ARC_CHAIN = {
  id: 5042002,
  name: 'ARC Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
} as const

export const wagmiConfig = createConfig({
  chains: [ARC_CHAIN as any],
  transports: {
    [ARC_CHAIN.id]: http('https://rpc.testnet.arc.network'),
  },
  storage: createStorage({ storage: window.localStorage }),
  ssr: false,
})

export { ARC_CHAIN }

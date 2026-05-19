import { erc20Abi } from 'viem'
import DomesticCatNFTAbi from '../abis/DomesticCatNFT.json'
import AMeowTokenAbi from '../abis/AMeowToken.json'

export const NFT_CONTRACT = {
  address: '0x5b3ca13089bd8274fc901d1cadff8f7f644af0e0',
  abi: DomesticCatNFTAbi as any,
} as const

export const AMEOW_TOKEN_CONTRACT = {
  address: '0x5c439c05c08b8450015fa4a741c624b7dabf5d31',
  abi: AMeowTokenAbi as any,
} as const

export const ERC20_ABI = erc20Abi

export const CHAIN_CONFIG = {
  id: 5042002,
  name: 'ARC Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
} as const

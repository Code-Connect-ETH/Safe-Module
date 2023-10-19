import { defineChain } from 'viem'

export const poly_zkevm = defineChain({
    id: 1101,
    name: 'Polygon zkEvm',
    network: 'Polygon zkEvm',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: ['https://zkevm-rpc.com'],
        },
        public: {
            http: ['https://zkevm-rpc.com'],
        },
    },
    blockExplorers: {
        default: { name: 'Explorer', url: 'https://zkevm.polygonscan.com' },
    },
})

export const base = defineChain({
    id: 8453,
    name: 'Base',
    network: 'base',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: ['https://developer-access-mainnet.base.org'],
        },
        public: {
            http: ['https://developer-access-mainnet.base.org'],
        },
    },
    blockExplorers: {
        default: { name: 'Explorer', url: 'https://basescan.org' },
    },
})
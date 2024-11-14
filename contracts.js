// Contract Configuration
export const CONTRACT_ADDRESS = '0x17039B8081b4482b9fd75dbc7fA2E503c3C9F478';

// Contract ABI with all needed methods
export const CONTRACT_ABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [{"internalType": "string","name": "prompt","type": "string"}],
        "name": "startNewGame",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getCurrentGameInfo",
        "outputs": [
            {"internalType": "bool","name": "isActive","type": "bool"},
            {"internalType": "uint256","name": "startTime","type": "uint256"},
            {"internalType": "string","name": "prompt","type": "string"},
            {"internalType": "uint256","name": "mintedCount","type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256","name": "elementId","type": "uint256"}],
        "name": "mintElement",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "burnElements",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getMintedElements",
        "outputs": [{"internalType": "bool[10]","name": "","type": "bool[10]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "elementNames",
        "outputs": [{"internalType": "string[10]","name": "","type": "string[10]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true,"internalType": "address","name": "player","type": "address"},
            {"indexed": false,"internalType": "string","name": "prompt","type": "string"}
        ],
        "name": "GameStarted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true,"internalType": "address","name": "player","type": "address"},
            {"indexed": false,"internalType": "uint256","name": "elementId","type": "uint256"},
            {"indexed": false,"internalType": "string","name": "elementName","type": "string"}
        ],
        "name": "ElementMinted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true,"internalType": "address","name": "player","type": "address"},
            {"indexed": false,"internalType": "string","name": "reason","type": "string"}
        ],
        "name": "GameReset",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true,"internalType": "address","name": "player","type": "address"}
        ],
        "name": "GameCompleted",
        "type": "event"
    }
];

// Chain Configuration for Linea mainet
export const CHAIN_CONFIG = {
    chainId: '0xe708',
    chainName: 'Linea',
    nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18
    },
    rpcUrls: ['https://linea.drpc.org'],
    blockExplorerUrls: ['https://https://lineascan.build/']
};

// Game Constants
export const MINT_PRICE = '0.00002';
export const MAX_ELEMENTS = 10;
export const ELEMENT_NAMES = [
    "Fire Crystal",
    "Water Essence",
    "Earth Stone",
    "Wind Feather",
    "Lightning Orb",
    "Shadow Mask",
    "Light Prism",
    "Time Hourglass",
    "Nature Seed",
    "Cosmic Core"
];

// Gas Configuration
export const GAS_CONFIG = {
    DEFAULT_GAS_LIMIT: 150000,
    GAS_BUFFER_MULTIPLIER: 1.2, // 20% buffer for gas estimation
    MAX_GAS_PRICE: '50000000000' // 50 gwei
};

// Transaction Configuration
export const TRANSACTION_CONFIG = {
    CONFIRMATION_BLOCKS: 1,
    TIMEOUT: 60000, // 60 seconds
    MAX_RETRIES: 3
};

// Error Messages
export const ERROR_MESSAGES = {
    // Wallet Errors
    WALLET_NOT_FOUND: 'Wallet provider not found',
    WALLET_CONNECTION: 'Error connecting to wallet',
    WALLET_NETWORK: 'Please switch to Linea Sepolia network',
    WALLET_LOCKED: 'Wallet is locked',
    
    // Transaction Errors
    INSUFFICIENT_FUNDS: 'Insufficient funds for transaction',
    TRANSACTION_FAILED: 'Transaction failed',
    TRANSACTION_REJECTED: 'Transaction rejected by user',
    TRANSACTION_TIMEOUT: 'Transaction timed out',
    
    // Contract Errors
    CONTRACT_NOT_FOUND: 'Smart contract not found',
    CONTRACT_INTERACTION: 'Error interacting with contract',
    
    // Network Errors
    NETWORK_ERROR: 'Network error occurred',
    NETWORK_SWITCH: 'Error switching network',
    
    // Game Errors
    GAME_NOT_ACTIVE: 'No active game found',
    INVALID_ELEMENT: 'Invalid element ID',
    ELEMENT_ALREADY_MINTED: 'Element already minted',
    NO_ELEMENTS_TO_BURN: 'No elements to burn',
    
    // User Errors
    USER_REJECTED: 'Action cancelled by user',
    PROMPT_REQUIRED: 'Story prompt is required',
    INVALID_PROMPT: 'Invalid prompt length'
};

// Success Messages
export const SUCCESS_MESSAGES = {
    WALLET_CONNECTED: 'Wallet connected successfully',
    NETWORK_SWITCHED: 'Network switched to Linea Sepolia',
    GAME_STARTED: 'Game started successfully',
    MINT_SUCCESS: 'NFT minted successfully',
    BURN_SUCCESS: 'Elements burned successfully',
    GAME_COMPLETE: 'Congratulations! You have completed the quest!',
    PROMPT_ACCEPTED: 'Your story prompt was accepted'
};

// Web3 Utility Functions
export function formatWalletAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export function toWei(amount, decimals = 18) {
    if (!amount || isNaN(amount)) return '0';
    try {
        return Web3.utils.toWei(amount.toString(), 'ether');
    } catch (error) {
        console.error('Error converting to Wei:', error);
        return '0';
    }
}

export function fromWei(amount, decimals = 18) {
    if (!amount) return '0';
    try {
        return Web3.utils.fromWei(amount.toString(), 'ether');
    } catch (error) {
        console.error('Error converting from Wei:', error);
        return '0';
    }
}

// Contract Helper Functions
export async function estimateGas(contract, method, params = {}) {
    if (!contract || !method) return GAS_CONFIG.DEFAULT_GAS_LIMIT;
    
    try {
        const gasEstimate = await method.estimateGas(params);
        // Add buffer to gas estimate
        return Math.floor(gasEstimate * GAS_CONFIG.GAS_BUFFER_MULTIPLIER);
    } catch (error) {
        console.warn('Gas estimation failed:', error);
        return GAS_CONFIG.DEFAULT_GAS_LIMIT;
    }
}

export async function getGasPrice(web3) {
    if (!web3) throw new Error('Web3 instance required');
    
    try {
        const gasPrice = await web3.eth.getGasPrice();
        return Math.min(
            gasPrice,
            web3.utils.toBN(GAS_CONFIG.MAX_GAS_PRICE)
        ).toString();
    } catch (error) {
        console.error('Error getting gas price:', error);
        throw error;
    }
}

// Transaction Helper Functions
export function watchTransaction(web3, txHash) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error(ERROR_MESSAGES.TRANSACTION_TIMEOUT));
        }, TRANSACTION_CONFIG.TIMEOUT);

        const checkTransaction = async () => {
            try {
                const receipt = await web3.eth.getTransactionReceipt(txHash);
                if (receipt) {
                    clearTimeout(timeout);
                    if (receipt.status) {
                        resolve(receipt);
                    } else {
                        reject(new Error(ERROR_MESSAGES.TRANSACTION_FAILED));
                    }
                } else {
                    setTimeout(checkTransaction, 1000);
                }
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        };

        checkTransaction();
    });
}

// Export default configuration object
export default {
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    CHAIN_CONFIG,
    MINT_PRICE,
    MAX_ELEMENTS,
    ELEMENT_NAMES,
    GAS_CONFIG,
    TRANSACTION_CONFIG,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES
};
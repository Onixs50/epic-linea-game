import {
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    CHAIN_CONFIG,
    MINT_PRICE,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    formatWalletAddress,
    estimateGas,
    getGasPrice,
    toWei,
    ELEMENT_NAMES
} from 'https://cdn.jsdelivr.net/gh/Onixs50/epic-linea-game@main/js/contracts.js';

const walletHandler = {
    // State variables
    web3: null,
    contract: null,
    userAccount: null,
    mintedElements: new Set(),
    pendingMint: null,
    gameState: {
        totalElements: 10,
        foundElements: new Set(),
        mintedElementsCount: 0,
        lastFoundElement: null,
        isGameActive: false
    },

    // Initialize wallet and connect
    async initialize() {
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask is not installed!');
            }

            this.web3 = new Web3(window.ethereum);
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            this.userAccount = accounts[0];
            this.contract = new this.web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
            
            // Setup MetaMask event listeners
            window.ethereum.on('accountsChanged', (accounts) => {
                this.userAccount = accounts[0];
                this.updateUI();
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });

            this.updateUI();
            return true;
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError(error.message);
            return false;
        }
    },

    // Connect wallet method
    async connectWallet() {
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask is not installed!');
            }

            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            this.userAccount = accounts[0];
            this.web3 = new Web3(window.ethereum);
            this.contract = new this.web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
            
            this.updateUI();
            return true;
        } catch (error) {
            console.error('Connection error:', error);
            this.showError(error.message);
            return false;
        }
    },

    // Basic UI functions
    showWalletModal() {
        document.getElementById('walletModal')?.classList.add('active');
    },

    closeWalletModal() {
        document.getElementById('walletModal')?.classList.remove('active');
    },

    showTutorial() {
        document.getElementById('tutorialModal')?.classList.remove('hidden');
    },

    closeTutorial() {
        document.getElementById('tutorialModal')?.classList.add('hidden');
    },

    // UI Utility Methods
    showLoading(message) {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            const loadingText = loadingScreen.querySelector('.text-white');
            if (loadingText) loadingText.textContent = message || 'Loading...';
            loadingScreen.classList.remove('hidden');
        }
    },

    hideLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    },

    showError(message) {
        const toast = document.getElementById('errorToast');
        if (toast) {
            toast.textContent = message;
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('hidden'), 3000);
        }
    },

    showSuccess(message) {
        console.log('Success:', message);
    },

    showSuccessModal(message, callback = null, options = {}) {
        const modal = document.getElementById('successModal');
        if (!modal) return;

        const messageEl = document.getElementById('successMessage');
        if (messageEl) messageEl.textContent = message;
        
        const trophyIcon = document.getElementById('trophyIcon');
        if (trophyIcon) {
            trophyIcon.classList.toggle('hidden', !options.showTrophy);
        }
        
        const mintSection = document.getElementById('mintSection');
        const burnSection = document.getElementById('burnSection');
        const progressSection = document.getElementById('collectionProgress');
        
        if (mintSection) mintSection.classList.toggle('hidden', !options.showMint);
        if (burnSection) burnSection.classList.toggle('hidden', !options.showBurn);
        if (progressSection) {
            progressSection.classList.toggle('hidden', !options.showProgress);
            if (options.showProgress) {
                progressSection.textContent = `Elements collected: ${this.gameState.mintedElementsCount}/10`;
            }
        }

        modal.classList.remove('hidden');

        // Setup button callbacks
        if (options.showBurn && burnSection) {
            const burnButton = burnSection.querySelector('button');
            if (burnButton) {
                burnButton.onclick = async () => {
                    try {
                        await this.burnElements();
                        if (callback) await callback();
                        this.closeSuccessModal();
                    } catch (error) {
                        this.showError(error.message);
                    }
                };
            }
        }

        if (options.showMint && mintSection) {
            const mintButton = mintSection.querySelector('button');
            if (mintButton) {
                mintButton.onclick = async () => {
                    try {
                        if (callback) await callback();
                        this.closeSuccessModal();
                    } catch (error) {
                        this.showError(error.message);
                    }
                };
            }
        }

        const continueButton = modal.querySelector('.continue-button');
        if (continueButton) {
            continueButton.onclick = () => {
                this.closeSuccessModal();
                if (callback && !options.showMint && !options.showBurn) {
                    callback();
                }
            };
        }
    },

    closeSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    updateUI() {
        if (this.userAccount) {
            const displayAddress = `${this.userAccount.slice(0, 6)}...${this.userAccount.slice(-4)}`;
            document.getElementById('walletInfo')?.classList.remove('hidden');
            document.getElementById('walletAddress').textContent = displayAddress;
            document.getElementById('connectWallet')?.classList.add('hidden');
        } else {
            document.getElementById('walletInfo')?.classList.add('hidden');
            document.getElementById('connectWallet')?.classList.remove('hidden');
        }
    },

    async handleElementFound(elementId, elementName) {
        console.log('Element found:', elementId, elementName);
        
        if (elementId === 9) {
            const mintedCount = await this.getMintedElementsCount();
            if (mintedCount < 9) {
                this.showSuccessModal(
                    `Incredible! You've discovered the legendary ${elementName}! 🌟\n\nThis is the final element, but its power can only be unleashed after collecting the other 9 elements first. You currently have ${mintedCount} elements minted.\n\nComplete your collection to unlock this powerful element!`,
                    null,
                    {
                        showProgress: true,
                        showContinue: true
                    }
                );
                this.gameState.foundElements.add(elementId);
                this.gameState.lastFoundElement = { id: elementId, name: elementName };
                this.updateProgress();
                return false;
            }
        }

        this.gameState.foundElements.add(elementId);
        this.gameState.lastFoundElement = { id: elementId, name: elementName };
        this.updateProgress();
        return true;
    },

    async getMintedElementsCount() {
        try {
            if (!this.contract || !this.userAccount) return 0;
            const mintedElements = await this.contract.methods.getMintedElements().call({ from: this.userAccount });
            return mintedElements.filter(Boolean).length;
        } catch (error) {
            console.error('Error getting minted elements:', error);
            return 0;
        }
    },

    async burnElements() {
        try {
            if (!this.userAccount || !this.contract) {
                throw new Error('Wallet not connected');
            }

            const gasEstimate = await this.contract.methods.burnElements().estimateGas({
                from: this.userAccount
            });

            const burnTx = await this.contract.methods.burnElements().send({
                from: this.userAccount,
                gas: Math.floor(gasEstimate * 1.2)
            });

            this.mintedElements.clear();
            this.gameState.mintedElementsCount = 0;
            
            return burnTx;
        } catch (error) {
            console.error('Burn error:', error);
            throw error;
        }
    },

    updateProgress() {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        if (progressBar && progressText) {
            const progress = (this.gameState.mintedElementsCount / 10) * 100;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${this.gameState.mintedElementsCount}/10 Elements`;
        }
    },

    disconnectWallet() {
        this.userAccount = null;
        this.web3 = null;
        this.contract = null;
        this.mintedElements.clear();
        this.gameState = {
            totalElements: 10,
            foundElements: new Set(),
            mintedElementsCount: 0,
            lastFoundElement: null,
            isGameActive: false
        };
        
        this.updateUI();
    },

    async resetGame() {
        if (this.gameState.foundElements.size > 0 || this.gameState.mintedElementsCount > 0) {
            this.showSuccessModal(
                'Are you sure you want to reset the game? All found elements will be lost.',
                async () => {
                    try {
                        await this.burnElements();
                        this.gameState.foundElements.clear();
                        this.gameState.mintedElementsCount = 0;
                        this.gameState.lastFoundElement = null;
                        this.mintedElements.clear();
                        this.updateProgress();
                        this.closeSuccessModal();
                        return true;
                    } catch (error) {
                        this.showError(error.message);
                        return false;
                    }
                },
                { showBurn: true }
            );
        } else {
            this.gameState = {
                totalElements: 10,
                foundElements: new Set(),
                mintedElementsCount: 0,
                lastFoundElement: null,
                isGameActive: true
            };
            this.updateProgress();
            return true;
        }
    },

    async exitGame() {
        if (this.gameState.foundElements.size > 0 || this.gameState.mintedElementsCount > 0) {
            this.showSuccessModal(
                'You have uncollected elements. Would you like to burn them and exit?',
                async () => {
                    try {
                        await this.burnElements();
                        this.gameState = {
                            totalElements: 10,
                            foundElements: new Set(),
                            mintedElementsCount: 0,
                            lastFoundElement: null,
                            isGameActive: false
                        };
                        this.updateProgress();
                        this.closeSuccessModal();
                        return true;
                    } catch (error) {
                        this.showError(error.message);
                        return false;
                    }
                },
                { showBurn: true }
            );
        } else {
            this.gameState = {
                totalElements: 10,
                foundElements: new Set(),
                mintedElementsCount: 0,
                lastFoundElement: null,
                isGameActive: false
            };
            return true;
        }
    }
};

export default walletHandler;

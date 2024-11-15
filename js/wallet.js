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
} from 'https://onixs50.github.io/epic-linea-game/js/contracts.js';

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

    // Basic UI functions
    showWalletModal() {
        document.getElementById('walletModal').classList.add('active');
    },

    closeWalletModal() {
        document.getElementById('walletModal').classList.remove('active');
    },

    showTutorial() {
        document.getElementById('tutorialModal').classList.remove('hidden');
    },

    closeTutorial() {
        document.getElementById('tutorialModal').classList.add('hidden');
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

        // Enhanced button callbacks with proper async handling
        if (options.showBurn && burnSection) {
            const burnButton = burnSection.querySelector('button');
            if (burnButton) {
                burnButton.onclick = async () => {
                    try {
                        await this.burnElements();
                        if (callback) await callback();
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
                        await callback();
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

        modal.classList.remove('hidden');
    },

    closeSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.add('hidden');
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

    // Wallet Connection Methods
    async connectWallet(type) {
        try {
            this.showLoading('Connecting wallet...');
            const provider = type === 'metamask' ? window.ethereum : window.okxwallet;
            
            if (!provider) {
                throw new Error(`${type === 'metamask' ? 'MetaMask' : 'OKX Wallet'} not found`);
            }

            await this.switchNetwork(provider);
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            await this.initializeWallet(accounts[0], provider);
            this.closeWalletModal();
            this.showSuccess(SUCCESS_MESSAGES.WALLET_CONNECTED);
            await this.checkExistingNFTs();
        } catch (error) {
            console.error('Wallet connection error:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    },

    async switchNetwork(provider) {
        try {
            await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: CHAIN_CONFIG.chainId }],
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [CHAIN_CONFIG],
                });
            } else {
                throw switchError;
            }
        }
    },

    async initializeWallet(account, provider) {
        this.web3 = new Web3(provider);
        this.userAccount = account;
        this.contract = new this.web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

        document.getElementById('walletSection').classList.add('hidden');
        document.getElementById('walletInfo').classList.remove('hidden');
        document.getElementById('walletAddress').textContent = formatWalletAddress(account);

        provider.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.disconnectWallet();
            } else {
                this.initializeWallet(accounts[0], provider);
            }
        });

        provider.on('chainChanged', () => {
            window.location.reload();
        });

        this.gameState.isGameActive = true;
        this.updateProgress();
    },

    async checkExistingNFTs() {
        try {
            if (!this.contract || !this.userAccount) {
                console.log('No wallet connected');
                return;
            }

            const [gameInfo, mintedElements] = await Promise.all([
                this.contract.methods.getCurrentGameInfo().call({ from: this.userAccount }),
                this.contract.methods.getMintedElements().call({ from: this.userAccount })
            ]);

            const mintedCount = parseInt(gameInfo.mintedCount);
            
            if (mintedCount > 0) {
                const elementCount = mintedElements.filter(Boolean).length;
                this.showSuccessModal(
                    `You have ${elementCount} elements from a previous game. You need to burn them before starting a new game.`,
                    null,
                    { 
                        showBurn: true,
                        showProgress: true 
                    }
                );
            } else {
                document.getElementById('gameStartSection').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error checking NFTs:', error);
            this.showError('Failed to check existing NFTs: ' + error.message);
            document.getElementById('gameStartSection').classList.remove('hidden');
        }
    },

    async burnElements() {
        try {
            if (!this.contract || !this.userAccount) {
                throw new Error(ERROR_MESSAGES.WALLET_CONNECTION);
            }

            this.showLoading('Preparing to burn elements...');

            const gasEstimate = await estimateGas(
                this.contract,
                this.contract.methods.burnElements(),
                { from: this.userAccount }
            );

            const tx = await this.contract.methods.burnElements().send({
                from: this.userAccount,
                gas: Math.floor(gasEstimate * 1.2),
                gasPrice: await getGasPrice(this.web3)
            });

            this.mintedElements.clear();
            this.gameState.mintedElementsCount = 0;
            this.gameState.foundElements.clear();
            
            this.showSuccess(SUCCESS_MESSAGES.BURN_SUCCESS);
            document.getElementById('gameStartSection').classList.remove('hidden');
            this.closeSuccessModal();
            return tx;
        } catch (error) {
            console.error('Error burning elements:', error);
            if (error.code === 4001) {
                throw new Error(ERROR_MESSAGES.USER_REJECTED);
            }
            throw new Error(error.message || ERROR_MESSAGES.CONTRACT_INTERACTION);
        } finally {
            this.hideLoading();
        }
    },

    async mintNFT(elementId) {
        try {
            const requiredAmount = toWei(MINT_PRICE);
            const balance = await this.web3.eth.getBalance(this.userAccount);
            
            if (this.web3.utils.toBN(balance).lt(this.web3.utils.toBN(requiredAmount))) {
                throw new Error(ERROR_MESSAGES.INSUFFICIENT_FUNDS);
            }

            const gasEstimate = await estimateGas(
                this.contract,
                this.contract.methods.mintElement(elementId),
                { from: this.userAccount, value: requiredAmount }
            );

            const tx = await this.contract.methods.mintElement(elementId).send({
                from: this.userAccount,
                value: requiredAmount,
                gas: Math.floor(gasEstimate * 1.2),
                gasPrice: await getGasPrice(this.web3)
            });

            this.mintedElements.add(elementId);
            this.gameState.mintedElementsCount++;
            this.updateProgress();

            // Check if this completes the collection
            if (this.gameState.mintedElementsCount === 10) {
                this.showSuccessModal(
                    'Congratulations! You have collected all elements and defeated the evil boss!',
                    null,
                    { showContinue: true }
                );
            }

            return tx;
        } catch (error) {
            console.error('Minting error:', error);
            this.showError(error.message);
            throw error;
        }
    },

    async startNewGame(prompt) {
        try {
            const requiredAmount = toWei(MINT_PRICE);
            const balance = await this.web3.eth.getBalance(this.userAccount);
            
            if (this.web3.utils.toBN(balance).lt(this.web3.utils.toBN(requiredAmount))) {
                throw new Error(ERROR_MESSAGES.INSUFFICIENT_FUNDS);
            }

            const gasEstimate = await estimateGas(
                this.contract,
                this.contract.methods.startNewGame(prompt),
                { from: this.userAccount, value: requiredAmount }
            );

            const tx = await this.contract.methods.startNewGame(prompt).send({
                from: this.userAccount,
                value: requiredAmount,
                gas: Math.floor(gasEstimate * 1.2),
                gasPrice: await getGasPrice(this.web3)
            });

            this.gameState.isGameActive = true;
            return tx;
        } catch (error) {
            console.error('Error starting game:', error);
            this.showError(error.message);
            throw error;
        }
    },

    async handleElementFound(elementId, elementName) {
        console.log('Element found:', elementId, elementName);
        
        // Check if this is the final element
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
                // Still add to found elements but prevent minting
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

    // Helper method to get minted elements count
    async getMintedElementsCount() {
        try {
            const mintedElements = await this.contract.methods.getMintedElements().call({ from: this.userAccount });
            return mintedElements.filter(Boolean).length;
        } catch (error) {
            console.error('Error getting minted elements:', error);
            return 0;
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
        
        document.getElementById('walletInfo').classList.add('hidden');
        document.getElementById('walletSection').classList.remove('hidden');
        document.getElementById('gameStartSection').classList.add('hidden');
        
        this.updateProgress();
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

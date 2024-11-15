const walletHandler = {
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

    async connectWallet(type = 'metamask') {
        try {
            let provider;
            if (type === 'metamask' && window.ethereum) {
                provider = window.ethereum;
            } else if (type === 'okx' && window.okxwallet) {
                provider = window.okxwallet;
            } else {
                throw new Error(`${type} wallet is not installed`);
            }

            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];

            this.web3 = new Web3(provider);
            this.userAccount = account;
            this.contract = new this.web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

            document.getElementById('walletInfo').classList.remove('hidden');
            document.getElementById('walletAddress').textContent = formatWalletAddress(account);
            document.getElementById('connectWalletBtn').classList.add('hidden');
            document.getElementById('gameStartSection').classList.remove('hidden');

            return account;
        } catch (error) {
            console.error('Wallet connection error:', error);
            this.showError(error.message);
            throw error;
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

    async startNewGame(prompt) {
        try {
            if (!this.userAccount || !this.contract) {
                throw new Error('Please connect your wallet first');
            }

            const requiredAmount = this.web3.utils.toWei('0.00002', 'ether');
            const gasEstimate = await this.contract.methods.startNewGame(prompt)
                .estimateGas({ from: this.userAccount, value: requiredAmount });

            const transaction = await this.contract.methods.startNewGame(prompt)
                .send({
                    from: this.userAccount,
                    value: requiredAmount,
                    gas: Math.floor(gasEstimate * 1.2)
                });

            this.gameState.isGameActive = true;
            return transaction;
        } catch (error) {
            console.error('Error starting game:', error);
            this.showError(error.message);
            throw error;
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
            const mintedElements = await this.contract.methods.getMintedElements().call({ from: this.userAccount });
            return mintedElements.filter(Boolean).length;
        } catch (error) {
            console.error('Error getting minted elements:', error);
            return 0;
        }
    },

    updateProgress() {
        const progress = (this.gameState.mintedElementsCount / this.gameState.totalElements) * 100;
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressText) {
            progressText.textContent = `${this.gameState.mintedElementsCount}/${this.gameState.totalElements} Elements`;
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
                        this.gameState = {
                            totalElements: 10,
                            foundElements: new Set(),
                            mintedElementsCount: 0,
                            lastFoundElement: null,
                            isGameActive: true
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

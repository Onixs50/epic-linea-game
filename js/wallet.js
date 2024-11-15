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
} from './contracts.js';

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

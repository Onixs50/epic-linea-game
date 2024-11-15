// Animation Constants
export const ELEMENT_TYPES = ['star', 'chest', 'blackhole'];
export const NFT_ANIMATIONS = ['collectEffect', 'starGlow', 'treasureChest', 'blackHole'];
const POLYGON_COUNT = 30;
const PARTICLE_COUNT = 20;

class AnimationManager {
    constructor() {
        this.floatingPolygons = [];
        this.activeAnimations = new Set();
    }

    // Background Animation Methods
    setupFloatingPolygons() {
        const container = document.getElementById('floatingPolygons');
        if (!container) return;
        
        container.innerHTML = '';
        this.floatingPolygons = [];
        
        for (let i = 0; i < POLYGON_COUNT; i++) {
            const polygon = document.createElement('div');
            polygon.className = 'floating-polygon transform rotate-45';
            polygon.style.left = `${Math.random() * 100}%`;
            polygon.style.top = `${Math.random() * 100}%`;
            polygon.style.animationDelay = `${Math.random() * 5}s`;
            polygon.style.opacity = '0.05';
            container.appendChild(polygon);
            this.floatingPolygons.push(polygon);
        }
    }

    removeFloatingPolygons() {
        this.floatingPolygons.forEach(polygon => polygon.remove());
        this.floatingPolygons = [];
    }

    // NFT Element Animations
    setupMagicalElement(element, type, position) {
        if (!element) return null;

        element.className = `magical-element ${type}`;
        element.style.left = `${position.x}%`;
        element.style.top = `${position.y}%`;
        element.style.opacity = '0';
        
        // Create hover detection area
        const detectionArea = document.createElement('div');
        detectionArea.className = 'absolute w-16 h-16 -left-3 -top-3 cursor-pointer';
        element.appendChild(detectionArea);
        
        // Add hover animations
        element.addEventListener('mouseover', () => {
            element.style.opacity = '1';
            document.body.style.cursor = 'pointer';
            this.playHoverEffect(element, type);
        });

        element.addEventListener('mouseleave', () => {
            element.style.opacity = '0';
            document.body.style.cursor = 'default';
            this.stopHoverEffect(element);
        });

        return element;
    }

    playHoverEffect(element, type) {
        if (!element) return;

        const animationKey = `hover-${element.id}`;
        if (this.activeAnimations.has(animationKey)) return;

        switch(type) {
            case 'star':
    }

    // Screen Transition Animations
    fadeOutScreen(screenId) {
        const screen = document.getElementById(screenId);
        if (!screen) return Promise.resolve();

        return new Promise(resolve => {
            screen.classList.add('fade-out');
            setTimeout(() => {
                screen.classList.add('hidden');
                screen.classList.remove('fade-out');
                resolve();
            }, 500);
        });
    }

    fadeInScreen(screenId) {
        const screen = document.getElementById(screenId);
        if (!screen) return Promise.resolve();

        return new Promise(resolve => {
            screen.classList.remove('hidden');
            screen.classList.add('fade-in');
            setTimeout(() => {
                screen.classList.remove('fade-in');
                resolve();
            }, 500);
        });
    }

    // Loading Animation
    showLoadingAnimation(message) {
        const loadingText = document.getElementById('loadingText');
        if (!loadingText) return;

        loadingText.textContent = '';
        this.typeWriterEffect(loadingText, message);
    }

    typeWriterEffect(element, text, speed = 50) {
        if (!element || !text) return;

        let i = 0;
        const type = () => {
            if (i < text.length && element.isConnected) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        };
        type();
    }

    // Progress Bar Animation
    updateProgressBar(progress) {
        const progressBar = document.getElementById('progressBar');
        if (!progressBar) return;

        progressBar.style.width = `${progress}%`;
        progressBar.style.transition = 'width 0.5s ease-in-out';
    }

    // Modal Animations
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('hidden');
        modal.classList.add('fade-in');
        
        const content = modal.querySelector('.modal-content');
        if (content) {
            content.style.transform = 'translateY(0)';
            content.style.opacity = '1';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const content = modal.querySelector('.modal-content');
        if (content) {
            content.style.transform = 'translateY(20px)';
            content.style.opacity = '0';
        }
        
        modal.classList.add('fade-out');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('fade-out');
        }, 500);
    }

    // Victory Animation
    playVictoryAnimation() {
        this.createFireworks();
        
        const title = document.querySelector('.victory-title');
        if (title) {
            title.classList.add('glowing');
        }
    }

    createFireworks() {
        const container = document.createElement('div');
        container.className = 'fixed inset-0 pointer-events-none z-50';
        document.body.appendChild(container);

        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                if (!container.isConnected) return;

                const firework = document.createElement('div');
                firework.className = 'absolute w-2 h-2 bg-white rounded-full';
                firework.style.left = `${Math.random() * 100}%`;
                firework.style.bottom = '0';
                
                const endX = Math.random() * 200 - 100;
                const endY = -(Math.random() * 300 + 200);
                
                const animation = firework.animate([
                    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                    { transform: `translate(${endX}px, ${endY}px) scale(0)`, opacity: 0 }
                ], {
                    duration: 1000,
                    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                });

                container.appendChild(firework);
                animation.onfinish = () => firework.remove();
            }, i * 200);
        }

        setTimeout(() => container.remove(), 3000);
    }

    // Cleanup Method
    cleanup() {
        this.removeFloatingPolygons();
        this.activeAnimations.clear();
    }
}

// Create and export a single instance
export const animationManager = new AnimationManager();
export default animationManager;

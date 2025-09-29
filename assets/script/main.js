// HolySMP - Main JavaScript File
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all features
    initMobileMenu();
    initScrollEffects();
    initDiscordWidget();
    initCurrentYear();
    initPlayerCounter();
    initCopyServerIP();
    initSmoothScrolling();
});

// Mobile Navigation Menu
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
}

// Scroll Effects for Header
function initScrollEffects() {
    const header = document.querySelector('.header');
    
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
                header.style.background = 'rgba(28, 35, 48, 0.95)';
            } else {
                header.style.background = 'rgba(28, 35, 48, 0.7)';
            }
        });
    }

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe cards for scroll animations
    const cards = document.querySelectorAll('.info-card, .value-card, .team-card, .creator-card');
    cards.forEach(card => {
        observer.observe(card);
    });
}

// Discord Widget Integration
function initDiscordWidget() {
    const widgetContainer = document.getElementById('discord-widget-container');
    
    if (widgetContainer) {
        // Create Discord widget iframe
        const discordWidget = document.createElement('iframe');
        discordWidget.src = 'https://discord.com/widget?id=1421891078939742210&theme=dark';
        discordWidget.width = '100%';
        discordWidget.height = '350';
        discordWidget.allowtransparency = 'true';
        discordWidget.frameborder = '0';
        discordWidget.sandbox = 'allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts';
        
        widgetContainer.appendChild(discordWidget);

        // Fetch Discord server info
        fetch('https://discordapp.com/api/guilds/1421891078939742210/widget.json')
            .then(response => response.json())
            .then(data => {
                console.log('Discord server data:', data);
                // You can use this data to display additional server info
            })
            .catch(error => {
                console.log('Discord widget fallback mode');
            });
    }
}

// Set current year in footer
function initCurrentYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// Enhanced Player Counter
function initPlayerCounter() {
    // The mc-player-counter library is already loaded in HTML
    // Let's add some enhancements
    const playerCountElements = document.querySelectorAll('[data-playercounter-ip]');
    
    playerCountElements.forEach(element => {
        // Add loading state
        element.classList.add('loading-players');
        
        // Monitor for changes (the library updates the element)
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    element.classList.remove('loading-players');
                    
                    // Add number formatting
                    const count = parseInt(element.textContent);
                    if (!isNaN(count)) {
                        element.textContent = count.toLocaleString('de-DE');
                        
                        // Add visual effect for high player count
                        if (count > 50) {
                            element.style.color = 'var(--accent-color)';
                            element.style.fontWeight = 'bold';
                        }
                    }
                }
            });
        });
        
        observer.observe(element, {
            childList: true,
            subtree: true,
            characterData: true
        });
    });
}

// Copy Server IP to Clipboard
function copyServerIP() {
    const serverIP = 'play.holysmp.net';
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(serverIP).then(function() {
            showCopyNotification('Server-IP kopiert: ' + serverIP);
        }).catch(function(err) {
            console.error('Clipboard error:', err);
            fallbackCopyText(serverIP);
        });
    } else {
        fallbackCopyText(serverIP);
    }
}

// Fallback copy method for older browsers
function fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopyNotification('Server-IP kopiert: ' + text);
    } catch (err) {
        console.error('Fallback copy failed:', err);
        showCopyNotification('Server-IP: ' + text + ' (manuell kopieren)');
    }
    
    document.body.removeChild(textArea);
}

// Show copy notification
function showCopyNotification(message) {
    // Remove existing notification
    const existingNotification = document.querySelector('.copy-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        font-family: var(--font-minecraft);
        font-size: var(--font-size-sm);
        font-weight: 600;
        animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2.7s forwards;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .loading-players {
        opacity: 0.6;
        animation: pulse 1.5s ease-in-out infinite;
    }
    
    @keyframes pulse {
        0%, 100% {
            opacity: 0.6;
        }
        50% {
            opacity: 1;
        }
    }
    
    .copy-notification {
        user-select: none;
        pointer-events: none;
    }
`;
document.head.appendChild(style);

// Global functions (can be called from HTML)
window.copyServerIP = copyServerIP;

// Performance optimization
if ('requestIdleCallback' in window) {
    requestIdleCallback(function() {
        // Non-critical initialization
        initAnalytics();
        preloadImages();
    });
} else {
    setTimeout(function() {
        initAnalytics();
        preloadImages();
    }, 1000);
}

// Analytics initialization (placeholder)
function initAnalytics() {
    // Google Analytics is already loaded in HTML head
    // Additional analytics tracking can be added here
    
    // Track button clicks
    document.querySelectorAll('.btn-primary, .btn-discord').forEach(button => {
        button.addEventListener('click', function() {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'click', {
                    event_category: 'button',
                    event_label: this.textContent.trim()
                });
            }
        });
    });
}

// Preload critical images
function preloadImages() {
    const criticalImages = [
        './assets/images/hero/hero-1.webp',
        './assets/images/logo.png'
    ];
    
    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// Service Worker registration for PWA (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js').then(function(registration) {
            console.log('SW registered: ', registration);
        }, function(registrationError) {
            console.log('SW registration failed: ', registrationError);
        });
    });
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
    // You could send errors to an analytics service here
});

// Visibility API for performance optimization
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Page is hidden, pause non-essential operations
        console.log('Page hidden - pausing operations');
    } else {
        // Page is visible, resume operations
        console.log('Page visible - resuming operations');
    }
});
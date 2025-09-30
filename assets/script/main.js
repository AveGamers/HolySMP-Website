// HolySMP - Main JavaScript File
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all features
    initMobileMenu();
    initScrollEffects();
    initDiscordWidget();
    initCurrentYear();
    initPlayerCounter();
    initServerStatus();
    initSmoothScrolling();
    
    // Global functions setup
    window.copyServerIP = copyServerIP;
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

// Enhanced Player Counter using AveGamers API
function initPlayerCounter() {
    const playerCountElement = document.getElementById('player-count');
    
    if (!playerCountElement) return;
    
    // Set loading state
    playerCountElement.textContent = '...';
    playerCountElement.classList.add('loading-players');
    
    // Function to fetch server status
    async function fetchServerStatus() {
        try {
            // Create timeout controller
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            // First try Java Edition
            const javaResponse = await fetch('https://mcapi.avegamers.net/api/server/status?host=play.holysmp.net&port=25565&type=java', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (javaResponse.ok) {
                const javaData = await javaResponse.json();
                if (javaData.success && javaData.data && javaData.data.online) {
                    updatePlayerCount(javaData.data.players?.online || 0, 'Java');
                    return;
                }
            }
            
            // If Java fails, try Bedrock Edition
            const controller2 = new AbortController();
            const timeoutId2 = setTimeout(() => controller2.abort(), 10000);
            
            const bedrockResponse = await fetch('https://mcapi.avegamers.net/api/server/status?host=play.holysmp.net&port=19132&type=bedrock', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: controller2.signal
            });
            
            clearTimeout(timeoutId2);
            
            if (bedrockResponse.ok) {
                const bedrockData = await bedrockResponse.json();
                if (bedrockData.success && bedrockData.data && bedrockData.data.online) {
                    updatePlayerCount(bedrockData.data.players?.online || 0, 'Bedrock');
                    return;
                }
            }
            
            // If both fail, show offline status
            updatePlayerCount(0, 'Offline');
            
        } catch (error) {
            console.warn('Player count fetch failed:', error);
            // Try to show some server info even if player count fails
            updatePlayerCount('?', 'Error');
        }
    }
    
    // Function to update the display
    function updatePlayerCount(count, source) {
        playerCountElement.classList.remove('loading-players');
        
        if (count === '?' || count === 'Error') {
            playerCountElement.textContent = '?';
            playerCountElement.style.color = 'var(--text-muted)';
            playerCountElement.title = 'Spieleranzahl konnte nicht geladen werden';
            return;
        }
        
        if (count === 0 && source === 'Offline') {
            playerCountElement.textContent = '0';
            playerCountElement.style.color = 'var(--text-muted)';
            playerCountElement.title = 'Server ist offline';
            return;
        }
        
        // Format number for German locale
        const formattedCount = typeof count === 'number' ? count.toLocaleString('de-DE') : count;
        playerCountElement.textContent = formattedCount;
        playerCountElement.title = `${formattedCount} Spieler online (${source})`;
        
        // Color coding based on player count
        if (count > 50) {
            playerCountElement.style.color = 'var(--accent-color)';
            playerCountElement.style.fontWeight = 'bold';
        } else if (count > 0) {
            playerCountElement.style.color = 'var(--primary-color)';
            playerCountElement.style.fontWeight = 'normal';
        } else {
            playerCountElement.style.color = 'var(--text-secondary)';
            playerCountElement.style.fontWeight = 'normal';
        }
        
        // Add subtle animation on update
        playerCountElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            playerCountElement.style.transform = 'scale(1)';
        }, 200);
    }
    
    // Initial fetch
    fetchServerStatus();
    
    // Update every 30 seconds
    setInterval(fetchServerStatus, 30000);
    
    // Update when page becomes visible again
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            fetchServerStatus();
        }
    });
}

// Server Status Check (for additional info)
function initServerStatus() {
    // Optional: Add server status indicators
    async function checkServerHealth() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch('https://mcapi.avegamers.net/api/server/ping?host=play.holysmp.net&port=25565&type=java', {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                updateServerStatusIndicator(data.online);
            } else {
                updateServerStatusIndicator(false);
            }
        } catch (error) {
            console.warn('Server health check failed:', error);
            updateServerStatusIndicator(false);
        }
    }
    
    function updateServerStatusIndicator(isOnline) {
        // Add status indicator to navigation or elsewhere if needed
        const statusElements = document.querySelectorAll('.server-status-indicator');
        statusElements.forEach(element => {
            element.classList.toggle('online', isOnline);
            element.classList.toggle('offline', !isOnline);
            element.title = isOnline ? 'Server ist online' : 'Server ist offline';
        });
    }
    
    // Check immediately and then every minute
    checkServerHealth();
    setInterval(checkServerHealth, 60000);
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

// Service Worker registration for PWA (optional) - Disabled until sw.js is created
/*
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js').then(function(registration) {
            console.log('SW registered: ', registration);
        }, function(registrationError) {
            console.log('SW registration failed: ', registrationError);
        });
    });
}
*/

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
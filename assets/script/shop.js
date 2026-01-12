// HolySMP - Tebex Shop Integration via Backend API
// Configuration
const TEBEX_CONFIG = {
    // Use localhost for local development, production URL for deployment
    apiBase: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000/api' 
        : 'https://web-api.holysmp.net/api'
};

// Debug mode
const DEBUG = true;
function log(...args) {
    if (DEBUG) console.log('[Shop]', ...args);
}

// State management
let shopState = {
    categories: [],
    packages: [],
    cart: [],
    selectedCategory: null,
    user: null,
    minecraftUsername: null,
    checkoutStep: 1
};

// Initialize shop on page load
document.addEventListener('DOMContentLoaded', function() {
    initShop();
    initCurrentYear();
    initMobileMenu();
    
    // Load saved data from localStorage
    const savedUsername = localStorage.getItem('minecraftUsername');
    if (savedUsername) {
        shopState.minecraftUsername = savedUsername;
        const usernameInput = document.getElementById('minecraft-username');
        if (usernameInput) usernameInput.value = savedUsername;
    }
});

// Initialize shop
async function initShop() {
    try {
        log('Initializing shop...');
        showLoading();
        
        // Fetch categories and packages
        log('Fetching data from Backend API...');
        await Promise.all([
            fetchCategories(),
            fetchPackages()
        ]);
        
        log('Categories:', shopState.categories.length);
        log('Packages:', shopState.packages.length);
        
        // Display shop content
        if (shopState.packages.length > 0 || shopState.categories.length > 0) {
            // Hide categories section - we display products directly
            const categoriesSection = document.getElementById('shop-categories');
            if (categoriesSection) {
                categoriesSection.style.display = 'none';
            }
            
            displayPackages();
            hideLoading();
            showShop();
            log('Shop displayed successfully');
            
            // Check for success parameter in URL
            checkPurchaseSuccess();
        } else {
            log('No products or categories found');
            hideLoading();
            showEmptyState();
        }
    } catch (error) {
        console.error('Error initializing shop:', error);
        log('Error details:', error);
        showError();
    }
}

// Fetch categories from Backend API
async function fetchCategories() {
    try {
        const url = `${TEBEX_CONFIG.apiBase}/categories`;
        log('Fetching categories from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        log('Categories response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            log('Categories error response:', errorText);
            throw new Error(`Failed to fetch categories: ${response.status}`);
        }
        
        const data = await response.json();
        log('Categories data:', data);
        shopState.categories = data.data || [];
        return shopState.categories;
    } catch (error) {
        console.error('Error fetching categories:', error);
        log('Categories fetch error:', error.message);
        return [];
    }
}

// Fetch packages from Backend API
async function fetchPackages() {
    try {
        const url = `${TEBEX_CONFIG.apiBase}/packages`;
        log('Fetching packages from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        log('Packages response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            log('Packages error response:', errorText);
            throw new Error(`Failed to fetch packages: ${response.status}`);
        }
        
        const data = await response.json();
        log('Packages data:', data);
        
        // Log full package details for debugging
        if (data.data) {
            console.log('All packages full details:', JSON.stringify(data.data, null, 2));
        }
        
        shopState.packages = data.data || [];
        return shopState.packages;
    } catch (error) {
        console.error('Error fetching packages:', error);
        log('Packages fetch error:', error.message);
        return [];
    }
}

// Display categories
function displayCategories() {
    const categoriesContainer = document.getElementById('categories-list');
    const categoryFilter = document.getElementById('category-filter');
    
    if (!categoriesContainer || !categoryFilter) return;
    
    if (shopState.categories.length === 0) {
        document.getElementById('shop-categories').style.display = 'none';
        return;
    }
    
    // Clear existing content
    categoriesContainer.innerHTML = '';
    categoryFilter.innerHTML = '';
    
    // Add "All" filter button
    const allButton = createFilterButton('Alle', null);
    categoryFilter.appendChild(allButton);
    
    // Display categories
    shopState.categories.forEach(category => {
        // Category card
        const categoryCard = createCategoryCard(category);
        categoriesContainer.appendChild(categoryCard);
        
        // Filter button
        const filterButton = createFilterButton(category.name, category.id);
        categoryFilter.appendChild(filterButton);
    });
}

// Create category card
function createCategoryCard(category) {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.onclick = () => filterByCategory(category.id);
    
    card.innerHTML = `
        <div class="category-icon">📦</div>
        <h3>${escapeHtml(category.name)}</h3>
        <p>${escapeHtml(category.description || 'Entdecke unsere Angebote')}</p>
    `;
    
    return card;
}

// Create filter button
function createFilterButton(text, categoryId) {
    const button = document.createElement('button');
    button.className = 'btn btn-filter' + (categoryId === shopState.selectedCategory ? ' active' : '');
    button.textContent = text;
    button.onclick = (e) => {
        e.preventDefault();
        filterByCategory(categoryId, e.target);
    };
    
    return button;
}

// Filter products by category
function filterByCategory(categoryId, targetButton) {
    shopState.selectedCategory = categoryId;
    
    // Update filter buttons
    const filterButtons = document.querySelectorAll('.btn-filter');
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    if (targetButton) {
        targetButton.classList.add('active');
    }
    
    // Update products display
    displayPackages();
    
    // Scroll to products
    document.getElementById('shop-products').scrollIntoView({ behavior: 'smooth' });
}

// Display packages
function displayPackages() {
    const productsContainer = document.getElementById('products-list');
    
    if (!productsContainer) return;
    
    // Clear existing content
    productsContainer.innerHTML = '';
    
    // Display packages
    if (shopState.packages.length === 0) {
        productsContainer.innerHTML = '<div class="no-products"><p>Keine Produkte gefunden.</p></div>';
        return;
    }
    
    shopState.packages.forEach(pkg => {
        let card;
        
        // Check if package offers both subscription and one-time purchase
        if (pkg.type === 'both') {
            card = createVIPPlusCard(pkg);
        } else {
            card = createProductCard(pkg);
        }
        
        productsContainer.appendChild(card);
    });
    
    // Align product card heights with sidebar after rendering
    setTimeout(() => {
        alignProductCardsWithSidebar();
    }, 100);
}

// Create product card
function createProductCard(pkg) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Format price
    const price = pkg.base_price ? `${pkg.base_price.toFixed(2)} ${pkg.currency || 'EUR'}` : 'Preis auf Anfrage';
    
    // Get image (use first image if available)
    const imageUrl = pkg.image || './assets/images/logo.png';
    
    // Check if package is subscription
    const isSubscription = pkg.expiry_period && pkg.expiry_period !== 'once';
    const subscriptionText = isSubscription ? getSubscriptionText(pkg.expiry_period, pkg.expiry_length) : null;
    
    // Check if package is on sale
    const onSale = pkg.sale && pkg.sale.active;
    const salePrice = onSale ? pkg.sale.price : null;
    
    card.innerHTML = `
        <div class="product-badge-top">
            ${onSale ? '<span class="badge badge-sale">Sale</span>' : ''}
            <span class="badge ${isSubscription ? 'badge-subscription' : 'badge-onetime'}">${isSubscription ? 'Monatlich' : 'Einmalig'}</span>
        </div>
        <div class="product-image">
            <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(pkg.name)}" onerror="this.src='./assets/images/logo.png'">
        </div>
        <div class="product-content">
            <h3 class="product-name">${escapeHtml(pkg.name)}</h3>
            <div class="product-description">${sanitizeDescription(pkg.description)}</div>
            <div class="product-footer">
                <div class="product-price">
                    ${onSale ? `
                        <span class="price-original">${price}</span>
                        <span class="price-sale">${salePrice.toFixed(2)} ${pkg.currency || 'EUR'}</span>
                    ` : `
                        <span class="price-current">${price}</span>
                    `}
                    ${isSubscription ? `<span class="price-subscription">${subscriptionText}</span>` : ''}
                </div>
                <button class="btn btn-primary btn-add-cart" onclick="addToCart(${pkg.id})">
                    In den Warenkorb
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Create VIP+ card with both variants (for packages with type: 'both')
function createVIPPlusCard(pkg) {
    const card = document.createElement('div');
    card.className = 'product-card vipplus-card';
    
    console.log('Creating VIP+ card for package:', pkg.name, 'type:', pkg.type);
    
    const imageUrl = pkg.image || './assets/images/logo.png';
    const price = pkg.base_price.toFixed(2);
    const currency = pkg.currency || 'EUR';
    
    // For type: 'both', we show both one-time and subscription options
    card.innerHTML = `
        <div class="product-badge-top">
            <span class="badge badge-both">Einmalig / Monatlich</span>
        </div>
        <div class="product-image">
            <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(pkg.name)}" onerror="this.src='./assets/images/logo.png'">
        </div>
        <div class="product-content">
            <h3 class="product-name">${escapeHtml(pkg.name)}</h3>
            
            <div class="product-requirements">
                <span class="requirement-icon">⚠️</span>
                <span class="requirement-text">Benötigt: <strong>VIP Rang</strong></span>
            </div>
            
            <div class="product-description">${sanitizeDescription(pkg.description)}</div>
            
            <div class="vipplus-variants">
                <h4 class="variants-title">Wähle deine Variante:</h4>
                <div class="variants-grid">
                    <div class="variant-option">
                        <div class="variant-badge badge-onetime">Einmalig</div>
                        <div class="variant-info">
                            <div class="variant-duration">30 Tage</div>
                            <div class="variant-price">
                                <span class="price-amount">${price}</span>
                                <span class="price-currency">${currency}</span>
                            </div>
                        </div>
                        <button class="btn btn-primary btn-add-cart" onclick="addToCart(${pkg.id}, 'single')">
                            Kaufen
                        </button>
                    </div>
                    <div class="variant-option variant-featured">
                        <div class="variant-ribbon">Empfohlen</div>
                        <div class="variant-badge badge-subscription">Abo</div>
                        <div class="variant-info">
                            <div class="variant-duration">Monatlich verlängert</div>
                            <div class="variant-price">
                                <span class="price-amount">${price}</span>
                                <span class="price-currency">${currency}</span>
                                <span class="price-period">pro Monat</span>
                            </div>
                        </div>
                        <button class="btn btn-primary btn-add-cart" onclick="addToCart(${pkg.id}, 'subscription')">
                            Kaufen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Add product to cart
function addToCart(packageId, purchaseType = null) {
    const pkg = shopState.packages.find(p => p.id === packageId);
    if (!pkg) return;
    
    // For packages with type 'both', we need to track the purchase type
    const cartKey = purchaseType ? `${packageId}_${purchaseType}` : packageId;
    
    // Check if already in cart
    const existingItem = shopState.cart.find(item => {
        if (purchaseType) {
            return item.id === packageId && item.purchaseType === purchaseType;
        }
        return item.id === packageId;
    });
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        const cartItem = {
            id: pkg.id,
            name: pkg.name,
            price: pkg.sale && pkg.sale.active ? pkg.sale.price : pkg.base_price,
            currency: pkg.currency || 'EUR',
            image: pkg.image,
            quantity: 1
        };
        
        // Add purchase type if specified (for 'both' type packages)
        if (purchaseType) {
            cartItem.purchaseType = purchaseType;
            cartItem.name = `${pkg.name} (${purchaseType === 'subscription' ? 'Abo' : 'Einmalig'})`;
        }
        
        shopState.cart.push(cartItem);
    }
    
    updateCart();
    showNotification('Zum Warenkorb hinzugefügt!');
}

// Remove from cart
function removeFromCart(packageId) {
    shopState.cart = shopState.cart.filter(item => item.id !== packageId);
    updateCart();
}

// Update cart quantity
function updateCartQuantity(packageId, change) {
    const item = shopState.cart.find(item => item.id === packageId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(packageId);
    } else {
        updateCart();
    }
}

// Update cart display
function updateCart() {
    const cartButton = document.getElementById('cart-button');
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartFooter = document.getElementById('cart-footer');
    const cartTotalPrice = document.getElementById('cart-total-price');
    
    const totalItems = shopState.cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalItems;
    
    if (cartButton) {
        cartButton.style.display = totalItems > 0 ? 'block' : 'none';
    }
    
    if (cartItems) {
        if (shopState.cart.length === 0) {
            cartItems.innerHTML = '<div class="cart-empty"><p>Dein Warenkorb ist leer</p></div>';
            if (cartFooter) cartFooter.style.display = 'none';
        } else {
            cartItems.innerHTML = '';
            shopState.cart.forEach(item => {
                const cartItem = createCartItem(item);
                cartItems.appendChild(cartItem);
            });
            
            if (cartFooter) cartFooter.style.display = 'block';
            
            const total = shopState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            if (cartTotalPrice) {
                const currency = shopState.cart[0]?.currency || 'EUR';
                cartTotalPrice.textContent = `${total.toFixed(2)} ${currency}`;
            }
        }
    }
}

// Create cart item element
function createCartItem(item) {
    const div = document.createElement('div');
    div.className = 'cart-item';
    
    div.innerHTML = `
        <img src="${escapeHtml(item.image || './assets/images/logo.png')}" alt="${escapeHtml(item.name)}" class="cart-item-image" onerror="this.src='./assets/images/logo.png'">
        <div class="cart-item-info">
            <h4>${escapeHtml(item.name)}</h4>
            <div class="cart-item-price">${item.price.toFixed(2)} ${item.currency}</div>
        </div>
        <div class="cart-item-controls">
            <button class="btn-quantity" onclick="updateCartQuantity(${item.id}, -1)">−</button>
            <span class="cart-item-quantity">${item.quantity}</span>
            <button class="btn-quantity" onclick="updateCartQuantity(${item.id}, 1)">+</button>
        </div>
        <button class="btn-remove" onclick="removeFromCart(${item.id})">🗑️</button>
    `;
    
    return div;
}

// Toggle cart sidebar
function toggleCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    if (cartSidebar) {
        cartSidebar.classList.toggle('active');
    }
}

// Proceed to checkout
async function proceedToCheckout() {
    if (shopState.cart.length === 0) {
        showNotification('Dein Warenkorb ist leer', 'warning');
        return;
    }
    
    // Open checkout modal
    openCheckoutModal();
}

// UI Helper Functions
function showLoading() {
    const loading = document.getElementById('shop-loading');
    if (loading) loading.style.display = 'block';
}

function hideLoading() {
    const loading = document.getElementById('shop-loading');
    if (loading) loading.style.display = 'none';
}

function showError() {
    hideLoading();
    const error = document.getElementById('shop-error');
    if (error) error.style.display = 'block';
}

function showShop() {
    const categories = document.getElementById('shop-categories');
    const products = document.getElementById('shop-products');
    
    if (categories && shopState.categories.length > 0) {
        categories.style.display = 'block';
        log('Showing categories section');
    }
    
    if (products && shopState.packages.length > 0) {
        products.style.display = 'block';
        log('Showing products section');
    }
}

function showEmptyState() {
    const products = document.getElementById('shop-products');
    if (products) {
        products.style.display = 'block';
        const container = document.getElementById('products-list');
        if (container) {
            container.innerHTML = `
                <div class="no-products">
                    <h3>Noch keine Produkte verfügbar</h3>
                    <p>Der Shop wird gerade eingerichtet. Schau später wieder vorbei!</p>
                </div>
            `;
        }
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sanitizeDescription(html) {
    if (!html) return 'Keine Beschreibung verfügbar';
    
    // Create a temporary div to parse HTML
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // Remove any script tags for security
    const scripts = div.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
        scripts[i].remove();
    }
    
    // Return sanitized HTML
    return div.innerHTML;
}

// Get subscription text based on period
function getSubscriptionText(period, length) {
    length = length || 1;
    
    switch(period) {
        case 'day':
            return length === 1 ? 'pro Tag' : `alle ${length} Tage`;
        case 'week':
            return length === 1 ? 'pro Woche' : `alle ${length} Wochen`;
        case 'month':
            return length === 1 ? 'pro Monat' : `alle ${length} Monate`;
        case 'year':
            return length === 1 ? 'pro Jahr' : `alle ${length} Jahre`;
        default:
            return 'Einmalig';
    }
}

// Checkout Modal Functions
function openCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (!modal) return;
    
    // Reset to step 1
    shopState.checkoutStep = 1;
    updateCheckoutStep();
    
    // Pre-fill username if saved
    const usernameInput = document.getElementById('minecraft-username');
    if (usernameInput && shopState.minecraftUsername) {
        usernameInput.value = shopState.minecraftUsername;
    }
    
    // Update cart summary
    updateCheckoutCartSummary();
    
    // Show modal
    modal.style.display = 'flex';
    
    // Focus username input
    setTimeout(() => {
        if (usernameInput) usernameInput.focus();
    }, 100);
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    shopState.checkoutStep = 1;
}

function updateCheckoutStep() {
    // Hide all steps
    for (let i = 1; i <= 2; i++) {
        const stepContent = document.getElementById(`checkout-step-${i}`);
        const stepIndicator = document.querySelector(`.checkout-step[data-step="${i}"]`);
        
        if (stepContent) {
            stepContent.style.display = i === shopState.checkoutStep ? 'block' : 'none';
        }
        
        if (stepIndicator) {
            stepIndicator.classList.toggle('active', i === shopState.checkoutStep);
            stepIndicator.classList.toggle('completed', i < shopState.checkoutStep);
        }
    }
    
    // Update buttons
    const backBtn = document.getElementById('checkout-back');
    const nextBtn = document.getElementById('checkout-next');
    const finishBtn = document.getElementById('checkout-finish');
    
    if (backBtn) backBtn.style.display = shopState.checkoutStep > 1 ? 'inline-block' : 'none';
    if (nextBtn) nextBtn.style.display = shopState.checkoutStep < 2 ? 'inline-block' : 'none';
    if (finishBtn) finishBtn.style.display = shopState.checkoutStep === 2 ? 'inline-block' : 'none';
    
    // Update step 2 summary
    if (shopState.checkoutStep === 2) {
        updateFinalSummary();
    }
}

function checkoutNextStep() {
    // Validate current step
    if (shopState.checkoutStep === 1) {
        if (!validateUsername()) {
            return;
        }
    }
    
    // Move to next step
    if (shopState.checkoutStep < 3) {
        shopState.checkoutStep++;
        updateCheckoutStep();
    }
}

function checkoutPrevStep() {
    if (shopState.checkoutStep > 1) {
        shopState.checkoutStep--;
        updateCheckoutStep();
    }
}

function validateUsername() {
    const input = document.getElementById('minecraft-username');
    
    if (!input) return false;
    
    const username = input.value.trim();
    
    // Check if empty
    if (!username) {
        showNotification('Bitte gib einen Minecraft Username ein', 'error');
        input.focus();
        return false;
    }
    
    // Automatic detection: Bedrock names start with a dot
    const isBedrock = username.startsWith('.');
    
    if (isBedrock) {
        // Bedrock Edition
        const bedrockName = username.substring(1); // Remove dot for validation
        
        if (bedrockName.length < 3 || bedrockName.length > 16) {
            showNotification('Bedrock Username muss zwischen 3 und 16 Zeichen lang sein (ohne Punkt)', 'error');
            input.focus();
            return false;
        }
        
        if (!/^[a-zA-Z0-9_ ]+$/.test(bedrockName)) {
            showNotification('Bedrock Username darf nur Buchstaben, Zahlen, Unterstriche und Leerzeichen enthalten', 'error');
            input.focus();
            return false;
        }
        
        // Save as Bedrock username
        shopState.minecraftUsername = username;
        shopState.bedrockUsername = username;
        localStorage.setItem('minecraftUsername', username);
        localStorage.setItem('bedrockUsername', username);
    } else {
        // Java Edition
        if (username.length < 3 || username.length > 16) {
            showNotification('Java Username muss zwischen 3 und 16 Zeichen lang sein', 'error');
            input.focus();
            return false;
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            showNotification('Java Username darf nur Buchstaben, Zahlen und Unterstriche enthalten', 'error');
            input.focus();
            return false;
        }
        
        // Save as Java username
        shopState.minecraftUsername = username;
        localStorage.setItem('minecraftUsername', username);
    }
    
    return true;
}

function updateCheckoutCartSummary() {
    const container = document.getElementById('checkout-cart-items');
    const totalElement = document.getElementById('checkout-total');
    
    if (!container) return;
    
    container.innerHTML = '';
    let total = 0;
    
    shopState.cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-summary-item';
        itemDiv.innerHTML = `
            <span class="item-name">${escapeHtml(item.name)} x${item.quantity}</span>
            <span class="item-price">${itemTotal.toFixed(2)} EUR</span>
        `;
        container.appendChild(itemDiv);
    });
    
    if (totalElement) {
        totalElement.textContent = `${total.toFixed(2)} EUR`;
    }
}

function updateFinalSummary() {
    // Update cart items
    const cartContainer = document.getElementById('final-cart-items');
    const totalElement = document.getElementById('final-total');
    
    if (cartContainer) {
        cartContainer.innerHTML = '';
        let total = 0;
        
        shopState.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'summary-item';
            itemDiv.innerHTML = `
                <div class="item-details">
                    <span class="item-name">${escapeHtml(item.name)}</span>
                    <span class="item-quantity">Anzahl: ${item.quantity}</span>
                </div>
                <span class="item-price">${itemTotal.toFixed(2)} EUR</span>
            `;
            cartContainer.appendChild(itemDiv);
        });
        
        if (totalElement) {
            totalElement.textContent = `${total.toFixed(2)} EUR`;
        }
    }
    
    // Update user info
    const usernameElement = document.getElementById('summary-username');
    
    if (usernameElement) {
        usernameElement.textContent = shopState.minecraftUsername || '-';
    }
}

async function finishCheckout() {
    if (!shopState.minecraftUsername) {
        showNotification('Bitte gehe zurück und gib deinen Username ein', 'error');
        return;
    }
    
    try {
        log('Creating basket...');
        
        const basketData = {
            packages: shopState.cart.map(item => {
                const pkgData = {
                    id: item.id,
                    quantity: item.quantity
                };
                
                // Add type for 'both' packages (subscription vs one-time)
                if (item.purchaseType) {
                    pkgData.type = item.purchaseType;
                }
                
                return pkgData;
            }),
            username: shopState.minecraftUsername
        };
        
        // Add bedrock username if provided
        if (shopState.bedrockUsername) {
            basketData.bedrockUsername = shopState.bedrockUsername;
        }
        
        log('Basket data:', basketData);
        
        const url = `${TEBEX_CONFIG.apiBase}/basket`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(basketData)
        });
        
        log('Basket response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            log('Basket error response:', errorData);
            throw new Error(errorData.message || 'Failed to create basket');
        }
        
        const data = await response.json();
        log('Basket data:', data);
        
        if (data.data && data.data.links && data.data.links.checkout) {
            window.location.href = data.data.links.checkout;
        } else if (data.links && data.links.checkout) {
            window.location.href = data.links.checkout;
        } else {
            throw new Error('No checkout URL received');
        }
    } catch (error) {
        console.error('Error creating basket:', error);
        log('Basket creation error:', error.message);
        showNotification('Fehler beim Erstellen des Warenkorbs: ' + error.message, 'error');
    }
}

// Check for purchase success
function checkPurchaseSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
        showSuccessAnimation();
        
        // Clear cart
        shopState.cart = [];
        updateCart();
        
        // Remove success parameter from URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
    }
}

function showSuccessAnimation() {
    const overlay = document.getElementById('success-overlay');
    if (!overlay) return;
    
    overlay.style.display = 'flex';
    
    // Trigger animation
    setTimeout(() => {
        overlay.classList.add('active');
    }, 100);
    
    // Hide after 5 seconds
    setTimeout(() => {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 500);
    }, 5000);
}

// Sidebar Stats Functions
function initSidebarStats() {
    fetchServerStatus();
    fetchTopSupporters();
    fetchCommunityGoal();
    fetchRecentPurchases();
    
    // Update stats every 30 seconds
    setInterval(() => {
        fetchServerStatus();
    }, 30000);
}

async function fetchServerStatus() {
    try {
        console.log('Fetching server status...');
        // Use same API as index.html
        const javaResponse = await fetch('https://mcapi.avegamers.net/api/server/status?host=play.holysmp.net&port=25565&type=java', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        console.log('Server status response:', javaResponse.status);
        
        if (javaResponse.ok) {
            const javaData = await javaResponse.json();
            console.log('Server status data:', javaData);
            
            if (javaData.data && javaData.data.online === true && javaData.data.players) {
                const playersOnline = javaData.data.players.online || 0;
                console.log('Players online:', playersOnline);
                
                const playersElement = document.getElementById('server-players');
                const statusElement = document.getElementById('server-status');
                
                console.log('Player element found:', !!playersElement);
                console.log('Status element found:', !!statusElement);
                
                if (playersElement) {
                    playersElement.textContent = playersOnline;
                }
                
                if (statusElement) {
                    statusElement.innerHTML = '🟢 Online';
                    statusElement.classList.add('stat-online');
                }
            } else {
                console.log('Server data structure unexpected:', javaData);
                // Fallback: Server ist offline oder keine Daten
                const statusElement = document.getElementById('server-status');
                if (statusElement) {
                    statusElement.innerHTML = '🔴 Offline';
                    statusElement.classList.remove('stat-online');
                }
            }
        } else {
            console.log('Server response not OK');
        }
    } catch (error) {
        console.error('Error fetching server status:', error);
        const statusElement = document.getElementById('server-status');
        if (statusElement) {
            statusElement.innerHTML = '🔴 Offline';
            statusElement.classList.remove('stat-online');
        }
    }
}

async function fetchTopSupporters() {
    try {
        const response = await fetch(`${TEBEX_CONFIG.apiBase}/stats/top-supporters`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Top supporters data:', data);
            displayTopSupporters(data.supporters || []);
            return;
        }
    } catch (error) {
        console.error('Could not fetch top supporters:', error);
    }
    
    // Fallback to mock data
    const supporters = [
        { name: 'BuildMaster', amount: 150 },
        { name: 'CoolGamer', amount: 120 },
        { name: 'RedstoneKing', amount: 95 }
    ];
    displayTopSupporters(supporters);
}

function displayTopSupporters(supporters) {
    const container = document.getElementById('top-supporters');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (supporters.length === 0) {
        container.innerHTML = '<p class="sidebar-empty">Noch keine Daten verfügbar</p>';
        return;
    }
    
    supporters.slice(0, 3).forEach((supporter, index) => {
        const item = document.createElement('div');
        item.className = 'supporter-item';
        item.innerHTML = `
            <span class="supporter-rank">#${index + 1}</span>
            <span class="supporter-name">${escapeHtml(supporter.name)}</span>
            <span class="supporter-amount">${supporter.amount}€</span>
        `;
        container.appendChild(item);
    });
}

async function fetchCommunityGoal() {
    try {
        // Try to fetch from backend
        const response = await fetch(`${TEBEX_CONFIG.apiBase}/stats/goal`);
        
        if (response.ok) {
            const data = await response.json();
            displayCommunityGoal(data.current || 0, data.target || 500);
            return;
        }
    } catch (error) {
        log('Could not fetch community goal:', error);
    }
    
    // Fallback to mock data
    displayCommunityGoal(0, 500);
}

function displayCommunityGoal(current, target) {
    const percentage = Math.min((current / target) * 100, 100);
    
    const progressBar = document.getElementById('goal-progress');
    const currentElement = document.getElementById('goal-current');
    const targetElement = document.getElementById('goal-target');
    
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    
    if (currentElement) {
        currentElement.textContent = `${current}€`;
    }
    
    if (targetElement) {
        targetElement.textContent = `/ ${target}€`;
    }
}

async function fetchRecentPurchases() {
    try {
        // Try to fetch from backend
        const response = await fetch(`${TEBEX_CONFIG.apiBase}/stats/recent-purchases`);
        
        if (response.ok) {
            const data = await response.json();
            displayRecentPurchases(data.purchases || []);
            return;
        }
    } catch (error) {
        log('Could not fetch recent purchases:', error);
    }
    
    // Fallback to mock data
    const purchases = [
        { player: 'Loading...', product: '-' }
    ];
    displayRecentPurchases(purchases);
}

function displayRecentPurchases(purchases) {
    const container = document.getElementById('recent-purchases');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (purchases.length === 0) {
        container.innerHTML = '<p class="sidebar-empty">Noch keine Daten verfügbar</p>';
        return;
    }
    
    purchases.slice(0, 3).forEach(purchase => {
        const item = document.createElement('div');
        item.className = 'purchase-item';
        item.innerHTML = `
            <span class="purchase-icon">🎁</span>
            <div class="purchase-info">
                <span class="purchase-player">${escapeHtml(purchase.player)}</span>
                <span class="purchase-product">${escapeHtml(purchase.product)}</span>
            </div>
        `;
        container.appendChild(item);
    });
}

// Align product cards height with sidebar
function alignProductCardsWithSidebar() {
    const sidebar = document.querySelector('.shop-sidebar');
    const productCards = document.querySelectorAll('.product-card');
    
    if (!sidebar || productCards.length === 0) return;
    
    // Get sidebar total height
    const sidebarHeight = sidebar.offsetHeight;
    
    // Set product cards to match sidebar height
    productCards.forEach(card => {
        card.style.minHeight = `${sidebarHeight}px`;
    });
}

function initCurrentYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        document.addEventListener('click', function(e) {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
}

// Global functions
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.toggleCart = toggleCart;
window.proceedToCheckout = proceedToCheckout;

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Tebex Configuration
const TEBEX_CONFIG = {
    webstoreId: process.env.TEBEX_WEBSTORE_ID,
    projectId: process.env.TEBEX_PROJECT_ID,
    publicToken: process.env.TEBEX_PUBLIC_TOKEN,
    secretToken: process.env.TEBEX_SECRET_TOKEN,
    apiBase: 'https://headless.tebex.io/api'
};

// Middleware
app.use(helmet());
app.use(compression());

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Get all categories
app.get('/api/categories', async (req, res) => {
    try {
        console.log('Fetching categories from Tebex...');
        
        const response = await axios.get(
            `${TEBEX_CONFIG.apiBase}/accounts/${TEBEX_CONFIG.publicToken}/categories?includePackages=1`,
            {
                headers: {
                    'Accept': 'application/json'
                }
            }
        );
        
        console.log('Categories fetched successfully');
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching categories:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch categories',
            message: error.message
        });
    }
});

// Get all packages
app.get('/api/packages', async (req, res) => {
    try {
        console.log('Fetching packages from Tebex...');
        
        const response = await axios.get(
            `${TEBEX_CONFIG.apiBase}/accounts/${TEBEX_CONFIG.publicToken}/packages`,
            {
                headers: {
                    'Accept': 'application/json'
                }
            }
        );
        
        console.log('Packages fetched successfully');
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching packages:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch packages',
            message: error.message
        });
    }
});

// Get specific package by ID
app.get('/api/packages/:id', async (req, res) => {
    try {
        const packageId = req.params.id;
        console.log(`Fetching package ${packageId} from Tebex...`);
        
        const response = await axios.get(
            `${TEBEX_CONFIG.apiBase}/accounts/${TEBEX_CONFIG.publicToken}/packages/${packageId}`,
            {
                headers: {
                    'Accept': 'application/json'
                }
            }
        );
        
        console.log('Package fetched successfully');
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching package:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch package',
            message: error.message
        });
    }
});

// Create basket
app.post('/api/basket', async (req, res) => {
    try {
        const { packages, username } = req.body;
        
        if (!packages || !Array.isArray(packages) || packages.length === 0) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Packages array is required'
            });
        }
        
        console.log('Creating basket with packages:', packages);
        console.log('Minecraft Username:', username);
        
        // Build basket request
        const basketRequest = {
            complete_url: 'https://holysmp.net/shop?success=true',
            cancel_url: 'https://holysmp.net/shop'
        };
        
        // Add username if provided (Minecraft username)
        if (username) {
            basketRequest.username = username;
        }
        
        console.log('Basket request:', JSON.stringify(basketRequest, null, 2));
        
        // First create empty basket with Basic Auth (Secret Token required)
        const basketResponse = await axios.post(
            `${TEBEX_CONFIG.apiBase}/accounts/${TEBEX_CONFIG.publicToken}/baskets`,
            basketRequest,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                auth: {
                    username: TEBEX_CONFIG.publicToken,
                    password: TEBEX_CONFIG.secretToken
                }
            }
        );
        
        const basketIdent = basketResponse.data.data.ident;
        console.log('Basket created:', basketIdent);
        
        // Add packages to basket
        for (const pkg of packages) {
            const packageRequest = {
                package_id: pkg.id,
                quantity: pkg.quantity || 1
            };
            
            // Add type if specified (for packages with both subscription and one-time options)
            if (pkg.type) {
                packageRequest.type = pkg.type;
            }
            
            console.log('Adding package to basket:', JSON.stringify(packageRequest, null, 2));
            
            await axios.post(
                `${TEBEX_CONFIG.apiBase}/baskets/${basketIdent}/packages`,
                packageRequest,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );
        }
        
        // Get final basket
        const finalBasket = await axios.get(
            `${TEBEX_CONFIG.apiBase}/accounts/${TEBEX_CONFIG.publicToken}/baskets/${basketIdent}`,
            {
                headers: {
                    'Accept': 'application/json'
                }
            }
        );
        
        console.log('Basket ready for checkout');
        res.json(finalBasket.data);
    } catch (error) {
        console.error('Error creating basket:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        res.status(error.response?.status || 500).json({
            error: 'Failed to create basket',
            message: error.message,
            details: error.response?.data
        });
    }
});

// Get webstore information
app.get('/api/info', async (req, res) => {
    try {
        console.log('Fetching webstore info from Tebex...');
        
        const response = await axios.get(
            `${TEBEX_CONFIG.apiBase}/accounts/${TEBEX_CONFIG.publicToken}/categories`,
            {
                headers: {
                    'Accept': 'application/json'
                }
            }
        );
        
        console.log('Webstore info fetched successfully');
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching webstore info:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch webstore info',
            message: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Stats endpoints - Using mock data as Headless API doesn't provide sales analytics
app.get('/api/stats/top-supporters', async (req, res) => {
    // Headless API doesn't provide payment history or top supporters
    // This would require the Plugin API with a different token type
    const supporters = [
        { name: 'BuildMaster', amount: 150 },
        { name: 'CoolGamer', amount: 120 },
        { name: 'RedstoneKing', amount: 95 }
    ];
    
    res.json({
        success: true,
        supporters
    });
});

app.get('/api/stats/goal', (req, res) => {
    // TODO: Connect to actual database
    const current = 342;
    const target = 500;
    
    res.json({
        success: true,
        current,
        target,
        percentage: (current / target) * 100
    });
});

app.get('/api/stats/recent-purchases', (req, res) => {
    // TODO: Connect to actual Tebex purchase history
    const purchases = [
        { player: 'Max123', product: 'VIP Rang' },
        { player: 'Lisa456', product: 'VIP+ Rang (Abo)' },
        { player: 'Tom789', product: 'VIP Rang' }
    ];
    
    res.json({
        success: true,
        purchases
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Start server
app.listen(PORT, () => {
    console.log('=================================');
    console.log(`HolySMP Shop API Server`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Port: ${PORT}`);
    console.log(`Tebex Webstore: ${TEBEX_CONFIG.webstoreId}`);
    console.log(`API Base URL: ${TEBEX_CONFIG.apiBase}`);
    console.log('=================================');
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

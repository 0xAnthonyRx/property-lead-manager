const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Import Supabase client
const supabase = require('./config/database');

// Import routes
const leadsRoutes = require('./routes/leads');
const authRoutes = require('./routes/auth');

// Routes
app.get('/', (req, res) => {
    res.json({ 
        message: ' Property Lead Manager API',
        status: 'running',
        version: '1.0.0'
    });
});

// API Routes
app.use('/api/leads', leadsRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', async (req, res) => {
    try {
        // Test Supabase connection by querying agents table
        const { data, error } = await supabase
            .from('agents')
            .select('count');
        
        if (error) throw error;
        
        res.json({ 
            status: 'healthy',
            database: 'connected',
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

// Import routes (add this line with other imports)
//const authRoutes = require('./routes/auth');

// API Routes (add this line with other routes)
//app.use('/api/auth', authRoutes);
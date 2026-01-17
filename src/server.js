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

// --- FIX 1: Point correctly to the 'public' folder (go up one level from src) ---
app.use(express.static(path.join(__dirname, '../public')));

// Import Supabase client
const supabase = require('./config/database');

// Import routes
const leadsRoutes = require('./routes/leads');
const authRoutes = require('./routes/auth');

// --- FIX 2: Serve the index.html instead of the JSON message ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API Routes
app.use('/api/leads', leadsRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', async (req, res) => {
    try {
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
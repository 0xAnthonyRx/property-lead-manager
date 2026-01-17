const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // Import FS to debug
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- DEBUGGING BLOCK (Will show in Render Logs) ---
console.log('Current Working Directory:', process.cwd());
const publicPath = path.join(process.cwd(), 'public');
console.log('Looking for public folder at:', publicPath);

if (fs.existsSync(publicPath)) {
    console.log('✅ Public folder found!');
    console.log('Contents:', fs.readdirSync(publicPath));
} else {
    console.log('❌ Public folder NOT found at this path.');
}
// --------------------------------------------------

// FIX: Use process.cwd() to ensure we look from the project root
app.use(express.static(publicPath));

// Import Supabase client
const supabase = require('./config/database');

// Import routes
const leadsRoutes = require('./routes/leads');
const authRoutes = require('./routes/auth');

// FIX: Serve index.html explicitly using the safe path
app.get('/', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Error: index.html not found on server.');
    }
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

app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
});
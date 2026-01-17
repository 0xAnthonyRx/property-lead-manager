const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); 
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Establish the Project Root and Public Path
// We use process.cwd() because Render starts the process from the root folder
const rootDir = process.cwd();
const publicPath = path.join(rootDir, 'public');

// Debugging logs to confirm where we are looking (You can remove these later)
console.log(' Project Root:', rootDir);
console.log(' Public Folder:', publicPath);

// 2. Serve the entire 'public' folder as static assets
app.use(express.static(publicPath));

// Import Supabase client and Routes
const supabase = require('./config/database');
const leadsRoutes = require('./routes/leads');
const authRoutes = require('./routes/auth');

// 3. FIX: Point the Root URL ('/') to 'dashboard/login.html'
app.get('/', (req, res) => {
    // Your screenshots show the file is at: public/dashboard/login.html
    const loginPath = path.join(publicPath, 'dashboard', 'login.html');
    
    // Alternative: If you prefer the dashboard index:
    // const indexPath = path.join(publicPath, 'dashboard', 'index.html');

    if (fs.existsSync(loginPath)) {
        res.sendFile(loginPath);
    } else {
        console.error(' File not found at:', loginPath);
        res.status(404).send('Error: login.html not found. Check public/dashboard folder.');
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
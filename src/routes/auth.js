const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/database');

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Find agent by email
        const { data: agent, error } = await supabase
            .from('agents')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !agent) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check if agent is active
        if (agent.status !== 'active') {
            return res.status(403).json({
                success: false,
                error: 'Account is not active'
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, agent.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: agent.id,
                agent_id: agent.agent_id,
                email: agent.email,
                name: agent.name
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            agent: {
                id: agent.id,
                agent_id: agent.agent_id,
                name: agent.name,
                email: agent.email,
                package: agent.package
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get fresh agent data
        const { data: agent, error } = await supabase
            .from('agents')
            .select('id, agent_id, name, email, package, status')
            .eq('id', decoded.id)
            .single();

        if (error || !agent || agent.status !== 'active') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }

        res.json({
            success: true,
            agent: agent
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const supabase = require('../config/database');

// Calculate lead score based on form data
function calculateLeadScore(formData) {
    let score = 0;
    
    // Budget scoring (max 40 points)
    const budgetScores = {
        'Above ₦50 million': 40,
        '₦20 - 50 million': 30,
        '₦5 - 20 million': 20,
        'Under ₦5 million': 10
    };
    score += budgetScores[formData.budget] || 10;
    
    // Urgency scoring (max 30 points)
    const urgencyScores = {
        'Within 1 month (Urgent!)': 30,
        '1-3 months': 20,
        '3-6 months': 10,
        'Just browsing for now': 5,
    };
    score += urgencyScores[formData.urgency] || 5;
    
    // Financing scoring (max 20 points)
    const financingScores = {
        'Ready to pay (cash/approved loan)': 20,
        'Cash buyer (no loan needed)': 20,
        'Working on mortgage/loan approval': 10,
        'Need help with financing options': 5,
        'Not sure yet': 5};
    score += financingScores[formData.financing_status] || 5;
    
    // Bonus points for providing email (10 points)
    if (formData.email && formData.email.trim() !== '') {
        score += 10;
    }
    
    return Math.min(score, 100); // Cap at 100
}

// POST /api/leads - Create new lead
router.post('/', async (req, res) => {
    try {
        const formData = req.body;
        
        // Validate required fields
        if (!formData.customer_name || !formData.phone) {
            return res.status(400).json({
                success: false,
                error: 'Customer name and phone are required'
            });
        }
        
        // Calculate lead score
        const leadScore = calculateLeadScore(formData);
        
        // Get agent ID from query parameter or form data
        const agentId = formData.agent_id || req.query.agent_id;
        
        if (!agentId) {
            return res.status(400).json({
                success: false,
                error: 'Agent ID is required'
            });
        }
        
        // Find agent by agent_id (e.g., AG001)
        const { data: agent, error: agentError } = await supabase
            .from('agents')
            .select('id, name, email, phone')
            .eq('agent_id', agentId)
            .single();
        
        if (agentError || !agent) {
            return res.status(404).json({
                success: false,
                error: 'Agent not found with ID: ' + agentId
            });
        }
        
        // Create lead in database
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .insert([{
                agent_id: agent.id, // Use UUID, not AG001
                customer_name: formData.customer_name,
                phone: formData.phone,
                email: formData.email || null,
                budget: formData.budget,
                location: formData.location,
                urgency: formData.urgency,
                financing_status: formData.financing_status,
                property_type: formData.property_type || null,
                lead_score: leadScore,
                status: 'new',
                source: formData.source || 'web_form'
            }])
            .select()
            .single();
        
        if (leadError) {
            console.error('Database error:', leadError);
            return res.status(500).json({
                success: false,
                error: 'Failed to save lead: ' + leadError.message
            });
        }
        
        // Send email notification
//try {
 //   await emailService.sendNewLeadNotification(lead, agent);
 //   console.log('Email notification sent');
//} catch (emailError) {
//    console.error('Email failed but lead saved:', emailError);
    // Don't fail the request if email fails
//}
        
        res.status(201).json({
            success: true,
            message: 'Lead created successfully',
            lead: {
                id: lead.id,
                customer_name: lead.customer_name,
                lead_score: lead.lead_score,
                status: lead.status
            },
            agent: {
                name: agent.name,
                email: agent.email
            }
        });
        
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error: ' + error.message
        });
    }
});

// GET /api/leads - Get all leads (with optional agent filter)
router.get('/', async (req, res) => {
    try {
        const { agent_id, status, min_score } = req.query;
        
        let query = supabase
            .from('leads')
            .select(`
                *,
                agents (
                    agent_id,
                    name,
                    email,
                    phone
                )
            `)
            .order('created_at', { ascending: false });
        
        // Filter by agent if provided
        if (agent_id) {
            const { data: agent } = await supabase
                .from('agents')
                .select('id')
                .eq('agent_id', agent_id)
                .single();
            
            if (agent) {
                query = query.eq('agent_id', agent.id);
            }
        }
        
        // Filter by status if provided
        if (status) {
            query = query.eq('status', status);
        }
        
        // Filter by minimum score if provided
        if (min_score) {
            query = query.gte('lead_score', parseInt(min_score));
        }
        
        const { data: leads, error } = await query;
        
        if (error) {
            throw error;
        }
        
        res.json({
            success: true,
            count: leads.length,
            leads: leads
        });
        
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/leads/:id - Get single lead
router.get('/:id', async (req, res) => {
    try {
        const { data: lead, error } = await supabase
            .from('leads')
            .select(`
                *,
                agents (
                    agent_id,
                    name,
                    email,
                    phone
                )
            `)
            .eq('id', req.params.id)
            .single();
        
        if (error || !lead) {
            return res.status(404).json({
                success: false,
                error: 'Lead not found'
            });
        }
        
        res.json({
            success: true,
            lead: lead
        });
        
    } catch (error) {
        console.error('Error fetching lead:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// PUT /api/leads/:id - Update lead status
router.put('/:id', async (req, res) => {
    try {
        const { status, notes } = req.body;
        
        const updateData = {};
        if (status) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;
        updateData.updated_at = new Date().toISOString();
        
        // If status is being updated to 'contacted', set last_contact
        if (status && ['contacted', 'site_visit_booked'].includes(status)) {
            updateData.last_contact = new Date().toISOString();
        }
        
        const { data: lead, error } = await supabase
            .from('leads')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();
        
        if (error) {
            throw error;
        }
        
        res.json({
            success: true,
            message: 'Lead updated successfully',
            lead: lead
        });
        
    } catch (error) {
        console.error('Error updating lead:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
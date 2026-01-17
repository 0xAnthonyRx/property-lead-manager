const nodemailer = require('nodemailer');
require('dotenv').config();

// Create email transporter
const transporter = nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify connection
transporter.verify(function(error, success) {
    if (error) {
        console.log(' Email config error:', error);
    } else {
        console.log('Email server ready to send messages');
    }
});

// Send new lead notification
async function sendNewLeadNotification(lead, agent) {
    const scoreEmoji = lead.lead_score >= 70 ? '🔥' : lead.lead_score >= 50 ? '📞' : '❄️';
    const urgencyTag = lead.lead_score >= 70 ? 'HOT LEAD!' : lead.lead_score >= 50 ? 'WARM LEAD' : 'COLD LEAD';
    
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: agent.email,
        subject: `${scoreEmoji} New ${urgencyTag} - ${lead.customer_name}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">${scoreEmoji} New Lead Alert!</h1>
                    <p style="margin: 10px 0 0; font-size: 18px;">Score: ${lead.lead_score}/100</p>
                </div>
                
                <div style="padding: 30px; background: #f9f9f9;">
                    <h2 style="color: #333; margin-top: 0;">Customer Details</h2>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px; background: white; border-bottom: 1px solid #eee;"><strong>Name:</strong></td>
                            <td style="padding: 10px; background: white; border-bottom: 1px solid #eee;">${lead.customer_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; background: white; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td>
                            <td style="padding: 10px; background: white; border-bottom: 1px solid #eee;"><a href="tel:${lead.phone}">${lead.phone}</a></td>
                        </tr>
                        ${lead.email ? `
                        <tr>
                            <td style="padding: 10px; background: white; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
                            <td style="padding: 10px; background: white; border-bottom: 1px solid #eee;"><a href="mailto:${lead.email}">${lead.email}</a></td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td style="padding: 10px; background: white; border-bottom: 1px solid #eee;"><strong>Budget:</strong></td>
                            <td style="padding: 10px; background: white; border-bottom: 1px solid #eee;">${lead.budget}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; background: white; border-bottom: 1px solid #eee;"><strong>Location:</strong></td>
                            <td style="padding: 10px; background: white; border-bottom: 1px solid #eee;">${lead.location}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; background: white; border-bottom: 1px solid #eee;"><strong>Urgency:</strong></td>
                            <td style="padding: 10px; background: white; border-bottom: 1px solid #eee;">${lead.urgency}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; background: white; border-bottom: 1px solid #eee;"><strong>Financing:</strong></td>
                            <td style="padding: 10px; background: white; border-bottom: 1px solid #eee;">${lead.financing_status}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; background: white;"><strong>Property Type:</strong></td>
                            <td style="padding: 10px; background: white;">${lead.property_type || 'Not specified'}</td>
                        </tr>
                    </table>
                    
                    <div style="margin-top: 30px; padding: 20px; background: ${lead.lead_score >= 70 ? '#ffe6e6' : lead.lead_score >= 50 ? '#fff9e6' : '#e6f7ff'}; border-radius: 10px;">
                        <h3 style="margin-top: 0; color: #333;">📋 Recommended Action:</h3>
                        <p style="margin: 10px 0; line-height: 1.6;">
                            ${lead.lead_score >= 70 
                                ? '<strong>CALL IMMEDIATELY!</strong> This is a hot lead with high conversion potential. Follow up within 1 hour for best results.'
                                : lead.lead_score >= 50
                                ? '<strong>Follow up today.</strong> This prospect shows good interest. Call within 24 hours.'
                                : 'This lead needs nurturing. Send property info and follow up in 2-3 days.'}
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="tel:${lead.phone}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold;">
                            📞 Call ${lead.customer_name} Now
                        </a>
                    </div>
                </div>
                
                <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
                    <p>Property Lead Manager | Automated Lead Notification System</p>
                </div>
            </div>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(` Email sent to ${agent.email}`);
        return { success: true };
    } catch (error) {
        console.error('Email error:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendNewLeadNotification
};
const express = require('express');
const twilio = require('twilio');
const twilioConfig = require('./twilio-config');

const client = twilio(twilioConfig.accountSid, twilioConfig.authToken);
const app = express();

app.post('/api/send-sms', async (req, res) => {
    try {
        const { to, message } = req.body;
        
        await client.messages.create({
            body: message,
            to: to,
            from: twilioConfig.phoneNumber
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error sending SMS:', error);
        res.status(500).json({ error: 'Failed to send SMS' });
    }
}); 
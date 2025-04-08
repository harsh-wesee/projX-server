const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const authMiddleware = require('../../middleware/authMiddleware');

router.post('/apply/:campaignId', authMiddleware, async (req, res) => {
    try {
        const influencerId = req.user.id;
        const { campaignId } = req.params;
        const { message } = req.body;

        const campaign = await db.oneOrNone(
            'SELECT id, status FROM campaigns WHERE id = $1',
            [campaignId]
        );

        if (!campaign) {
            return res.status(404).json({
                error: 'Campaign not found'
            });
        }

        if (campaign.status !== 'ACTIVE') {
            return res.status(400).json({
                error: 'Campaign is not accepting applications'
            });
        }


        const existingApplication = await db.oneOrNone(
            'SELECT id FROM campaign_applications WHERE campaign_id = $1 AND influencer_id = $2',
            [campaignId, influencerId]
        );

        if (existingApplication) {
            return res.status(400).json({
                error: 'You have already applied to this campaign'
            });
        }

        // Create application
        const newApplication = await db.one(
            `INSERT INTO campaign_applications 
            (campaign_id, influencer_id, message, application_status) 
            VALUES ($1, $2, $3, 'applied') 
            RETURNING id, campaign_id, influencer_id, application_status, message, applied_at`,
            [campaignId, influencerId, message]
        );

        res.status(201).json({
            message: 'Application submitted successfully',
            data: newApplication
        });

    } catch (error) {
        console.error('Error submitting application:', error); 
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
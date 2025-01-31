const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');



router.post('/createCampaign', authMiddleware, async function (req, res) {
    try{

    
        const {
            campaignName,
            campaignDescription,
            campaignStartDate,
            campaignEndDate,
            campaignBudget,
            targetAudience,
            campaignType,
            campaignStatus,
        } = req.body;
    
    // Add your registration logic here
    const requiredFields = [
        'campaignName',
        'campaignDescription',
        'campaignStartDate',
        'campaignEndDate',
        'campaignBudget',
        'targetAudience',
        'campaignType',
        'campaignStatus',
    ];      
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({
                error: `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`
            });
        }
    }
    const brandsId = req.user.id;
    if (!brandsId) {
        return res.status(401).json({
            error: 'Authentication failed: No user ID found'
        });
    }
    const newCampaign = await db.one(
        `INSERT INTO campaigns (
            campaign_name,
            campaign_description,
            campaign_start_date,
            campaign_end_date,
            campaign_budget,
            target_audience,
            campaign_type,
            campaign_status,
            brands_id
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
        ) RETURNING id, campaign_name, campaign_description, campaign_start_date, campaign_end_date, campaign_budget, target_audience, campaign_type, campaign_status, brands_id`,
        [campaignName, campaignDescription, campaignStartDate, campaignEndDate, campaignBudget, targetAudience, campaignType, campaignStatus, brandsId]
    );
    res.status(201).json(newCampaign);
} catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });     
}   

});
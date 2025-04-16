const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const authMiddleware = require('../../middleware/authMiddleware');

// Get all campaigns and their applications for the authenticated brand
router.get('/my-campaigns/applications', authMiddleware, async (req, res) => {
    try {
        const brandId = req.user.id;

        // Fetch all campaigns with their applications
        const campaigns = await db.manyOrNone(
            `SELECT 
                c.id as campaign_id,
                c.name as campaign_title,
                c.status as campaign_status,
                c.created_at as campaign_created_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'application_id', ca.id,
                            'message', ca.message,
                            'status', ca.application_status,
                            'applied_at', ca.applied_at,
                            'influencer', json_build_object(
                                'id', i.id,
                                'name', i.full_name,
                                'email', i.email,
                                'social_media_handles', i.channel_links
                            )
                        )
                    ) FILTER (WHERE ca.id IS NOT NULL), 
                    '[]'
                ) as applications
            FROM campaigns c
            LEFT JOIN campaign_applications ca ON c.id = ca.campaign_id
            LEFT JOIN creators_auth i ON ca.influencer_id = i.id
            WHERE c.brand_id = $1
            GROUP BY c.id
            ORDER BY c.created_at DESC`,
            [brandId]
        );

        res.status(200).json({
            message: 'Campaigns and applications retrieved successfully',
            data: campaigns.map(campaign => ({
                ...campaign,
                applications: campaign.applications === '[]' ? [] : campaign.applications
            }))
        });

    } catch (error) {
        console.error('Error fetching campaigns and applications:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
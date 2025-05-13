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
            `WITH all_applications AS (
                    SELECT
                        ca.id AS application_id,
                        ca.message,
                        ca.application_status AS status,
                        ca.applied_at,
                        ca.campaign_id,
                        i.id AS influencer_id,
                        i.agency_name AS name,
                        i.email,
                        'agency' AS source
                    FROM brand_campaign_application_from_agency ca
                    JOIN media_agencies i ON ca.agency_id = i.id

                    UNION ALL

                    SELECT
                        bcac.id AS application_id,
                        bcac.message,
                        bcac.application_status AS status,
                        bcac.applied_at,
                        bcac.campaign_id,
                        i.id AS influencer_id,
                        i.full_name AS name,
                        i.email,
                        'creator' AS source
                    FROM brand_campaign_application_from_creator bcac
                    JOIN creators_auth i ON bcac.influencer_id = i.id
                )

                SELECT 
                    c.id AS campaign_id,
                    c.name AS campaign_title,
                    c.status AS campaign_status,
                    c.created_at AS campaign_created_at,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'application_id', a.application_id,
                                'message', a.message,
                                'status', a.status,
                                'applied_at', a.applied_at,
                                'source', a.source,
                                'influencer', json_build_object(
                                    'id', a.influencer_id,
                                    'name', a.name,
                                    'email', a.email
                                )
                            )
                        ) FILTER (WHERE a.application_id IS NOT NULL),
                        '[]'
                    ) AS applications
                FROM brand_campaigns c
                LEFT JOIN all_applications a ON c.id = a.campaign_id
                WHERE c.brand_id = $1
                GROUP BY c.id
                ORDER BY c.created_at DESC;
            `,
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
const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const authMiddleware = require('../../middleware/authMiddleware');

router.post('/apply/:campaignId', authMiddleware, async (req, res) => {
    try {
        const influencerId = req.user.id;
        const { campaignId } = req.params;
        const { message } = req.body;

        const campaignInAgencyBucket = await db.oneOrNone(
            'SELECT id, status FROM agency_campaigns WHERE id = $1',
            [campaignId]
        );

        const campaignInBrandBucket = await db.oneOrNone('SELECT id, status FROM brand_campaigns WHERE id = $1', [campaignId]);

        console.log('Campaign in Agency Bucket:', campaignInAgencyBucket);
        console.log('Campaign in Brand Bucket:', campaignInBrandBucket);

        if (!campaignInAgencyBucket && !campaignInBrandBucket) {
            return res.status(404).json({
                error: 'Campaign not found'
            });
        }


        if (campaignInBrandBucket) {
            if (campaignInBrandBucket.status !== 'ACTIVE') {
                return res.status(400).json({
                    error: 'Campaign is not accepting application'
                })
            }

            const existingApplicationInBrandCampaign = await db.oneOrNone(
                'SELECT id FROM brand_campaign_application_from_creator WHERE campaign_id = $1 AND influencer_id = $2',
                [campaignId, influencerId]
            );

            if (!existingApplicationInBrandCampaign) {
                const newApplication = await db.one(
                    `INSERT INTO brand_campaign_application_from_creator 
                    (campaign_id, influencer_id, message, application_status) 
                    VALUES ($1, $2, $3, 'applied') 
                    RETURNING id, campaign_id, influencer_id, application_status, message, applied_at`,
                    [campaignId, influencerId, message]
                )

                res.status(201).json({
                    message: 'Application submitted successfully',
                    data: newApplication
                });
            } else {
                return res.status(400).json({
                    error: 'You have already applied to this campaign'
                });
            }
        }

        if (campaignInAgencyBucket) {
            if (campaignInAgencyBucket.status !== 'ACTIVE') {
                return res.status(400).json({
                    error: 'Campaign is not accepting application'
                })
            }

            const existingApplicationInAgencyCampaign = await db.oneOrNone(
                'SELECT id FROM agency_campaign_application_from_creator WHERE campaign_id = $1 AND influencer_id = $2',
                [campaignId, influencerId]
            );

            if (!existingApplicationInAgencyCampaign) {
                const newApplication = await db.one(
                    `INSERT INTO agency_campaign_application_from_creator 
                    (campaign_id, influencer_id, message, application_status) 
                    VALUES ($1, $2, $3, 'applied') 
                    RETURNING id, campaign_id, influencer_id, application_status, message, applied_at`,
                    [campaignId, influencerId, message]
                )

                res.status(201).json({
                    message: 'Application submitted successfully',
                    data: newApplication
                });
            } else {
                return res.status(400).json({
                    error: 'You have already applied to this campaign'
                });
            }
        }

    } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
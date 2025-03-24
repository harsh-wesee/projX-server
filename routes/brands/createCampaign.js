const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const authMiddleware = require('../../middleware/authMiddleware');
const multer = require('multer');
const storage = multer.memoryStorage();



const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Allow only specific image formats
    if (file.mimetype.match(/^image\/(jpg|jpeg|png|heic)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only jpg, jpeg, png, and heic files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});





router.post('/createCampaign', authMiddleware, upload.single('campaignMedia'), async function (req, res) {
    try {
        const {
            campaignName,
            campaignDescription,
            campaignStartDate,
            campaignEndDate,
            campaignBudget,
            targetAudience,
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

        let mediaBuffer = null;
        if (req.file) {
            mediaBuffer = req.file.buffer;
        }

        const newCampaign = await db.one(
            `INSERT INTO campaigns (
            name,
            description,
            start_date,
            end_date,
            status,
            budget,
            target_audience,
            campaign_media,
            brand_id
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
        ) RETURNING id, name, description, start_date, end_date, status, budget, target_audience, brand_id`,
            [campaignName, campaignDescription, campaignStartDate, campaignEndDate, campaignStatus, campaignBudget, targetAudience, mediaBuffer, brandsId]
        );
        res.status(201).json(newCampaign);
    } catch (error) {
        console.error('Error:', error);
        if (error.message.includes('Invalid file type')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

const validateCampaignHeader = (req, res, next) => {
    const campaignId = req.headers['x-campaign-id'];
    if (!campaignId) {
        return res.status(401).json({ error: 'Campaign ID is required in header (x-campaign-id)' });
    }
    req.campaignId = campaignId;
    next();
};



router.patch('/updateCampaignMetrics/:date_recorded', validateCampaignHeader, async function (req, res) {
    const client = await db.connect();

    try {
        const { date_recorded } = req.params;
        const campaign_id = req.campaignId;
        const { impressions, clicks, conversions, spend } = req.body;

        if (!date_recorded || !Date.parse(date_recorded)) {
            return res.status(400).json({ error: 'Valid date_recorded is required' });
        }

        // Validation to ensure at least one metric is being updated
        if (!impressions && !clicks && !conversions && spend === undefined) {
            return res.status(400).json({
                error: 'At least one metric (impressions, clicks, conversions, or spend) must be provided for update'
            });
        }

        await client.query('BEGIN');
        console.log("CAMPAIGN ID : ---->", campaign_id);

        // Check if campaign exists
        const campaignCheck = await client.query(
            'SELECT id FROM campaigns WHERE id = $1',
            [campaign_id]
        );

        console.log(campaignCheck);

        if (campaignCheck.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Campaign not found' });
        }

        // Upsert campaign metrics
        const result = await client.query(
            `INSERT INTO campaign_metrics (campaign_id, date_recorded, impressions, clicks, conversions, spend)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (campaign_id, date_recorded)
             DO UPDATE SET 
                 impressions = COALESCE(EXCLUDED.impressions, campaign_metrics.impressions),
                 clicks = COALESCE(EXCLUDED.clicks, campaign_metrics.clicks),
                 conversions = COALESCE(EXCLUDED.conversions, campaign_metrics.conversions),
                 spend = COALESCE(EXCLUDED.spend, campaign_metrics.spend)
             RETURNING *`,
            [
                campaign_id,
                date_recorded,
                impressions !== undefined ? impressions : null,
                clicks !== undefined ? clicks : null,
                conversions !== undefined ? conversions : null,
                spend !== undefined ? spend : null
            ]
        );
        

        console.log('Query Result:', result); 

        await client.query('COMMIT');

        res.status(200).json({
            message: 'Campaign metrics updated successfully',
            data: result[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating campaign metrics:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });

    } 
});


router.get('/getCampaignMetrics', async function (req, res) {
    const client = await db.connect();
    try {
        const { campaign_id, date_recorded } = req.query;
        if (!campaign_id || !Number.isInteger(parseInt(campaign_id))) {
            return res.status(400).json({ error: 'Valid campaign_id is required' });
        }


        if (date_recorded && !Date.parse(date_recorded)) {
            return res.status(400).json({ error: 'Valid date_recorded is required' });
        }

        let query;
        let values;

        if (date_recorded) {
            query = `SELECT * FROM campaign_metrics WHERE campaign_id = $1 AND date_recorded = $2`;
            values = [campaign_id, date_recorded];
        } else {
            query = `SELECT * FROM campaign_metrics WHERE campaign_id = $1 ORDER BY date_recorded DESC`;
            values = [campaign_id];
        }


        const result = await client.query(query, values);
        console.log("Result from Campaign metrics", result)
        if (result.length === 0) {
            return res.status(404).json({ error: 'No metrics found for the specified campaign' });
        }

        res.status(200).json({
            message: 'Campaign metrics retrieved successfully',
            data: result
        });


    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });

    }
})


module.exports = router;
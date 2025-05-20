const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const authMiddleware = require('../../middleware/authMiddleware');
const pool = require('../../config/database');
const { check, query } = require('express-validator');
const multer = require('multer');
const storage = multer.memoryStorage();

// Search validation middleware
const searchValidation = [
    query('search').optional().isString().trim(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('minBudget').optional().isNumeric(),
    query('maxBudget').optional().isNumeric(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(), 
];


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

router.post('/applyCampaignAgency/:campaignId', authMiddleware, async (req, res) => {
    try {
        const agencyID = req.user.id;
        const { campaignId } = req.params;
        const { message } = req.body;

        const campaign = await db.oneOrNone(
            'SELECT id, status FROM brand_campaigns WHERE id = $1',
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
            'SELECT id FROM brand_campaign_application_from_agency WHERE campaign_id = $1 AND agency_id = $2',
            [campaignId, agencyID]
        );

        if (existingApplication) {
            return res.status(400).json({
                error: 'You have already applied to this campaign'
            });
        }

        // Create application
        const newApplication = await db.one(
            `INSERT INTO brand_campaign_application_from_agency 
            (campaign_id, message, application_status, agency_id) 
            VALUES ($1, $2, 'applied', $3) 
            RETURNING id, campaign_id, application_status, message, applied_at, agency_id`,
            [campaignId, message, agencyID]
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






// Search campaigns endpoint
router.get('/agencyCampaignSearch', authMiddleware, searchValidation, async (req, res) => {   
    let paramCount = 2;
    try {
        const {
            search,
            startDate,
            endDate,
            minBudget,
            maxBudget,
            page = 1,
            limit = 20
        } = req.query;

        let query = `
            SELECT 
                c.id,
                c.name,
                c.description,
                c.start_date,
                c.end_date,
                c.budget,
                c.target_audience,
                ba.brands_name as brand_name,
                ca.application_status as application_status
            FROM brand_campaigns c
            JOIN brands_auth ba ON c.brand_id = ba.brands_id
            LEFT JOIN brand_campaign_application_from_agency ca ON c.id = ca.campaign_id 
                AND ca.agency_id = $1::uuid 
            WHERE (c.status = 'ACTIVE')
        `;

        const params = [req.user.id]; // Add logged-in user's ID as first parameter
        // Start parameter count from 2

        // Add search conditions
        if (search) {
            query += `
                AND (
                    LOWER(c.name) LIKE $${paramCount}
                    OR LOWER(c.description) LIKE $${paramCount}
                    OR LOWER(c.target_audience) LIKE $${paramCount}
                )
            `;
            params.push(`%${search.toLowerCase()}%`); // Add wildcards before and after the search term
            paramCount++;
        }
        // Add date range conditions
        if (startDate) {
            query += ` AND c.start_date >= $${paramCount}`;
            params.push(startDate);
            paramCount++;
        }

        if (endDate) {
            query += ` AND c.end_date <= $${paramCount}`;
            params.push(endDate);
            paramCount++;
        }

        // Add budget range conditions
        if (minBudget) {
            query += ` AND c.budget >= $${paramCount}`;
            params.push(minBudget);
            paramCount++;
        }

        if (maxBudget) {
            query += ` AND c.budget <= $${paramCount}`;
            params.push(maxBudget);
            paramCount++;
        }

        // Add sorting and pagination
        query += `
            ORDER BY c.start_date DESC
            LIMIT $${paramCount}
            OFFSET $${paramCount + 1}
        `;
        
        params.push(limit, (page - 1) * limit);

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*) 
            FROM brand_campaigns c
            WHERE c.status = 'ACTIVE'
        `;

        // Execute queries in parallel
        const [results, countResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery)
        ]);

        const totalCount = parseInt(countResult[0].count);
        const totalPages = Math.ceil(totalCount / limit);
        console.log(params);

        res.json({
            status: 'success',
            data: results,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalCount,
                itemsPerPage: limit
            }
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while searching campaigns'
        });
    }
});

router.post('/createAgencyCampaign', authMiddleware, upload.single('campaignMedia'), async function (req, res) {
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
        const formattedCampaignStartDate = new Date(campaignStartDate).toISOString().split('T')[0];
        const formattedcampaignEndDate = new Date(campaignEndDate).toISOString().split('T')[0]; 
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    error: `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`
                });
            }
        }
        const agencyId = req.user.id;
        if (!agencyId) {
            return res.status(401).json({
                error: 'Authentication failed: No user ID found'
            });
        }

        let mediaBuffer = null;
        if (req.file) {
            mediaBuffer = req.file.buffer;
        }

        const newCampaign = await db.one(
            `INSERT INTO agency_campaigns (
            name,
            description,
            start_date,
            end_date,
            status,
            budget,
            target_audience,
            campaign_media,
            agency_id
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
        ) RETURNING id, name, description, start_date, end_date, status, budget, target_audience, agency_id`,
            [campaignName, campaignDescription, formattedCampaignStartDate, formattedcampaignEndDate, campaignStatus, campaignBudget, targetAudience, mediaBuffer, agencyId]
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


router.get('/my-campaigns/applications', authMiddleware, async (req, res) => {
    try {
        const agencyId = req.user.id;

        // Fetch all campaigns with their applications
        const campaigns = await db.manyOrNone(
            `SELECT
                        bcac.id AS application_id,
                        bcac.message,
                        bcac.application_status AS status,
                        bcac.applied_at,
                        bcac.campaign_id,
                        i.id AS influencer_id,
                        i.full_name AS name,
                        i.email,
                        i.channel_links AS channel_links,
                        'creator' AS source
                    FROM agency_campaign_application_from_creator bcac
                    JOIN agency_campaigns c ON bcac.campaign_id = c.id
                    JOIN creators_auth i ON bcac.influencer_id = i.id

                          
                ORDER BY c.created_at DESC;
            `,
            [agencyId]
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

const validateCampaignHeader = (req, res, next) => {
    const campaignId = req.headers['x-campaign-id'];
    if (!campaignId) {
        return res.status(401).json({ error: 'Campaign ID is required in header (x-campaign-id)' });
    }
    req.campaignId = campaignId;
    next();
};




module.exports = router;
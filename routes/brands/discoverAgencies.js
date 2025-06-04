const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/discoverAgencies', authMiddleware, async (req, res) => {
    try {
        const brandId = req.user.id;
        let query = `
        SELECT 
            ma.agency_name,
            ma.email,
            ma.phone_number,
            ma.website_url AS website,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object(
                        'package_type', ap.package_type,
                        'price', ap.price,
                        'features', ap.features,
                        'delivery_time_days', ap.delivery_time_days
                    )
                ) FILTER (WHERE ap.id IS NOT NULL AND (ap.target_brand IS NULL OR ap.target_brand = $1)), '[]'
            ) as packages,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object(
                        'campaign_name', pp.campaign_name,
                        'client_name', pp.client_name,
                        'description', pp.description,
                        'results', pp.results
                    )
                ) FILTER (WHERE pp.agency_id IS NOT NULL), '[]'
            ) as portfolio_projects
        FROM media_agencies ma
        LEFT JOIN agency_packages ap ON ma.id = ap.agency_id
        LEFT JOIN portfolio_projects pp ON ma.id = pp.agency_id
        GROUP BY ma.id, ma.agency_name, ma.email, ma.phone_number, ma.website_url`;

        const result = await db.query(query, [brandId]);
        res.json({ success: true, data: result });

    } catch (error) {
        console.error("Error retrieving agencies", error);
        res.status(500).json({
            error: 'Internal Server Error',
            details: error.message
        });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

function toPostgresArray(arr) {
    if (!arr) return null;

    // If it's a string, wrap it in an array
    if (typeof arr === 'string') {
        arr = [arr];
    }

    // Ensure it's an array
    if (!Array.isArray(arr) || arr.length === 0) {1
        return null;
    }

    // Escape single quotes and wrap each element in single quotes
    const escapedArr = arr.map(item =>
        item ? `"${item.replace(/"/g, '\\"')}"` : null
    ).filter(item => item !== null);

    return escapedArr.length > 0 ? `{${escapedArr.join(',')}}` : null;
}

router.post('/uploadBrandsInformation', authMiddleware, async function (req, res) {
    try {
        const {
            productCategory,
            targetAudienceAge,
            marketFitCapture,
            turnover,
            brandsDescription,
            brandsWebsite,
            brandsSocialMedia,
        } = req.body;
        // Add your registration logic here
        const requiredFields = [
            'productCategory',
            'targetAudienceAge',
            'marketFitCapture',
            'turnover',
            'brandsDescription',
            'brandsWebsite',
            'brandsSocialMedia',
        ];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    error: `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`
                });
            }
        }

        console.log("Req.User object", req.user);

        const brandsId = req.user.id;
        if (!brandsId) {
            return res.status(401).json({
                error: 'Authentication failed: No user ID found'
            });
        }


        const query = `
    INSERT INTO brands_information (brand_id, product_categories, target_audience_age, market_fit_capture, turnover, brands_description, brands_website, brands_social_media)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (brand_id) 
    DO UPDATE SET 
        product_categories = EXCLUDED.product_categories,
        target_audience_age = EXCLUDED.target_audience_age,
        market_fit_capture = EXCLUDED.market_fit_capture,
        turnover = EXCLUDED.turnover,
        brands_description = EXCLUDED.brands_description,
        brands_website = EXCLUDED.brands_website,
        brands_social_media = EXCLUDED.brands_social_media
    RETURNING brand_id, product_categories, target_audience_age, market_fit_capture, turnover, brands_description, brands_website, brands_social_media;
`;
        const values = [
            brandsId,
            productCategory,
            targetAudienceAge,
            marketFitCapture,
            turnover,
            brandsDescription,
            brandsWebsite,
            toPostgresArray(brandsSocialMedia)];
        const { rows } = await db.query(query, values);
        console.log(rows);
        res.status(201).json({
            "message": "Brand information uploaded successfully",
        });

    } catch (error) {
        console.error('Failed to register brand:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/getBrandsInformation', authMiddleware, async function (req, res) {
    try {
        const brandsId = req.user.id;
        console.log(brandsId)
        if (!brandsId) {
            return res.status(401).json({
                error: 'Authentication failed: No user ID found'
            });
        }
        const query = `
            SELECT * FROM brands_information WHERE brand_id = $1
        `;
        const values = [brandsId];
        const result = await db.query(query, values);
        console.log(result[0])
        res.status(200).json(result[0]);

    } catch (error) {
        console.error('Failed to get brand information:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
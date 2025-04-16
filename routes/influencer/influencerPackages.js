const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/influencerPackages', authMiddleware, async (req, res) => {  
    try {
        const influencerId = req.user.id;

        const packages = await db.any(`
            SELECT 
                p.id,
                p.package_type,
                p.price,
                p.features,
                p.delivery_time_days
            FROM 
                influencer_packages p
            WHERE 
                p.creator_id = $1
        `, [influencerId]);

        res.status(200).json({
            message: 'Packages retrieved successfully',
            data: packages
        });
    } catch (error) {
        console.error('Error retrieving packages:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
  });

module.exports = router;
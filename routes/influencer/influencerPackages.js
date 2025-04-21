const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/influencerPackages', authMiddleware, async (req, res) => {  
    try {
        const influencerId = req.user.id;
        const { brand_id } = req.query; // Get brand_id from query parameters

        const packages = await db.any(`
            SELECT 
                p.id,
                p.package_type,
                p.price,
                p.features,
                p.delivery_time_days,
                p.target_brand
            FROM 
                influencer_packages p
            WHERE 
                p.creator_id = $1
                AND (
                    p.target_brand IS NULL 
                    OR p.target_brand = $2
                )
        `, [influencerId, brand_id || null]);

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

router.get('/brandPackages/:influencerId', authMiddleware, async (req, res) => {
    try {
        const { influencerId } = req.params;
        const brandId = req.user.brand_id; // Assuming brand_id is stored in the auth token

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
                AND (
                    p.target_brand IS NULL 
                    OR p.target_brand = $2
                )
        `, [influencerId, brandId]);

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

router.post('/createPackage', authMiddleware, async (req, res) => {
    try {
        const influencerId = req.user.id;
        const { package_type, price, features, delivery_time_days, target_brand } = req.body;

        // Validate required fields
        if (!package_type || !price || !features || !delivery_time_days) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        const newPackage = await db.one(`
            INSERT INTO influencer_packages 
                (creator_id, package_type, price, features, delivery_time_days, target_brand)
            VALUES 
                ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [influencerId, package_type, price, features, delivery_time_days, target_brand || null]);

        res.status(201).json({
            message: 'Package created successfully',
            data: newPackage
        });
    } catch (error) {
        console.error('Error creating package:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

router.put('/updatePackage/:packageId', authMiddleware, async (req, res) => {
    try {
        const influencerId = req.user.id;
        const { packageId } = req.params;
        const { price, features, delivery_time_days } = req.body;

        const existingPackage = await db.oneOrNone(`
            SELECT id FROM influencer_packages 
            WHERE id = $1 AND creator_id = $2
        `, [packageId, influencerId]);

        if (!existingPackage) {
            return res.status(404).json({
                error: 'Package not found or unauthorized'
            });
        }

        // Ensure features is properly formatted as an array
        let featuresArray = null;
        if (features) {
            if (Array.isArray(features)) {
                featuresArray = features;
            } else if (typeof features === 'string') {
                featuresArray = features.split(',').map(f => f.trim());
            }
        }

        const updatedPackage = await db.one(`
            UPDATE influencer_packages 
            SET 
                price = COALESCE($1::numeric, price),
                features = $2,
                delivery_time_days = COALESCE($3::integer, delivery_time_days),
                created_at = CURRENT_TIMESTAMP
            WHERE id = $4 AND creator_id = $5
            RETURNING *
        `, [price, featuresArray, delivery_time_days, packageId, influencerId]);

        res.status(200).json({
            message: 'Package updated successfully',
            data: updatedPackage
        });
    } catch (error) {
        console.error('Error updating package:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
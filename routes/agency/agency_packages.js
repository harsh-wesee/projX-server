const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/agencyPackages', authMiddleware, async (req, res) => {
    try{
        const agencyId = req.user.id;
        const brand_id = req.query;
        const packages = await db.any(`
            SELECT 
                p.id,
                p.package_type,
                p.price,
                p.features,
                p.delivery_time_days,
                p.target_brand
            FROM 
                agency_packages p
            WHERE 
                p.agency_id = $1
        `, [agencyId, brand_id || null]);

        res.status(200).json({
            message: 'Packages retrieved successfully',
            data: packages
        });
    } catch (e){
        console.error("Error retrieving agency packages", error);
        res.status(500).json({
            error : 'Internal Server Error', 
            details : error.message
        })
    }
    
})


router.get('/agencyPackages/:agencyId', authMiddleware, async (req, res) => {
    try {
        const { agencyId } = req.params;
        const brandId = req.user.brand_id; // Assuming agency is stored in the auth token

        const packages = await db.any(`
            SELECT 
                p.id,
                p.package_type,
                p.price,
                p.features,
                p.delivery_time_days
            FROM 
                agency_packages p
            WHERE 
                p.agency_id = $1
                AND (
                    p.target_brand IS NULL 
                    OR p.target_brand = $2
                )
        `, [agencyId, brandId]);

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
        const agencyId = req.user.id;
        const { package_type, price, features, delivery_time_days, target_brand } = req.body;

        // Validate required fields
        if (!package_type || !price || !features || !delivery_time_days) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        const newPackage = await db.one(`
            INSERT INTO agency_packages 
                (agency_id, package_type, price, features, delivery_time_days, target_brand)
            VALUES 
                ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [agencyId, package_type, price, features, delivery_time_days, target_brand || null]);

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
        const agencyId = req.user.id;
        const { packageId } = req.params;
        const { price, features, delivery_time_days } = req.body;

        const existingPackage = await db.oneOrNone(`
            SELECT id FROM agency_packages 
            WHERE id = $1 AND agency_id = $2
        `, [packageId, agencyId]);

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
            UPDATE agency_packages 
            SET 
                price = COALESCE($1::numeric, price),
                features = $2,
                delivery_time_days = COALESCE($3::integer, delivery_time_days),
                created_at = CURRENT_TIMESTAMP
            WHERE id = $4 AND agency_id = $5
            RETURNING *
        `, [price, featuresArray, delivery_time_days, packageId, agencyId]);

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

module.exports = router
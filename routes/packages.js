const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../config/database');
const { body, validationResult } = require('express-validator');

// Brand endpoints
router.post('/order', 
    authMiddleware,
    [
        body('packageId').isUUID().withMessage('Valid packageId is required'),
        body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    ],
    async (req, res) => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const userId = req.user.id;
            const { agencyId, influencerId, status = 'pending', packageId } = req.body;

            // Validate that either agencyId or influencerId is provided, but not both
            if ((!agencyId && !influencerId) || (agencyId && influencerId)) {
                return res.status(400).json({ 
                    error: 'Either agencyId or influencerId must be provided, but not both' 
                });
            }

            // Start a transaction
            await db.query('BEGIN');

            try {
                // Check if package exists in either influencer_packages or agency_packages
                let package, packageType;
                
                // First check influencer_packages
                package = await db.oneOrNone(
                    'SELECT *, $1 as package_type FROM influencer_packages WHERE creator_id = $1',
                    [packageId, 'influencer']
                );
                
                // If not found in influencer_packages, check agency_packages
                if (!package) {
                    package = await db.oneOrNone(
                        'SELECT *, $1 as package_type FROM agency_packages WHERE agency_id = $1',
                        [agencyId, 'agency']
                    );
                }

                if (!package) {
                    await db.query('ROLLBACK');
                    return res.status(404).json({ error: 'Package not found in either influencer or agency packages' });
                }
                
                packageType = package.package_type; // 'influencer' or 'agency'

                let order;
                let userType = '';

                // Check if user is a brand
                const brand = await db.oneOrNone(
                    'SELECT brands_id FROM brands_auth WHERE brands_id = $1',
                    [userId]
                );

                // Check if user is an agency
                const agency = await db.oneOrNone(
                    'SELECT id FROM media_agencies WHERE id = $1',
                    [userId]
                );

                if (brand) {
                    userType = 'brand';
                    // Brand ordering from agency
                    if (agencyId) {
                        // Verify agency exists
                        const validAgency = await db.oneOrNone(
                            'SELECT id FROM media_agencies WHERE id = $1',
                            [agencyId]
                        );
                        if (!validAgency) {
                            await db.query('ROLLBACK');
                            return res.status(404).json({ error: 'Agency not found' });
                        }

                        order = await db.one(
                            `INSERT INTO orders 
                            (brand_id_orderer,  agency_id, package_id, status) 
                            VALUES ($1, $2, $3, $4) 
                            RETURNING id, brand_id_orderer, agency_id, package_id, status, created_at`,
                            [userId, agencyId, packageId, status]
                        );
                    } 
                    // Brand ordering from influencer
                    else if (influencerId) {
                        // Verify influencer exists
                        const validInfluencer = await db.oneOrNone(
                            'SELECT id FROM creators_auth WHERE id = $1',
                            [influencerId]
                        );
                        if (!validInfluencer) {
                            await db.query('ROLLBACK');
                            return res.status(404).json({ error: 'Influencer not found' });
                        }

                        order = await db.one(
                            `INSERT INTO orders 
                            (brand_id_orderer, influencer_id, package_id, status) 
                            VALUES ($1, $2, $3, $4) 
                            RETURNING id, brand_id_orderer, influencer_id, package_id, status, created_at`,
                            [userId, influencerId, packageId, status]
                        );
                    }
                } 
                else if (agency) {
                    userType = 'agency';
                    // Agency can only order from influencers
                    if (!influencerId) {
                        await db.query('ROLLBACK');
                        return res.status(400).json({ 
                            error: 'Agencies can only order from influencers' 
                        });
                    }

                    // Verify influencer exists
                    const validInfluencer = await db.oneOrNone(
                        'SELECT id FROM creators_auth WHERE id = $1',
                        [influencerId]
                    );
                    if (!validInfluencer) {
                        await db.query('ROLLBACK');
                        return res.status(404).json({ error: 'Influencer not found' });
                    }

                    order = await db.one(
                        `INSERT INTO orders 
                        (agency_id_orderer, influencer_id, package_id, status) 
                        VALUES ($1, $2, $3, $4) 
                        RETURNING id, agency_id_orderer, influencer_id, package_id, status, created_at`,
                        [userId, influencerId, packageId, status]
                    );
                } 
                else {
                    await db.query('ROLLBACK');
                    return res.status(403).json({ 
                        error: 'Only brands and agencies can place orders' 
                    });
                }

                await db.query('COMMIT');
                
                return res.status(201).json({
                    message: 'Order placed successfully',
                    order,
                    userType
                });

            } catch (dbError) {
                await db.query('ROLLBACK');
                console.error('Database error:', dbError);
                return res.status(500).json({ 
                    error: 'Error processing order',
                    details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
                });
            }

        } catch (error) {
            console.error('Order processing error:', error);
            return res.status(500).json({ 
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

// Get orders for the authenticated user
router.get('/dashboard/orders', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Check user type and fetch orders accordingly
        const [brandOrders, agencyOrders, influencerOrders] = await Promise.all([
            // Orders where user is the brand
            db.any(
                `SELECT o.* FROM orders o 
                WHERE o.brand_id_orderer = $1`,
                [userId]
            ),
            // Orders where user is the agency
            db.any(
                `SELECT o.* FROM orders o 
                WHERE o.agency_id_orderer = $1`,
                [userId]
            ),
            // Orders where user is the influencer
            db.any(
                `SELECT o.* FROM orders o 
                WHERE o.influencer_id = $1`,
                [userId]
            )
        ]);

        return res.json({
            brandOrders,
            agencyOrders,
            influencerOrders
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({ 
            error: 'Error fetching orders',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;

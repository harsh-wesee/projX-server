// campaigns.route.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const pool = require('../../config/database');
const { check, query } = require('express-validator');  // Changed from validate to check/query


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

// Search campaigns endpoint
router.get('/campaignSearch', authMiddleware, searchValidation, async (req, res) => {
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
            WITH combined_campaigns AS (
        SELECT 
            c.id,
            c.name,
            c.description,
            c.start_date,
            c.end_date,
            c.budget,
            c.target_audience,
            ba.brands_name as creator_name,
            ca.application_status as application_status,
            'brand' as campaign_type
        FROM brand_campaigns c
        JOIN brands_auth ba ON c.brand_id = ba.brands_id
        LEFT JOIN brand_campaign_application_from_creator ca ON c.id = ca.campaign_id 
            AND ca.influencer_id = $1::uuid 
        WHERE c.status = 'ACTIVE'

        UNION ALL

        SELECT 
            ac.id,
            ac.name,
            ac.description,
            ac.start_date,
            ac.end_date,
            ac.budget,
            ac.target_audience,
            aa.agency_name as creator_name,
            aca.application_status as application_status,
            'agency' as campaign_type
        FROM agency_campaigns ac
        JOIN media_agencies aa ON ac.agency_id = aa.id
        LEFT JOIN agency_campaign_application_from_creator aca ON ac.id = aca.campaign_id 
            AND aca.influencer_id = $1::uuid 
        WHERE ac.status = 'ACTIVE'
    )
    SELECT * FROM combined_campaigns WHERE 1=1
`;

        const params = [req.user.id]; // Add logged-in user's ID as first parameter
        // Start parameter count from 2

        // Add search conditions
        if (search) {
            query += `
                AND (
                    LOWER(name) LIKE $${paramCount}
                    OR LOWER(description) LIKE $${paramCount}
                    OR LOWER(target_audience) LIKE $${paramCount}
                )
            `;
            params.push(`%${search.toLowerCase()}%`); // Add wildcards before and after the search term
            paramCount++;
        }
        // Add date range conditions
        if (startDate) {
            query += ` AND start_date >= $${paramCount}`;
            params.push(startDate);
            paramCount++;
        }

        if (endDate) {
            query += ` AND end_date <= $${paramCount}`;
            params.push(endDate);
            paramCount++;
        }

        // Add budget range conditions
        if (minBudget) {
            query += ` AND budget >= $${paramCount}`;
            params.push(minBudget);
            paramCount++;
        }

        if (maxBudget) {
            query += ` AND budget <= $${paramCount}`;
            params.push(maxBudget);
            paramCount++;
        }

        // Add sorting and pagination
        query += `
            ORDER BY start_date DESC
            LIMIT $${paramCount}
            OFFSET $${paramCount + 1}
        `;

        params.push(limit, (page - 1) * limit);

        // Get total count for pagination
        const countQuery = `
    SELECT (
        SELECT COUNT(*) FROM brand_campaigns WHERE status = 'ACTIVE'
    ) + (
        SELECT COUNT(*) FROM agency_campaigns WHERE status = 'ACTIVE'
    ) as count
`;

        // Execute queries in parallel
        const [results, countResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery)
        ]);

        const totalCount = parseInt(countResult.count);
        const totalPages = Math.ceil(totalCount / limit);
        console.log(params);

        res.json({
            status: 'success',
            data: results,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems: totalCount,
                itemsPerPage: parseInt(limit)
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

// Get campaign by ID endpoint
router.get('searchByCId/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
           SELECT 
                c.*,
                ba.brands_name as brand_name
            FROM campaigns c
            JOIN brands_auth ba ON c.brand_id = ba.brands_id
            WHERE c.id = $1 AND c.status = 'ACTIVE'
        `;

        const result = await pool.query(query, [id]);

        if (result.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Campaign not found'
            });
        }

        res.json({
            status: 'success',
            data: result[0]
        });

    } catch (error) {
        console.error('Get campaign error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching the campaign'
        });
    }
});

module.exports = router;
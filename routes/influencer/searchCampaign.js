// campaigns.route.js
const express = require('express');
const router = express.Router();
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
router.get('/campaignSearch', searchValidation, async (req, res) => {   
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

        // Build the base query with active status filter
        let query = `
            SELECT 
                c.id,
                c.name,
                c.description,
                c.start_date,
                c.end_date,
                c.budget,
                c.target_audience,
                ba.brands_name as brand_name
            FROM campaigns c
            JOIN brands_auth ba ON c.brand_id = ba.id
            WHERE c.status = 'ACTIVE'
        `;

        const params = [];
        let paramCount = 1;

        // Add search conditions
        if (search) {
            query += `
                AND (
                    c.name ILIKE $${paramCount} 
                    OR c.description ILIKE $${paramCount}
                    OR c.target_audience ILIKE $${paramCount}
                )
            `;
            params.push(`%${search}%`);
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
            FROM campaigns c
            WHERE c.status = 'ACTIVE'
        `;

        // Execute queries in parallel
        const [results, countResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery)
        ]);

        const totalCount = parseInt(countResult[0].count);
        const totalPages = Math.ceil(totalCount / limit);

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

// Get campaign by ID endpoint
router.get('searchByCId/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
           SELECT 
                c.*,
                ba.brands_name as brand_name  -- Changed from b.name to ba.brands_name
            FROM campaigns c
            JOIN brands_auth ba ON c.brand_id = ba.id  -- Changed from brands_information to brands_auth
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
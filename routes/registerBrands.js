const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
    if (!Array.isArray(arr) || arr.length === 0) {
        return null;
    }

    // Escape single quotes and wrap each element in single quotes
    const escapedArr = arr.map(item => 
        item ? `"${item.replace(/"/g, '\\"')}"` : null
    ).filter(item => item !== null);
    
    return escapedArr.length > 0 ? `{${escapedArr.join(',')}}` : null;
}

router.post('/registerBrands', authMiddleware, async function (req, res) {
    try {
        const {
            brandsName,
            email,
            country,
        } = req.body;
        // Add your registration logic here
        const requiredFields = [
            'brandsName',
            'email',
            'country',
        ];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    error: `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`
                });
            }
        }
        const existingBrand = await db.oneOrNone('SELECT * FROM brands WHERE email = $1 OR brands_name = $2', [email, brandsName]);


        const query = `
            INSERT INTO brands (brands_name, email, country)
            VALUES ($1, $2, $3)
            RETURNING id, brands_name, email, country
        `;
        const values = [brandsName, email, country];
        const { rows } = await db.query(query, values);
        res.status(201).json(rows[0]);

    } catch (error) {
        console.error('Failed to register brand:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/uploadBrandsInformation', async function (req, res) {
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
            'country',
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
        const existingBrand = await db.oneOrNone('SELECT * FROM brands WHERE email = $1 OR brands_name = $2', [email, brandsName]);

        const query = `
            INSERT INTO brands (product_category, target_audience_age, market_fit_capture, turnover, brands_description, brands_website, brands_social_media)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, product_category, target_audience_age, market_fit_capture, turnover, brands_description, brands_website, brands_social_media
        `;
        const values = [productCategory,
            targetAudienceAge,
            marketFitCapture,
            turnover,
            brandsDescription,
            brandsWebsite,
            toPostgresArray(brandsSocialMedia)];
        const { rows } = await db.query(query, values);
        res.status(201).json(rows[0]);

    } catch (error) {
        console.error('Failed to register brand:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
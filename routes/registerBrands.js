const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');



router.post('/registerBrands', async function (req, res) {
    try {
        const {
            brandsName,
            email,
            country,
            password
        } = req.body;

        // Validate required fields
        const requiredFields = ['brandsName', 'email', 'country', 'password'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    error: `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`
                });
            }
        }

        // Check if brand already exists
        const existingBrand = await db.oneOrNone(
            'SELECT * FROM brands_auth WHERE email = $1 OR brands_name = $2',
            [email, brandsName]
        );

        if (existingBrand) {
            return res.status(400).json({ error: 'Brand already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert brand into database
        const newBrand = await db.one(
            `INSERT INTO brands_auth (
                brands_name,
                email,
                country,
                password
            ) VALUES (
                $1, $2, $3, $4
            ) RETURNING id, brands_name, email, country`,
            [brandsName, email, country, hashedPassword]
        );

        // Generate JWT
        const token = jwt.sign(
            { id: newBrand.id, email: newBrand.email },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '10h' }
        );

        res.status(201).json({
            message: 'Brand registered successfully',
            token,
            brand: {
                id: newBrand.id,
                brandsName: newBrand.brands_name,
                email: newBrand.email,
                country: newBrand.country
            }
        });
    } catch (error) {
        console.error('Failed to register brand:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

module.exports = router;



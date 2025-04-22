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
            ) RETURNING brands_id, brands_name, email, country`,
            [brandsName, email, country, hashedPassword]
        );

        // Generate JWT
        const token = jwt.sign(
            { id: newBrand.brands_id, email: newBrand.email },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '10h' }
        );

        res.status(201).json({
            message: 'Brand registered successfully',
            token,
            brand: {
                id: newBrand.brands_id,
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

router.post('/loginBrand', async function (req, res) {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        // Check if brand exists
        const existingBrand = await db.oneOrNone(
            'SELECT * FROM brands_auth WHERE email = $1',
            [email]
        );

        if (!existingBrand) {
            return res.status(404).json({ error: 'Brand not found' });
        } else {
            console.log(existingBrand
            );
        }
        // console.log(bcrypt.d)

        // Check if password is correct
        const isPasswordValid = await bcrypt.compare(password, existingBrand.password);


        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: existingBrand.brands_id, email: existingBrand.email },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '10h' }
        );

        res.json({
            message: 'Login successful',
            token,
            brand: {
                id: existingBrand.brands_id,
                brandsName: existingBrand.brands_name,
                email: existingBrand.email,
                country: existingBrand.country
            }
        });
    } catch (error) {
        console.error('Failed to login brand:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

module.exports = router;



const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

// Helper function to convert array to PostgreSQL array string
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

router.post('/register', async (req, res) => {
    try {
        // Destructure all fields from the request body
        const {
            fullName,
            email,
            password,
            primaryPlatforms,
            channelLink,
            age,
            gender,
            country,
            city,
            contentLanguages,
            channelGenre,
            contentDescription
        } = req.body;

        // Validate required fields
        const requiredFields = [
            'fullName', 'email', 'password',
            'primaryPlatforms', 'channelLink',
            'age', 'gender', 'country'
        ];

        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    error: `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`
                });
            }
        }

        // Check if user already exists
        const existingUser = await db.oneOrNone(
            'SELECT * FROM creators_auth WHERE email = $1',
            [email]
        );

        if (existingUser) {
            return res.status(400).json({ error: 'Creator already exists' });
        }

          // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert creator into database
        const newCreator = await db.one(
            `INSERT INTO creators_auth (
          full_name,
          email, 
          password,
          primaryplatform, 
          channel_links, 
          age, 
          gender, 
          country, 
          city, 
          content_lang, 
          channel_genre, 
          content_desc
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        ) RETURNING id, full_name, email`,
            [
                fullName,
                email,
                hashedPassword,
                toPostgresArray(primaryPlatforms),
                toPostgresArray(channelLink), // Convert channelLink to a PostgreSQL array
                age,
                gender,
                country,
                city || null,
                toPostgresArray(contentLanguages),
                channelGenre || null,
                contentDescription || null
            ]
        );

        // Generate JWT
        const token = jwt.sign(
            { id: newCreator.id, email: newCreator.email },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: 'Creator registered successfully',
            token,
            creator: {
                id: newCreator.id,
                fullName: newCreator.full_name,
                email: newCreator.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Server error during registration',
            details: error.message 
        });
    }
});

// Creator Login (modified to work with new schema)
router.post('/login', async (req, res) => {
    try {
        const { email , password } = req.body;

        // Find creator by email
        const creator = await db.oneOrNone(
            'SELECT * FROM creators_auth WHERE email = $1',
            [email]
        );

        if (!creator) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, creator.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: creator.id, email: creator.email },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1h' }
        );

        res.json({
            token,
            creator: {
                id: creator.id,
                fullName: creator.full_name,
                email: creator.email,
                primaryPlatforms: creator.primaryplatform,
                channelLink: creator.channel_links
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Get Creator Profile (Protected Route)
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const creator = await db.oneOrNone(
            `SELECT 
          id, 
          full_name, 
          email, 
          password,
          primaryplatform, 
          channel_links, 
          age, 
          gender, 
          country, 
          city, 
          content_lang, 
          channel_genre, 
          content_desc
        FROM creators_auth 
        WHERE id = $1`,
            [req.user.id]
        );

        if (!creator) {
            return res.status(404).json({ error: 'Creator not found' });
        }

        res.json(creator);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
});

module.exports = router;
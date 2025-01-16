const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/registerAgency', async (req, res) => {
    try{
        const {              
            agencyName,
            email,
            password    
        }  = req.body;
        const requiredFields = ['agencyName', 'email', 'password'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    error: `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`
                });
            }
        }

        const existingAgency = await db.oneOrNone(
            'SELECT * FROM media_agencies WHERE email = $1 OR agency_name = $2',
            [email, agencyName]
        );
        
        if (existingAgency) {
            return res.status(400).json({ error: 'Agency already exists, Sign up using the email and password or create a different account' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAgency = await db.one(
            `INSERT INTO media_agencies (
                agency_name,
                email,
                password
            ) VALUES (
                $1, $2, $3
            ) RETURNING id, agency_name, email`,
            [agencyName, email, hashedPassword]
        );

        const token = jwt.sign(
            { id: newAgency.id, email: newAgency.email },
            process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '10h' });
        
        res.status(201).json({ 
            message : 'Agency Registered', token, agencyDetails: {id: newAgency.id, email: newAgency.email, agencyName: newAgency.agencyName} 
        
        });

    } catch (error) { 
        console.error('Failed to register agency:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
});


router.post('/loginAgency', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const agency = await db.oneOrNone(
            'SELECT * FROM media_agencies WHERE email = $1',
            [email]
        );

        if (!agency) {
            return res.status(404).json({ error: 'Agency not found' });
        }

        const passwordMatch = await bcrypt.compare(password, agency.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const token = jwt.sign(
            { id: agency.id, email: agency.email },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '10h' }
        );

        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Failed to login agency:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
module.exports = router;

/*
Agency Table Schema : 
Table Name : media_agencies,
fields : id, agency_name, email, password, created_at, updated_id


*/
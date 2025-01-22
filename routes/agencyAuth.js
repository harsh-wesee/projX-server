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

router.post('/updateAgency/:id', authMiddleware, async (req, res) => {
    try {
        const agencyId = parseInt(req.params.id, 10);
        const { agencyName, phoneNumber, websiteUrl, establishedYear, employeeCountRange, logoUrl, bannerUrl, campaignBudgetMin, campaignBudgetMax } = req.body;

        // Ensure the JWT user is the same as the agency trying to update the record
        if (req.user.agencyId !== agencyId) {
            return res.status(403).json({ error: 'You do not have permission to update this agency.' });
        }

        const result = await db.none(
            `UPDATE media_agencies
             SET 
                 agency_name = COALESCE($1, agency_name),
                 phone_number = COALESCE($2, phone_number),
                 website_url = COALESCE($3, website_url),
                 established_year = COALESCE($4, established_year),
                 employee_count_range = COALESCE($5, employee_count_range),
                 logo_url = COALESCE($6, logo_url),
                 banner_url = COALESCE($7, banner_url),
                 campaign_budget_min = COALESCE($8, campaign_budget_min),
                 campaign_budget_max = COALESCE($9, campaign_budget_max),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $10`,
            [
                agencyName,
                phoneNumber,
                websiteUrl,
                establishedYear,
                employeeCountRange,
                logoUrl,
                bannerUrl,
                campaignBudgetMin,
                campaignBudgetMax,
                agencyId
            ]
        );

        res.status(200).json({ message: 'Agency details updated successfully.' });
    } catch (error) {
        console.error('Failed to update agency:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/updateTeamMember/:id', authMiddleware, async (req, res) => {
    try {
        const memberId = parseInt(req.params.id, 10);
        const { name, email, role } = req.body;

        const result = await db.none(
            `UPDATE team_members
             SET 
                 name = COALESCE($1, name),
                 email = COALESCE($2, email),
                 role = COALESCE($3, role)
             WHERE id = $4`,
            [name, email, role, memberId]
        );

        res.status(200).json({ message: 'Team member updated successfully.' });
    } catch (error) {
        console.error('Failed to update team member:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/updateProject/:id', authMiddleware, async (req, res) => {
    try {
        const projectId = parseInt(req.params.id, 10);
        const { campaignName, clientName, description, results } = req.body;

        const result = await db.none(
            `UPDATE portfolio_projects
             SET 
                 campaign_name = COALESCE($1, campaign_name),
                 client_name = COALESCE($2, client_name),
                 description = COALESCE($3, description),
                 results = COALESCE($4, results)
             WHERE id = $5`,
            [campaignName, clientName, description, results, projectId]
        );

        res.status(200).json({ message: 'Project details updated successfully.' });
    } catch (error) {
        console.error('Failed to update project:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/updatePaymentInfo/:agencyId', authMiddleware, async (req, res) => {
    try {
        const agencyId = parseInt(req.params.agencyId, 10);
        const { accountHolderName, accountNumber, ifscCode, bankName, gstNumber, panNumber } = req.body;

        // Ensure the JWT user is the same as the agency trying to update the payment info
        if (req.user.agencyId !== agencyId) {
            return res.status(403).json({ error: 'You do not have permission to update this payment information.' });
        }

        const result = await db.none(
            `UPDATE agency_payment_info
             SET 
                 account_holder_name = COALESCE($1, account_holder_name),
                 account_number = COALESCE($2, account_number),
                 ifsc_code = COALESCE($3, ifsc_code),
                 bank_name = COALESCE($4, bank_name),
                 gst_number = COALESCE($5, gst_number),
                 pan_number = COALESCE($6, pan_number),
                 updated_at = CURRENT_TIMESTAMP
             WHERE agency_id = $7`,
            [
                accountHolderName,
                accountNumber,
                ifscCode,
                bankName,
                gstNumber,
                panNumber,
                agencyId
            ]
        );

        res.status(200).json({ message: 'Payment information updated successfully.' });
    } catch (error) {
        console.error('Failed to update payment information:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

/*
Agency Table Schema : 
Table Name : media_agencies,
fields : id, agency_name, email, password, created_at, updated_id


*/
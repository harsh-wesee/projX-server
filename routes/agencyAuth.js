const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/registerAgency', async (req, res) => {
    try {
        const {
            agencyName,
            email,
            password
        } = req.body;
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
            { id: newAgency.id },
            process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '10h' });

        res.status(201).json({
            message: 'Agency Registered', token, agencyDetails: { id: newAgency.id, email: newAgency.email, agencyName: newAgency.agencyName }

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

        console.log(req.user.id, agencyId);

        // Ensure the JWT user is the same as the agency trying to update the record
        if (req.user.id != agencyId) {
            return res.status(403).json({ error: 'You do not have permission to update this agency.' });
        }

        const result = await db.none(
            `UPDATE media_agencies
SET 
    agency_name = COALESCE($1::text, agency_name::text)::text,
    phone_number = COALESCE($2::text, phone_number::text)::text,
    website_url = COALESCE($3::text, website_url::text)::text,
    established_year = COALESCE($4, established_year),
    employee_count_range = COALESCE($5::text, employee_count_range::text)::text,
    logo_url = COALESCE($6::text, logo_url::text)::text,
    banner_url = COALESCE($7::text, banner_url::text)::text,
    campaign_budget_min = COALESCE($8, campaign_budget_min),
    campaign_budget_max = COALESCE($9, campaign_budget_max),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $10;
`,
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

router.post('/addTeamMember/:id', authMiddleware, async (req, res) => {
    try {
        const agencyId = parseInt(req.params.id, 10); // Agency ID as a parameter
        const { name, email, role } = req.body; // Data from request body

        // Check user authorization
        if (req.user.id !== agencyId) {
            return res.status(403).json({ error: 'You do not have permission to add a team member for this agency.' });
        }

        // Insert new team member
        await db.none(
            `INSERT INTO team_members (agency_id, name, email, role)
             VALUES ($1, COALESCE($2::text, 'Default Name'), COALESCE($3::text, 'Default Email'), COALESCE($4::text, 'Default Role'))`,
            [agencyId, name, email, role]
        );

        res.status(200).json({ message: 'Team member added successfully.' });
    } catch (error) {
        console.error('Failed to add team member:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});





router.post('/addProject/:agencyId', authMiddleware, async (req, res) => {
    try {
        const agencyId = parseInt(req.params.agencyId, 10);
        const { campaignName, clientName, description, results } = req.body;

        // Authorization check
        if (req.user.id !== agencyId) {
            return res.status(403).json({ error: 'You do not have permission to add a project for this agency.' });
        }

        // Insert new project
        await db.none(
            `INSERT INTO portfolio_projects (agency_id, campaign_name, client_name, description, results)
             VALUES ($1, COALESCE($2::text, 'Default Campaign'), COALESCE($3::text, 'Default Client'), COALESCE($4::text, 'Default Description'), COALESCE($5::text, 'Default Results'))`,
            [agencyId, campaignName, clientName, description, results]
        );

        res.status(200).json({ message: 'Project added successfully.' });
    } catch (error) {
        console.error('Failed to add project:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.post('/addPaymentInfo/:agencyId', authMiddleware, async (req, res) => {
    try {
        const agencyId = parseInt(req.params.agencyId, 10);
        const { accountHolderName, accountNumber, ifscCode, bankName, gstNumber, panNumber } = req.body;

        // Authorization check
        if (req.user.id !== agencyId) {
            return res.status(403).json({ error: 'You do not have permission to add payment information for this agency.' });
        }

        // Insert new payment information
        await db.none(
            `INSERT INTO agency_payment_info (agency_id, account_holder_name, account_number, ifsc_code, bank_name, gst_number, pan_number, updated_at)
             VALUES ($1, COALESCE($2::text, 'Default Holder Name'), COALESCE($3::text, 'Default Account Number'), COALESCE($4::text, 'Default IFSC Code'), COALESCE($5::text, 'Default Bank Name'), COALESCE($6::text, 'Default GST Number'), COALESCE($7::text, 'Default PAN Number'), CURRENT_TIMESTAMP)`,
            [agencyId, accountHolderName, accountNumber, ifscCode, bankName, gstNumber, panNumber]
        );

        res.status(200).json({ message: 'Payment information added successfully.' });
    } catch (error) {
        console.error('Failed to add payment information:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



module.exports = router;

/*
Agency Table Schema : 
Table Name : media_agencies,
fields : id, agency_name, email, password, created_at, updated_id


*/
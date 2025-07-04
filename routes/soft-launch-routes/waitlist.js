const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// POST /api/v1/waitlist/join
router.post('/join', async (req, res) => {
  try {
    const { userType, name, email } = req.body;

    // Validate required fields
    if (!userType || !name || !email) {
      return res.status(400).json({
        error: 'userType, name, and email are required.'
      });
    }

    // Optionally, validate userType value
    const allowedTypes = ['Brand', 'Creator', 'Agency'];
    if (!allowedTypes.includes(userType)) {
      return res.status(400).json({
        error: `userType must be one of: ${allowedTypes.join(', ')}`
      });
    }

    // Optionally, check for duplicate email in waitlist
    const existing = await db.oneOrNone(
      'SELECT id FROM waitlist WHERE email = $1',
      [email]
    );
    if (existing) {
      return res.status(409).json({
        error: 'This email is already on the waitlist.'
      });
    }

    // Insert into waitlist
    const result = await db.one(
      `INSERT INTO waitlist (user_type, name, email) VALUES ($1, $2, $3)
       RETURNING id, user_type, name, email, joined_at`,
      [userType, name, email]
    );

    res.status(201).json({
      message: 'Successfully joined the waitlist!',
      waitlistEntry: result
    });
  } catch (error) {
    console.error('Waitlist join error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

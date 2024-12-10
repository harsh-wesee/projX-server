const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/uploadChannelDetails', authMiddleware, async function (req, res) {
    try {
        const {
            channel_age,
            subscibers_count,
            avg_views,
            content_type,
            posts_freq,
            live_streaming,
            collab_type,
            ig_account_name,
            ig_account_age,
            ig_followers_count,
            avg_ig_reel_views,
            avg_ig_comment_count,
            avg_ig_likes_count,
            eng_rate,
        } = req.body;

        const requiredFields = [
            'channel_age', 'subscibers_count', 'avg_views',
            'content_type', 'posts_freq',
            'live_streaming', 'collab_type'
        ];

        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    error: `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`
                });
            }
        }

        // Ensure creator_id is taken from the JWT token, not the request body
        const creator_id = req.user.id;
        if (!creator_id) {
            return res.status(401).json({
                error: 'Authentication failed: No user ID found'
            });
        }

        const query = `
         INSERT INTO creators_channel_data (
             id,
             channel_age_youtube, 
             subscribers_count_youtube, 
             avg_views_youtube, 
             content_type_youtube, 
             posts_freq_youtube, 
             live_streaming_youtube, 
             collab_type,
             ig_account_name,
             ig_account_age,
             ig_followers_count,
             avg_ig_reel_views,
             avg_ig_comment_count,
             avg_ig_likes_count,
             eng_rate_ig
         ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9. $10, $11, $12, $13, $14, $15
         )`;

        const values = [
            creator_id,
            channel_age,
            subscibers_count || 0,
            avg_views,
            content_type,
            posts_freq,
            live_streaming || false,
            collab_type,
            ig_account_name,
            ig_account_age,
            ig_followers_count,
            avg_ig_reel_views,
            avg_ig_comment_count,
            avg_ig_likes_count,
            eng_rate,

        ];

        const result = await db.query(query, values);

        res.status(200).json({
            message: 'Channel details uploaded successfully',
        });

    } catch (error) {
        console.error('Registration Error', error);
        res.status(500).json({
            error: 'Server Error during Submitting Channel Details',
            details: error.message
        })
    }
})

module.exports = router;
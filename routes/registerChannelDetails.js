const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/uploadChannelDetails', authMiddleware, async function (req, res) {
    try {
        const {
            channelAge,
            subscribers,
            averageViews,
            contentType,
            postingFrequency,
            liveStreaming,
            collabType,
            accountName,
            accountAge,
            followers,
            avgReelViews,
            avgComments,
            avgLikes,
            engagementRate,
        } = req.body;
        
        const requiredFields = [
            'channelAge',
            'subscribers',
            'averageViews',
            'contentType',
            'postingFrequency',
            'liveStreaming',
            'collabType',
            'accountName',
            'accountAge',
            'followers',
            'avgReelViews',
            'avgComments',
            'avgLikes',
            'engagementRate',
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
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`;

        const values = [
            creator_id,
            channelAge,
            subscribers || 0,
            averageViews,
            contentType,
            postingFrequency,
            liveStreaming,
            collabType,
            accountName,
            accountAge,
            followers,
            avgReelViews,
            avgComments,
            avgLikes,
            engagementRate,
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




router.get('/getChannelDetails', authMiddleware, async function (req, res) {
    try {
        // Get the creator_id from the JWT token
        const creator_id = req.user.id;
        if (!creator_id) {
            return res.status(401).json({
                error: 'Authentication failed: No user ID found'
            });
        }
        // Query to fetch channel details for the specific user
        const query = `
            SELECT 
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
            FROM creators_channel_data
            WHERE id = $1`;

        // Execute the query
        let result;
        try {
            result = await db.query(query, [creator_id]);
        } catch (dbError) {
            console.error('Database Query Error:', dbError);
            return res.status(500).json({
                error: 'Database Query Error',
                details: dbError.message,
            });
        }

        // Handle undefined result
        if (!result) {
            return res.status(500).json({
                error: 'Unexpected query result: result.rows is undefined'
            });
        }

        // Check if channel details exist
        if (result.length === 0) {
            return res.status(404).json({
                error: 'No channel details found for this user'
            });
        }

        // Return the channel details
        return res.status(200).json({
            channelDetails: result[0]
        });

    } catch (error) {
        console.error('Fetch Channel Details Error', error);
        res.status(500).json({
            error: 'Server Error while fetching Channel Details',
            details: error.message
        });
    }
});


module.exports = router;
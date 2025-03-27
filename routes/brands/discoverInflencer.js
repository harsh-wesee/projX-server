const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/enlistInfluencers', async (req, res) => {
  try {
    const { platform, niches, minFollowers, maxFollowers, minEngagement, maxEngagement } = req.query;
    let query = `
      SELECT 
          ca.id,
          ca.full_name,
          ca.email,
          ca.primaryplatform,
          ca.age,
          ca.gender,
          ca.country,
          ca.state,
          ca.city,
          ca.content_lang,
          ca.niches,
          ca.content_desc,
          ca.channel_links,
          ccd.channel_age_youtube,
          ccd.avg_views_youtube,
          ccd.subscribers_count_youtube,
          ccd.content_type_youtube,
          ccd.posts_freq_youtube,
          ccd.live_streaming_youtube,
          ccd.collab_type,
          ccd.ig_account_name,
          ccd.ig_account_age,
          ccd.ig_followers_count,
          ccd.avg_ig_reel_views,
          ccd.avg_ig_comment_count,
          ccd.avg_ig_likes_count,
          ccd.eng_rate_ig
      FROM 
          creators_auth ca
      LEFT JOIN 
          creators_channel_data ccd 
      ON 
          ca.id = ccd.id
      WHERE 1=1
    `;

    const queryParams = [];
    
    // Filter by platform (Instagram, YouTube, or both)
    if (platform) {
      query += ` AND ca.primaryplatform @> $${queryParams.length + 1}`;
      queryParams.push(`{${platform}}`);
    }

    // Filter by niches
    if (niches) {
      query += ` AND ca.niches ILIKE $${queryParams.length + 1}`;
      queryParams.push(`%${niches}%`);
    }

    // Filter by followers range
    if (minFollowers) {
      query += ` AND (ccd.ig_followers_count >= $${queryParams.length + 1} OR ccd.subscribers_count_youtube >= $${queryParams.length + 1})`;
      queryParams.push(Number(minFollowers));
    }
    if (maxFollowers) {
      query += ` AND (ccd.ig_followers_count <= $${queryParams.length + 1} OR ccd.subscribers_count_youtube <= $${queryParams.length + 1})`;
      queryParams.push(Number(maxFollowers));
    }

    // Filter by engagement rate range
    if (minEngagement) {
      query += ` AND ccd.eng_rate_ig >= $${queryParams.length + 1}`;
      queryParams.push(Number(minEngagement));
    }
    if (maxEngagement) {
      query += ` AND ccd.eng_rate_ig <= $${queryParams.length + 1}`;
      queryParams.push(Number(maxEngagement));
    }

    // Execute Query
    const  result  = await db.query(query, queryParams);
    res.json({ success: true, data: result });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

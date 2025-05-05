const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/enlistInfluencers', authMiddleware, async (req, res) => {
  try {
    const brandId = req.user.id; // Get brand ID from authenticated user
    const { platform, niches, minFollowers, maxFollowers, minEngagement, maxEngagement } = req.query;

    let paramCounter = 1;
    const queryParams = [brandId];
    
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
          ccd.eng_rate_ig,
         COALESCE(
  json_agg(
    json_build_object(
      'package_type', ip.package_type,
      'price', ip.price,
      'features', ip.features,
      'delivery_time_days', ip.delivery_time_days
    )
  ) FILTER (WHERE ip.package_type IS NOT NULL 
            AND (ip.target_brand IS NULL 
                 OR ip.target_brand::text = $1::text)),
  '[]'
) as packages
      FROM 
          creators_auth ca
      LEFT JOIN 
          creators_channel_data ccd ON ca.id = ccd.id
      LEFT JOIN 
          influencer_packages ip ON ca.id = ip.creator_id
      WHERE 1=1
    `;

    // For the rest of the filters, increase the parameter counter
    paramCounter = 2; // Starting from 2 since we already used $1
    
    // Filter by platform (Instagram, YouTube, or both)
    if (platform) {
      query += ` AND ca.primaryplatform @> $${paramCounter}`;
      queryParams.push(`{${platform}}`);
      paramCounter++;
    }

    // Filter by niches
    if (niches) {
      query += ` AND ca.niches ILIKE $${paramCounter}`;
      queryParams.push(`%${niches}%`);
      paramCounter++;
    }

    // Filter by followers range
    if (minFollowers) {
      query += ` AND (ccd.ig_followers_count >= $${paramCounter} OR ccd.subscribers_count_youtube >= $${paramCounter})`;
      queryParams.push(Number(minFollowers));
      paramCounter++;
    }
    if (maxFollowers) {
      query += ` AND (ccd.ig_followers_count <= $${paramCounter} OR ccd.subscribers_count_youtube <= $${paramCounter})`;
      queryParams.push(Number(maxFollowers));
      paramCounter++;
    }

    // Filter by engagement rate range
    if (minEngagement) {
      query += ` AND ccd.eng_rate_ig >= $${paramCounter}`;
      queryParams.push(Number(minEngagement));
      paramCounter++;
    }
    if (maxEngagement) {
      query += ` AND ccd.eng_rate_ig <= $${paramCounter}`;
      queryParams.push(Number(maxEngagement));
      paramCounter++;
    }

    // Add GROUP BY clause
    query += `
      GROUP BY 
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
    `;

    // Execute Query
    const result = await db.query(query, queryParams);
    res.json({ success: true, data: result });

  } catch (error) {
    console.error('Error in enlistInfluencers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

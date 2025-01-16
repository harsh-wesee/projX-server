const express = require('express');
const axios = require('axios');
const router = express.Router();

const APP_ID = '1214245466463633';
const APP_SECRET = '882fa0724daeef73346cb856a65838d3';
const REDIRECT_URI = '<http://localhost:3000/auth/facebook/callback>';

// Initiates the Facebook Login flow
router.get('/auth/facebook', (req, res) => {
  const url = `https://www.facebook.com/v13.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=http://localhost:3000/auth/facebook/callback&scope=email`;
  res.redirect(url);
});

// Callback URL for handling the Facebook Login response
router.get('/auth/facebook/callback', async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange authorization code for access token
    const { data } = await axios.get(`https://graph.facebook.com/v13.0/oauth/access_token?client_id=${APP_ID}&client_secret=${APP_SECRET}&code=${code}&redirect_uri=${REDIRECT_URI}`);

    const { access_token } = data;

    // Use access_token to fetch user profile
    const { data: profile } = await axios.get(`https://graph.facebook.com/v13.0/me?fields=name,email&access_token=${access_token}`);

    // Code to handle user authentication and retrieval using the profile data

    res.redirect('/');
  } catch (error) {
    console.error('Error:', error.response.data.error);
    res.redirect('/login');
  }
});

// Logout route
router.get('/logout', (req, res) => {
  // Code to handle user logout
  res.redirect('/login');
});

module.exports = router;
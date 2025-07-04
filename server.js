const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const channelDetails = require('./routes/registerChannelDetails');
const brandAuth = require('./routes/registerBrands');
const brandInfo = require('./routes/brandsInformation');
const db = require('./config/database');
const fbAuth = require('./routes/FacebookLoginService/FBAuthroute')
const agencyAuth = require('./routes/agencyAuth')
const brandCampaignGateway = require('./routes/brands/createCampaign')
const searchCampaign = require('./routes/influencer/searchCampaign')
const enlistInfluencers = require('./routes/brands/discoverInflencer')
const campaignApplications = require('./routes/influencer/campaignApplications')
const influencerPackages = require('./routes/influencer/influencerPackages')
const enlistInfluencersPackage = require('./routes/brands/enlistCampaignApplication')
const agencyDiscoverInfluencers = require('./routes/agency/discoverInfluencers')
const agencyCampaignManagement = require('./routes/agency/campaignManagement')
const agencyPackagesManagement = require('./routes/agency/agency_packages')
const packagesRoutes = require('./routes/packages')
const waitlistRoutes = require('./routes/soft-launch-routes/waitlist')


const app = express();
const PORT = process.env.PORT || 5001;


app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/channelOnboarding', channelDetails);
app.use('/api/v1/brandsAuth', brandAuth);
app.use('/api/v1/brandProfile', brandInfo);
app.use('/api/v1/fbAuth', fbAuth);
app.use('/api/v1/agencyAuth', agencyAuth);
app.use('/api/v1/brandCampaignGateway', brandCampaignGateway);
app.use('/api/v1/fuzzySearch', searchCampaign);
app.use('/api/v1/fuzzyListing', enlistInfluencers);
app.use('/api/v1/creators/applyCampaign', campaignApplications);
app.use('/api/v1/creators/packages', influencerPackages);
app.use('/api/v1/brands/enlistCampaignApplication', enlistInfluencersPackage);
app.use('/api/v1/agency/discover', agencyDiscoverInfluencers);
app.use('/api/v1/agency/campaignManagement', agencyCampaignManagement);
app.use('/api/v1/agency/packageManagement', agencyPackagesManagement);
app.use('/api/v1/packages', packagesRoutes);
app.use('/api/v1/waitlist', waitlistRoutes);


// Test database connection before starting the server
async function startServer() {
  try {
    // Test the database connection
    await db.connect();
    console.log('Database connected successfully');

    // Start the server after successful database connection
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1); // Exit the process if database connection fails
  }
}

// Call the function to start the server
startServer();

// Optional: Add a simple health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Server is up and running',
    database: 'connected'
  });
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('Received SIGINT. Closing database connection...');
  try {
    await db.$pool.end(); // Properly close the database connection pool
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error closing database connection:', error);
    process.exit(1);
  }
});
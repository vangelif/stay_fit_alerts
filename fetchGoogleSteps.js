const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const fs = require('fs');
require('dotenv').config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const REDIRECT_URI = 'http://localhost'; 

const oAuth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const tokens = {
    access_token: ACCESS_TOKEN,
    refresh_token: REFRESH_TOKEN,
    scope: 'https://www.googleapis.com/auth/fitness.activity.read',
    token_type: 'Bearer',
    expiry_date: Date.now() + 3600 + 1000,
}
fs.writeFileSync('tokens.json', JSON.stringify(tokens));
console.log('Tokens are saved to tokens.json file');

if (fs.existsSync('tokens.json')) {
    const tokens = JSON.parse(fs.readFileSync('tokens.json', 'utf8'));
    oAuth2Client.setCredentials(tokens);
    console.log('Tokens are loaded from tokens.json file');
} else {
    console.log('Tokens are not found. Please authenticate');
}

async function getRefreshClient() {
    if (!oAuth2Client.credentials.refresh_token) {
        console.error('Refresh token is not available');
        return;
    }
    try {
        await oAuth2Client.getAccessToken();
        console.log('Access token is refreshed:', oAuth2Client.credentials.access_token);

        fs.writeFileSync('tokens.json', JSON.stringify(oAuth2Client.credentials));
    } catch (error) {
        console.error('Error refreshing access token:', error.message);
    }
}

async function fetchYesterdaySteps() {
    const fitness = google.fitness({ version: 'v1', auth: oAuth2Client });
    const now = new Date();
    const startOfDay = new Date(now.setDate(now.getDate() - 1)).setHours(0, 0, 0, 0);
    const endOfDay = new Date(now.setDate(now.getDate())).setHours(0, 0, 0, 0);
    try {
        const response = await fitness.users.dataset.aggregate({
            userId: 'me',
            requestBody: {
                "aggregateBy": [{
                    "dataTypeName": "com.google.step_count.delta",
                    "dataSourceId": "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
                }],
                "bucketByTime": { "durationMillis": 86400000 },
                "startTimeMillis": startOfDay,
                "endTimeMillis": endOfDay
            }
        });
        console.log('Response:', response.data);
        const steps = response.data.bucket[0]?.dataset[0]?.point[0]?.value[0]?.intVal || 0;
        console.log('Yesterday steps:', steps);
        
    } catch (error) {
        console.error('Error fetching steps:', error.message);
    }
}

(async () => {
 try {
     await getRefreshClient();
     await fetchYesterdaySteps();
 } catch (error) {
        console.error(error.message);
}
})();
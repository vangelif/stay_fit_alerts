require('dotenv').config();
const { oAuth2Client, loadTokens, refreshAccessToken } = require('./token');
const { fetchYesterdaySteps } = require('./fitness');
const { sendEmail } = require('./email');
const { writeDataToReadme } = require('./log');

(async () => {
    try {
        loadTokens();
        await refreshAccessToken();
        const data = await fetchYesterdaySteps(oAuth2Client);
        await sendEmail(data);
        writeDataToReadme(data); 
    } catch (error) {
        console.error('Error in execution:', error.message);
    }
})();

require('dotenv').config();
const { oAuth2Client, loadTokens, refreshAccessToken } = require('./token');
const { fetchLastWeekSteps } = require('./fitness');

const { sendEmail, sendErrorEmail } = require('./email');
// const { writeDataToReadme } = require('./log');

(async () => {
    try {
        loadTokens();
        await refreshAccessToken();
        const weeklyData = await fetchLastWeekSteps(oAuth2Client);
        await sendEmail(weeklyData);
        // writeDataToReadme(weeklyData); 
    } catch (error) {
        console.error('Error in execution:', error.message);
        await sendErrorEmail(error.message);
    }
})();

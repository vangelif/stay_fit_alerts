const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config();
const nodemailer = require('nodemailer');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const REDIRECT_URI = 'http://localhost';

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

function loadTokens() {
    if (fs.existsSync('tokens.json')) {
        const tokens = JSON.parse(fs.readFileSync('tokens.json', 'utf8'));
        oAuth2Client.setCredentials(tokens);
    } else {
        console.error('Tokens file not found. Please authenticate.');
        process.exit(1);
    }
}

function saveTokens(tokens) {
    fs.writeFileSync('tokens.json', JSON.stringify(tokens));
}

async function refreshAccessToken() {
    try {
        const { token } = await oAuth2Client.getAccessToken();
        console.log('Access token refreshed:', token);

        const updatedTokens = oAuth2Client.credentials;
        saveTokens(updatedTokens);
    } catch (error) {
        console.error('Error refreshing access token:', error.message);
        process.exit(1);
    }
}

function getYesterdayTimeRange() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return { startOfDay, endOfDay };
}

async function fetchYesterdaySteps() {
    const fitness = google.fitness({ version: 'v1', auth: oAuth2Client });
    const { startOfDay, endOfDay } = getYesterdayTimeRange();

    try {
        const response = await fitness.users.dataset.aggregate({
            userId: 'me',
            requestBody: {
                aggregateBy: [{
                    dataTypeName: "com.google.step_count.delta",
                    dataSourceId: "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps",
                },
                {
                    dataTypeName: "com.google.calories.expended",
                    dataSourceId: "derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended",
                }                
            ],
                bucketByTime: { durationMillis: 86400000 },
                startTimeMillis: startOfDay,
                endTimeMillis: endOfDay,
            },
        });
        const bucket = response.data.bucket;
        if (!bucket || bucket.length === 0) {

            return [];
        }

        const results = bucket.map(b => {
            const stepsDataset = b.dataset.find(d => d.dataSourceId.includes("step_count"));
            const steps = stepsDataset?.point?.[0]?.value?.[0]?.intVal || 0;

            const caloriesDataset = b.dataset.find(d => d.dataSourceId.includes("calories"));
            const cal = caloriesDataset?.point?.[0]?.value?.[0]?.fpVal || 0;
            const calories = cal.toFixed(2);

            return { steps, calories };
        });
        return results;
    } catch (error) {
        console.error('Error fetching steps:', error.message);
        throw error;
    }
}

async function sendEmail(data) {

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formattedDate = yesterday.toLocaleDateString('en-US', {
        weekday: 'long', // "Monday"
        year: 'numeric', // "2024"
        month: 'long',   // "October"
        day: 'numeric'   // "15"
    });

    let emailContent = `Yesterday's Fitness Data (${formattedDate}):\n\n`;

    data.forEach((dayData) => {
        emailContent += `🚶 Steps - ${dayData.steps}\n🥑 Calories - ${dayData.calories} kcal\n\n`;
    });

    emailContent += '\nKeep Walking,\nLove🤟🏽';

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.SECONDARY_EMAIL,
        subject: `🏊🏻 Yesterday\'s Fitness Data - ${formattedDate}`,
        text: emailContent,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

(async () => {
    try {
        loadTokens(); 
        await refreshAccessToken();
        const data = await fetchYesterdaySteps();
        await sendEmail(data); 
    } catch (error) {
        console.error('Error in execution:', error.message);
    }
})();

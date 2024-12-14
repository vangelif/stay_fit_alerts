const { google } = require('googleapis');
const fs = require('fs');
// const nodemailer = require('nodemailer');
// const { sendErrorEmail } = require('./email');
const readline = require('readline');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
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

//1ST WAY
//  async function authenticateAndGenerateTokens() {
//         const authUrl = oAuth2Client.generateAuthUrl({
//             access_type: 'offline',
//             prompt: 'consent',
//             scope: [
//                 'https://www.googleapis.com/auth/fitness.activity.read',
//                 'https://www.googleapis.com/auth/fitness.body.read',
//                 'https://www.googleapis.com/auth/fitness.location.read',
//             ],
//         });
//     const emailContent = `
//     Error occurred in the Fitness Data Script:

//     If the error is related to "invalid_grant," please follow these steps to reauthenticate:
//     1. Visit the following URL to authorize the app: 
//        ${authUrl}
//     2. Copy the code provided after authorizing the app.
//     3. Save the new tokens by running the manual reauthentication process in the script.

//     Keep moving!
//     `;

//         let transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 user: process.env.EMAIL_USER,
//                 pass: process.env.EMAIL_PASS,
//             },
//         });

//         const mailOptions = {
//             from: process.env.EMAIL_USER,
//             to: process.env.SECONDARY_EMAIL,
//             subject: '🚨 Error in Fitness Data Script',
//             text: emailContent,
//         };
//     try {
//         await transporter.sendMail(mailOptions);
//         console.log('Error notification sent successfully.');
//     } catch (error) {
//         console.error('Failed to send error notification email:', error.message);
//     }
// }

// 2ND WAY
 async function authenticateAndGenerateTokens() {
     const authUrl = oAuth2Client.generateAuthUrl({
         access_type: 'offline',
         prompt: 'consent',
         scope: [
             'https://www.googleapis.com/auth/fitness.activity.read',
             'https://www.googleapis.com/auth/fitness.body.read',
             'https://www.googleapis.com/auth/fitness.location.read',
         ],     });
           
              console.log('Authorize this app by visiting this URL:', authUrl);

     const rl = readline.createInterface({
         input: process.stdin,
         output: process.stdout,
     });

     return new Promise((resolve, reject) => {
         rl.question('Enter the code from that page here: ', async (code) => {
             rl.close();
             try {
                 const { tokens } = await oAuth2Client.getToken(code);
                 oAuth2Client.setCredentials(tokens);
                 saveTokens(tokens);
                 console.log('Tokens saved successfully.');
                 resolve();
             } catch (err) {
                 console.error('Error while trying to retrieve access token', err);
                 reject(err);
             }
         });
     });
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
        if (error.message.includes('invalid_grant')) {
             console.warn('Invalid grant detected. Reauthenticating...');
             await authenticateAndGenerateTokens();
        
            // console.error('Invalid grant error detected. Please reauthenticate manually.');
            // await sendErrorEmail('Invalid grant error detected. Please reauthenticate the script manually.');
            // process.exit(1);
        // if (error.message.includes('invalid_grant')) {
        } else {
            process.exit(1);
            // throw error;
        }
    }
}

module.exports = {
    oAuth2Client,
    loadTokens,
    refreshAccessToken,
    authenticateAndGenerateTokens
};

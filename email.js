const nodemailer = require('nodemailer');

async function sendEmail(data) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formattedDate = yesterday.toLocaleDateString('en-US', {
        weekday: 'long', 
        year: 'numeric', 
        month: 'long',   
        day: 'numeric'   
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

async function sendErrorEmail(message) {
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
        subject: '🚨 Fitness Script Error Notification',
        text: `An error occurred:\n\n${message}\n\nPlease check and resolve it.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Error notification sent successfully.');
    } catch (error) {
        console.error('Failed to send error email:', error.message);
    }
}

module.exports = { sendEmail, sendErrorEmail };

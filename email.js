const nodemailer = require('nodemailer');

async function sendEmail(weeklyData) {
    // const yesterday = new Date();
    // yesterday.setDate(yesterday.getDate() - 1);

    const formattedDates = weeklyData.map(entry => {
        const date = new Date(parseInt(entry.date));
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    });

    // const formattedDate = yesterday.toLocaleDateString('en-US', {
    //     weekday: 'long', 
    //     year: 'numeric', 
    //     month: 'long',   
    //     day: 'numeric'   
    // });

    let emailContent = `Last Week's Fitness Data:\n\n`;
    let totalSteps = 0;

    weeklyData.forEach((dayData, index) => {
        emailContent += `${formattedDates[index]}:\n`;
        emailContent += `🚶 Steps - ${dayData.steps}\n🥑 Calories - ${dayData.calories} kcal\n\n`;
        totalSteps += dayData.steps;
    });

    const averageSteps = totalSteps / 7;
    emailContent += `--------------------------\n`;

    emailContent += `🚶 Total Steps - ${totalSteps}\n`;
    emailContent += `📊 Average Steps / Day - ${averageSteps.toFixed(0)}\n`;
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
        subject: `🏊🏻 Last Week\'s Fitness Data`,
        text: emailContent,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error);
        await sendErrorEmail(error.message);
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

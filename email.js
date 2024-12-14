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

    let emailContent = '';

    let topPart = '';
    let bottomPart = '';
    let totalSteps = 0;

    weeklyData.forEach((dayData, index) => {
        
        bottomPart += `${formattedDates[index]}:<br>`;
        bottomPart += `🚶 Steps - <b>${dayData.steps.toLocaleString()}</b> 🥑 Calories - ${dayData.calories.toLocaleString()} kcal<br><br>`;
        totalSteps += dayData.steps;
    });

    const averageSteps = totalSteps / 7;

    topPart = `🚀 <b>Total Steps - ${totalSteps.toLocaleString()}</b><br>`;
    topPart += `📊 Average Steps / Day - ${averageSteps.toLocaleString()}<br>`;
    topPart += `--------------------------------------------<br><br>`;
    // emailContent += '\nKeep Walking,\nLove🤟🏽';

    emailContent += topPart + bottomPart;
    emailContent += '<br>Keep Walking,<br>Love🤟🏽';
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
        html: emailContent,
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

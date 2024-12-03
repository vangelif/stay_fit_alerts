const fs = require('fs');

function writeDataToReadme(data) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formattedDate = yesterday.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    let content = `## ${formattedDate} Fitness Data\n`;

    data.forEach((dayData) => {
        content += `- Steps: ${dayData.steps}, Calories: ${dayData.calories} kcal\n`;
    });

    fs.appendFileSync('README.md', content);
}

module.exports = { writeDataToReadme };

const { google } = require('googleapis');
const { authenticateAndGenerateTokens } = require('./token');

async function fetchLastWeekSteps(oAuth2Client) {

    const fitness = google.fitness({ version: 'v1', auth: oAuth2Client });
    const { startOfWeek, endOfWeek } = getLastWeekTimeRange();

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
                }]
                ,
                bucketByTime: { durationMillis: 86400000 },
                startTimeMillis: startOfWeek,
                endTimeMillis: endOfWeek,
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

            return { steps, calories, date: b.startTimeMillis };
        });
        return results;
    } catch (error) {
        if (error.message.includes('invalid_grant')) {
            console.warn('Invalid grant detected during data fetch. Reauthenticating...');
            await authenticateAndGenerateTokens();
            return fetchLastWeekSteps();
        } else {
            console.error('Error fetching steps:', error.message);
            throw error;
        }
}
}
function getLastWeekTimeRange() {
    const now = new Date();
    const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfWeek = new Date(endOfWeek);
    startOfWeek.setDate(startOfWeek.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);


    return { startOfWeek: startOfWeek.getTime(), endOfWeek: endOfWeek.getTime() };
}

module.exports = { fetchLastWeekSteps };

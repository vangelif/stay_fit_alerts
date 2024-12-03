const { google } = require('googleapis');

async function fetchYesterdaySteps(oAuth2Client) {
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
                }]
                ,
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

function getYesterdayTimeRange() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return { startOfDay, endOfDay };
}

module.exports = { fetchYesterdaySteps };

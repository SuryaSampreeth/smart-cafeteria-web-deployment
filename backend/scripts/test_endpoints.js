const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testEndpoints() {
    try {
        console.log('Testing /crowd/admin/analytics...');
        const analyticsRes = await axios.get(`${BASE_URL}/crowd/admin/analytics?days=7`);
        console.log('Analytics Status:', analyticsRes.status);
        console.log('Analytics Data Success:', analyticsRes.data.success);

        console.log('Testing /crowd/alerts...');
        const alertsRes = await axios.get(`${BASE_URL}/crowd/alerts?resolved=false`);
        console.log('Alerts Status:', alertsRes.status);
        console.log('Alerts Data Success:', alertsRes.data.success);

        console.log('Testing /crowd/staff/dashboard...');
        const staffRes = await axios.get(`${BASE_URL}/crowd/staff/dashboard`);
        console.log('Staff Dashboard Status:', staffRes.status);
        console.log('Staff Dashboard Data Success:', staffRes.data.success);

    } catch (error) {
        console.error('Error testing endpoints:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testEndpoints();


const BASE_URL = 'http://localhost:5000/api';

async function testAdminStats() {
    try {
        // 1. Login
        console.log('Logging in...');
        let token;
        try {
            const loginResp = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'admin@example.com',
                    password: 'password123'
                })
            });

            if (loginResp.status === 401 || loginResp.status === 404) {
                console.log('Admin not found/credentials wrong. Trying to register...');
                await fetch(`${BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'admin@example.com',
                        password: 'password123',
                        name: 'Admin User',
                        role: 'ADMIN'
                    })
                });
                const retryLogin = await fetch(`${BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'admin@example.com',
                        password: 'password123'
                    })
                });
                const data = await retryLogin.json();
                token = data.data.token;
            } else {
                const data = await loginResp.json();
                if (data.success) {
                    token = data.data.token;
                } else {
                    throw new Error(data.error || 'Login failed');
                }
            }

        } catch (e) {
            console.error('Login error:', e.message);
            return;
        }

        if (!token) {
            console.error('Failed to get token');
            return;
        }

        // 2. Fetch Stats
        console.log('Fetching Admin Stats...');
        const response = await fetch(`${BASE_URL}/admin/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAdminStats();

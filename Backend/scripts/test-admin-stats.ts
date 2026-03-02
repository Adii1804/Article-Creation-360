
import axios from 'axios';
import { prismaClient as prisma } from '../src/utils/prisma';

const BASE_URL = 'http://localhost:3000/api';

// Simple login to get token
async function login() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@example.com', // Assuming an admin user exists, or adjust as needed
            password: 'password123'
        });
        return response.data.data.token;
    } catch (error: any) {
        if (error.response?.status === 404 || error.response?.status === 401) {
            // Create admin if not exists
            try {
                await axios.post(`${BASE_URL}/auth/register`, {
                    email: 'admin@example.com',
                    password: 'password123',
                    name: 'Admin User',
                    role: 'ADMIN'
                });
                const loginResp = await axios.post(`${BASE_URL}/auth/login`, {
                    email: 'admin@example.com',
                    password: 'password123'
                });
                return loginResp.data.data.token;
            } catch (regError) {
                console.error('Failed to create/login admin:', regError);
                return null;
            }
        }
        console.error('Login failed:', error.message);
        return null;
    }
}

async function testAdminStats() {
    const token = await login();
    if (!token) {
        console.error('Skipping test due to login failure');
        return;
    }

    try {
        const response = await axios.get(`${BASE_URL}/admin/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Admin Stats Response:', JSON.stringify(response.data, null, 2));

        const data = response.data.data;
        if (
            typeof data.totalUploads === 'number' &&
            typeof data.completed === 'number' &&
            typeof data.failed === 'number' &&
            typeof data.pending === 'number'
        ) {
            console.log('✅ Admin stats structure is correct');
            // Optional: Verify against DB count
            const dbCount = await prisma.extractionResultFlat.count();
            console.log(`DB Count: ${dbCount}, API Count: ${data.totalUploads}`);
            if (dbCount === data.totalUploads) {
                console.log('✅ Counts match DB');
            } else {
                console.warn('⚠️ Counts do not match DB (might be due to seeding/latency)');
            }

        } else {
            console.error('❌ Admin stats structure is INCORRECT');
        }

    } catch (error: any) {
        console.error('Failed to fetch admin stats:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    } finally {
        await prisma.$disconnect();
    }
}

testAdminStats();

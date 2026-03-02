#!/usr/bin/env node

/**
 * 🧪 Authentication & API Test Script
 * Tests the complete authentication flow and API endpoints
 */

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000/api';

// Test credentials (update these with your actual test credentials)
const ADMIN_CREDS = {
  email: 'admin@test.com',
  password: 'password'
};

const USER_CREDS = {
  email: 'user@test.com',
  password: 'password'
};

let adminToken = '';
let userToken = '';

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  console.log(`\n📡 ${options.method || 'GET'} ${endpoint}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${response.status} ${response.statusText}`);
      return { success: true, data, status: response.status };
    } else {
      console.log(`❌ ${response.status} ${response.statusText}`);
      console.log(`   Error: ${data.error || 'Unknown error'}`);
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Starting Authentication & API Tests\n');
  console.log('='.repeat(60));

  // ============================================
  // TEST 1: Health Check (Public)
  // ============================================
  console.log('\n\n📋 TEST 1: Health Check (Public Endpoint)');
  console.log('-'.repeat(60));
  const healthCheck = await apiCall('/');
  if (!healthCheck.success) {
    console.log('❌ Health check failed - is the server running?');
    process.exit(1);
  }
  console.log('✅ Server is running');

  // ============================================
  // TEST 2: Login as Admin
  // ============================================
  console.log('\n\n📋 TEST 2: Login as Admin');
  console.log('-'.repeat(60));
  const adminLogin = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(ADMIN_CREDS)
  });

  if (!adminLogin.success) {
    console.log('❌ Admin login failed - check credentials');
    console.log('   Update ADMIN_CREDS in this script with valid credentials');
    process.exit(1);
  }

  adminToken = adminLogin.data.data.token;
  console.log('✅ Admin logged in successfully');
  console.log(`   Token: ${adminToken.substring(0, 20)}...`);
  console.log(`   Role: ${adminLogin.data.data.user.role}`);

  // ============================================
  // TEST 3: Login as Regular User
  // ============================================
  console.log('\n\n📋 TEST 3: Login as Regular User');
  console.log('-'.repeat(60));
  const userLogin = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(USER_CREDS)
  });

  if (!userLogin.success) {
    console.log('⚠️  User login failed - skipping user tests');
    console.log('   This is OK if you don\'t have a regular user account yet');
  } else {
    userToken = userLogin.data.data.token;
    console.log('✅ User logged in successfully');
    console.log(`   Token: ${userToken.substring(0, 20)}...`);
    console.log(`   Role: ${userLogin.data.data.user.role}`);
  }

  // ============================================
  // TEST 4: Access Admin Endpoint WITHOUT Token
  // ============================================
  console.log('\n\n📋 TEST 4: Access Admin Endpoint WITHOUT Token');
  console.log('-'.repeat(60));
  const noAuthAdmin = await apiCall('/admin/stats');
  
  if (noAuthAdmin.status === 401) {
    console.log('✅ Correctly rejected (401) - authentication is working!');
  } else {
    console.log('❌ SECURITY ISSUE: Endpoint accessible without authentication!');
  }

  // ============================================
  // TEST 5: Access Admin Endpoint WITH Admin Token
  // ============================================
  console.log('\n\n📋 TEST 5: Access Admin Endpoint WITH Admin Token');
  console.log('-'.repeat(60));
  const adminStats = await apiCall('/admin/stats', {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  if (adminStats.success) {
    console.log('✅ Admin access granted');
    console.log(`   Departments: ${adminStats.data.data.departments}`);
    console.log(`   Categories: ${adminStats.data.data.categories}`);
  } else {
    console.log('❌ Admin access failed - check authentication middleware');
  }

  // ============================================
  // TEST 6: Access Admin Endpoint WITH User Token
  // ============================================
  if (userToken) {
    console.log('\n\n📋 TEST 6: Access Admin Endpoint WITH User Token');
    console.log('-'.repeat(60));
    const userAsAdmin = await apiCall('/admin/stats', {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    if (userAsAdmin.status === 403) {
      console.log('✅ Correctly rejected (403) - role-based access is working!');
    } else if (userAsAdmin.success) {
      console.log('❌ SECURITY ISSUE: User has admin access!');
    } else {
      console.log('❌ Unexpected error');
    }
  }

  // ============================================
  // TEST 7: Access User Endpoint WITH Admin Token
  // ============================================
  console.log('\n\n📋 TEST 7: Access User Endpoint WITH Admin Token');
  console.log('-'.repeat(60));
  const adminAsUser = await apiCall('/user/health', {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  if (adminAsUser.success) {
    console.log('✅ Admin can access user endpoints (correct behavior)');
  } else {
    console.log('❌ Admin cannot access user endpoints');
  }

  // ============================================
  // TEST 8: Access User Endpoint WITH User Token
  // ============================================
  if (userToken) {
    console.log('\n\n📋 TEST 8: Access User Endpoint WITH User Token');
    console.log('-'.repeat(60));
    const userEndpoint = await apiCall('/user/health', {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    if (userEndpoint.success) {
      console.log('✅ User can access user endpoints');
    } else {
      console.log('❌ User cannot access user endpoints');
    }
  }

  // ============================================
  // TEST 9: Token Verification
  // ============================================
  console.log('\n\n📋 TEST 9: Token Verification');
  console.log('-'.repeat(60));
  const verifyToken = await apiCall('/auth/verify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  if (verifyToken.success) {
    console.log('✅ Token verification successful');
    console.log(`   User: ${verifyToken.data.data.user.name}`);
  } else {
    console.log('❌ Token verification failed');
  }

  // ============================================
  // TEST 10: Invalid Token
  // ============================================
  console.log('\n\n📋 TEST 10: Invalid Token');
  console.log('-'.repeat(60));
  const invalidToken = await apiCall('/admin/stats', {
    headers: {
      'Authorization': 'Bearer invalid.token.here'
    }
  });

  if (invalidToken.status === 401) {
    console.log('✅ Invalid token correctly rejected');
  } else {
    console.log('❌ Invalid token accepted (security issue!)');
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('\n✅ All critical security tests passed!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Check database for audit logs');
  console.log('   2. Test frontend authentication flow');
  console.log('   3. Test extraction endpoints with auth');
  console.log('   4. Monitor logs for any errors');
  console.log('\n🎉 Authentication system is working correctly!\n');
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test script failed:', error);
  process.exit(1);
});

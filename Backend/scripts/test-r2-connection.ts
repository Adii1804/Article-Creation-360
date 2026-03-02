require('dotenv').config();
import { S3Client, PutObjectCommand, ListBucketsCommand } from '@aws-sdk/client-s3';

async function testR2Connection() {
    console.log('🧪 Testing Cloudflare R2 Connection...\n');

    // Check environment variables
    console.log('📋 Checking Environment Variables:');
    console.log('   R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME || '❌ MISSING');
    console.log('   R2_ACCOUNT_ID:', process.env.R2_ACCOUNT_ID ? '✅ Set' : '❌ MISSING');
    console.log('   R2_ACCESS_KEY_ID:', process.env.R2_ACCESS_KEY_ID ? '✅ Set' : '❌ MISSING');
    console.log('   R2_SECRET_ACCESS_KEY:', process.env.R2_SECRET_ACCESS_KEY ? '✅ Set' : '❌ MISSING');
    console.log('');

    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
        console.error('❌ Missing R2 credentials in environment variables!');
        console.log('\n🔧 Make sure .env file has:');
        console.log('   R2_BUCKET_NAME=articlecreation');
        console.log('   R2_ACCOUNT_ID=bab06c93e17ae71cae3c11b4cc40240b');
        console.log('   R2_ACCESS_KEY_ID=4d1c7fbbf9bd19cd25e9829b4280d040');
        console.log('   R2_SECRET_ACCESS_KEY=7e7e4443b258349845517fb602c60ab235cb73d468c5efa18b861331d83f0700');
        process.exit(1);
    }

    try {
        // Create S3 client
        const endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
        console.log('🔗 Connecting to:', endpoint);

        const s3Client = new S3Client({
            region: 'auto',
            endpoint: endpoint,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
            }
        });

        // Test 1: List buckets
        console.log('\n📦 Test 1: Listing buckets...');
        try {
            const listCommand = new ListBucketsCommand({});
            const listResponse = await s3Client.send(listCommand);
            console.log('✅ Successfully connected to R2!');
            console.log('   Found', listResponse.Buckets?.length || 0, 'bucket(s)');
            if (listResponse.Buckets) {
                listResponse.Buckets.forEach(bucket => {
                    console.log('   -', bucket.Name);
                });
            }
        } catch (error: any) {
            console.error('❌ Failed to list buckets:', error.message);
        }

        // Test 2: Upload a test file
        console.log('\n📤 Test 2: Uploading test file...');
        const testBuffer = Buffer.from('Hello from R2 test!', 'utf-8');
        const testKey = `test-uploads/test-${Date.now()}.txt`;

        const uploadCommand = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: testKey,
            Body: testBuffer,
            ContentType: 'text/plain'
        });

        await s3Client.send(uploadCommand);
        console.log('✅ Upload successful!');
        console.log('   Bucket:', process.env.R2_BUCKET_NAME);
        console.log('   Key:', testKey);
        console.log('\n🎉 R2 is working correctly!');
        console.log('\n📍 Verify in Cloudflare Dashboard:');
        console.log('   https://dash.cloudflare.com/');
        console.log('   → R2 → articlecreation');
        console.log('   → Look for: test-uploads/ folder');

    } catch (error: any) {
        console.error('\n❌ R2 Test Failed!');
        console.error('Error:', error.message);

        if (error.Code) {
            console.error('Error Code:', error.Code);
        }

        if (error.$metadata) {
            console.error('HTTP Status:', error.$metadata.httpStatusCode);
        }

        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Verify credentials are correct in .env');
        console.log('   2. Check bucket name is exactly "articlecreation"');
        console.log('   3. Ensure API keys have proper permissions');
        console.log('   4. Verify account ID matches your Cloudflare account');

        process.exit(1);
    }
}

testR2Connection().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
});

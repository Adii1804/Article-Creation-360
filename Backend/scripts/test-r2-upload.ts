import { storageService } from '../src/services/storageService';
import * as fs from 'fs';
import * as path from 'path';

async function testR2Upload() {
    console.log('🧪 Testing Cloudflare R2 Upload...\n');

    try {
        // Create a simple test image buffer (1x1 red pixel PNG)
        const testImageBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
            'base64'
        );

        console.log('📤 Uploading test image to R2...');
        console.log('   Bucket: articlecreation');
        console.log('   Folder: fashion-images');
        console.log('   File: test-image.png\n');

        const result = await storageService.uploadFile(
            testImageBuffer,
            'test-image.png',
            'image/png',
            'fashion-images'
        );

        console.log('✅ Upload Successful!\n');
        console.log('📊 Upload Result:');
        console.log('   UUID:', result.uuid);
        console.log('   Key:', result.key);
        console.log('   Path:', result.path);
        console.log('   URL:', result.url);
        console.log('\n🎉 R2 storage is working correctly!');
        console.log('\n📍 Check your Cloudflare dashboard:');
        console.log('   https://dash.cloudflare.com/');
        console.log('   → R2 → articlecreation bucket');
        console.log('   → Look for:', result.key);

    } catch (error) {
        console.error('❌ Upload Failed!');
        console.error('Error:', error);

        if (error instanceof Error) {
            console.error('\n🔍 Error Details:');
            console.error('   Message:', error.message);
            console.error('   Stack:', error.stack);
        }

        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Check .env file has correct R2 credentials');
        console.log('   2. Verify bucket name is "articlecreation"');
        console.log('   3. Ensure R2 API keys have write permissions');
        console.log('   4. Check network connectivity to Cloudflare');
    }
}

// Run the test
testR2Upload().catch(console.error);

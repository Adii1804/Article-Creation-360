import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function testActualUpload() {
    console.log('🧪 Testing Actual Image Upload Endpoint...\n');

    try {
        // Create a simple test image (1x1 red pixel PNG)
        const testImageBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
            'base64'
        );

        // Save to temp file
        const tempPath = path.join(__dirname, 'test-image.png');
        fs.writeFileSync(tempPath, testImageBuffer);

        // Create form data
        const form = new FormData();
        form.append('image', fs.createReadStream(tempPath));
        form.append('schema', JSON.stringify([
            { key: 'color', label: 'Color', type: 'select' },
            { key: 'pattern', label: 'Pattern', type: 'select' }
        ]));
        form.append('categoryName', 'T-Shirt');

        console.log('📤 Sending upload request to backend...');
        console.log('   Endpoint: http://localhost:5000/api/user/extract/upload');
        console.log('   Image: test-image.png (1x1 pixel)');
        console.log('   Schema: 2 attributes\n');

        const response = await fetch('http://localhost:5000/api/user/extract/upload', {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Upload Successful!\n');
            console.log('📊 Response:');
            console.log(JSON.stringify(data, null, 2));

            if (data.metadata?.imageUrl) {
                console.log('\n🎉 Image URL from response:', data.metadata.imageUrl);
                console.log('\n📍 Check Cloudflare Dashboard:');
                console.log('   https://dash.cloudflare.com/');
                console.log('   → R2 → articlecreation bucket');
                console.log('   → Look for: fashion-images/ folder');
            } else {
                console.log('\n⚠️ Warning: No imageUrl in response metadata');
            }
        } else {
            console.error('❌ Upload Failed!');
            console.error('Status:', response.status, response.statusText);
            console.error('Response:', JSON.stringify(data, null, 2));
        }

        // Cleanup
        fs.unlinkSync(tempPath);

    } catch (error: any) {
        console.error('\n❌ Test Failed!');
        console.error('Error:', error.message);
        console.error('\n🔧 Make sure:');
        console.log('   1. Backend is running on port 5000');
        console.log('   2. R2 credentials are in .env');
        console.log('   3. Database is accessible');
    }
}

testActualUpload().catch(console.error);

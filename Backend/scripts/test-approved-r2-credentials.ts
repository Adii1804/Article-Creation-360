import 'dotenv/config';
import { randomUUID } from 'crypto';
import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

async function main() {
  const accountId = String(process.env.APPROVED_R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || '').trim();
  const accessKeyId = String(process.env.APPROVED_R2_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = String(process.env.APPROVED_R2_SECRET_ACCESS_KEY || '').trim();
  const bucket = String(process.env.APPROVED_R2_BUCKET_NAME || '').trim();

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('Missing approved R2 env vars');
  }

  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  const key = `cred-test-${Date.now()}-${randomUUID()}.txt`;
  const body = Buffer.from(`approved-r2-credential-test-${new Date().toISOString()}`);

  const client = new S3Client({
    region: 'auto',
    endpoint,
    forcePathStyle: true,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    credentials: { accessKeyId, secretAccessKey }
  });

  console.log('Testing approved R2 credentials...');
  console.log('accountId:', accountId);
  console.log('bucket:', bucket);
  console.log('endpoint:', endpoint);

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: 'text/plain',
    Metadata: { test: 'true' }
  }));
  console.log('PUT ok:', key);

  await client.send(new HeadObjectCommand({
    Bucket: bucket,
    Key: key
  }));
  console.log('HEAD ok:', key);

  await client.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: key
  }));
  console.log('DELETE ok:', key);

  console.log('✅ Approved R2 credentials are valid and have write access.');
}

main().catch((error: any) => {
  console.error('❌ Approved R2 credential test failed');
  console.error('name:', error?.name);
  console.error('code:', error?.Code || error?.code);
  console.error('message:', error?.message);
  if (error?.$metadata) {
    console.error('httpStatusCode:', error.$metadata.httpStatusCode);
  }
  process.exit(1);
});

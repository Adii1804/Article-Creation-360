const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/controllers/enhancedExtractionController.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Duplicate season parameter
content = content.replace(/season,\s+season,/g, 'season,');
console.log('Fixed duplicate season parameter');

// Fix 2: Remove broken base64 saving logic from extractFromUploadVLM
// We look for the marker inside extractFromUploadVLM
// The block starts with "// Save base64 image to disk" and ends BEFORE "await this.persistExtractionJob"
// And it's inside extractFromUploadVLM (which has "req.file")

const uploadMethodStart = content.indexOf('extractFromUploadVLM = async');
const base64MethodStart = content.indexOf('extractFromBase64VLM = async');

if (uploadMethodStart !== -1 && base64MethodStart !== -1) {
    const uploadBlock = content.substring(uploadMethodStart, base64MethodStart);

    const saveLogicStart = uploadBlock.indexOf('// Save base64 image to disk');
    if (saveLogicStart !== -1) {
        // Found it! It shouldn't be here.
        // Let's find where it ends. It ends before "await this.persistExtractionJob"
        const persistCall = uploadBlock.indexOf('await this.persistExtractionJob', saveLogicStart);

        if (persistCall !== -1) {
            const badBlock = uploadBlock.substring(saveLogicStart, persistCall);
            const replacement = `// Use local file path from Multer upload (normalized)
      let imagePath = req.file.path.replace(/\\\\/g, '/');
      console.log(\`💾 Using uploaded file path: \${imagePath}\`);\n\n      `;

            const newUploadBlock = uploadBlock.replace(badBlock, replacement);
            content = content.replace(uploadBlock, newUploadBlock);
            console.log('Fixed extractFromUploadVLM logic');
        } else {
            console.error('Could not find persistExtractionJob in upload block');
        }
    } else {
        console.log('extractFromUploadVLM logic looks clean (no base64 saving)');
    }
}

// Fix 3: Ensure extractFromBase64VLM has saving logic
// We check if "Save base64 image to disk" exists inside extractFromBase64VLM block
const base64Block = content.substring(base64MethodStart);
if (!base64Block.includes('// Save base64 image to disk')) {
    console.log('extractFromBase64VLM missing saving logic - inserting it');

    const insertPoint = base64Block.indexOf('await this.persistExtractionJob');
    if (insertPoint !== -1) {
        const logicToInsert = `
      // Save base64 image to disk
      let imagePath = image; // Default to provided base64 if saving fails
      
      try {
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(process.cwd(), 'uploads', 'images');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Generate filename: use provided fileName (sanitized) or timestamp
        let validFileName = \`extraction_\${Date.now()}.jpg\`;
        if (fileName) {
          // Sanitization similar to Multer logic
          const nameWithoutExt = fileName.replace(/\\.[^/.]+$/, '');
          const articleNumber = nameWithoutExt.split(' ')[0] || nameWithoutExt;
          const ext = fileName.split('.').pop() || 'jpg';
          validFileName = \`\${articleNumber}_\${Date.now()}.\${ext}\`;
        } else {
             // Try to guess from base64 header if present, else jpg
            const match = image.match(/^data:image\\/(\\w+);base64,/);
            const ext = match ? match[1] : 'jpg';
            validFileName = \`extraction_\${Date.now()}.\${ext}\`;
        }

        const filePath = path.join(uploadsDir, validFileName);
        
        // Remove header (data:image/jpeg;base64,) if present
        const base64Data = image.replace(/^data:image\\/\\w+;base64,/, "");
        
        fs.writeFileSync(filePath, base64Data, 'base64');
        console.log(\`💾 Saved base64 image to: \${filePath}\`);
        
        imagePath = \`uploads/images/\${validFileName}\`;
        
      } catch (err) {
        console.error('❌ Failed to save base64 image to disk:', err);
      }

      `;

        // We insert before persistExtractionJob, but need to reconstruct the string carefully
        // Actually, since we replaced content above, indexes might satisfy?
        // No, we updated `content` variable. So `base64Start` index is shifted if `uploadBlock` changed length.
        // Let's recalculate indexes.

        const newBase64Start = content.indexOf('extractFromBase64VLM = async');
        const before = content.substring(0, newBase64Start);
        const after = content.substring(newBase64Start);

        const insertIndexInAfter = after.indexOf('await this.persistExtractionJob');
        const newAfter = after.substring(0, insertIndexInAfter) + logicToInsert + after.substring(insertIndexInAfter);

        content = before + newAfter;
        console.log('Inserted saving logic into extractFromBase64VLM');
    }
} else {
    console.log('extractFromBase64VLM already has saving logic');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated enhancedExtractionController.ts');

# Simplified Fashion Extraction Workflow

## 🎯 Overview

A streamlined extraction workflow has been added alongside the existing comprehensive workflow. This allows you to quickly extract fashion attributes without complex hierarchy navigation or metadata forms.

## ✨ Key Features

### 1. Simplified Hierarchy
- **Before**: Department → Sub-Department → Major Category → Minor Category
- **Now**: Department → Major Category only
- **Benefit**: 50% fewer selection steps

### 2. Fixed Attribute Schema
Extracts exactly **27 specific attributes**:
- neck
- neck_details
- collar
- placket
- sleeve
- bottom_fold
- front_open_style
- pocket_type
- fit
- pattern
- length
- drawcord
- button
- zipper
- zip_colour
- print_type
- print_style
- print_placement
- patches
- patches_type
- embroidery
- embroidery_type
- wash
- colour
- father_belt
- child_belt

### 3. Confidence Threshold
- Only shows attributes with **≥65% confidence**
- Low-confidence results are automatically filtered out
- No hallucinated or uncertain data

### 4. Streamlined Workflow
1. Select Department (Kids, Ladies, Mens)
2. Select Major Category (Tops, Bottoms, etc.)
3. Upload images
4. **Auto-start batch extraction** (no metadata form)
5. View high-confidence results only

## 🚀 How to Access

### Frontend Routes:
- **Simplified Workflow**: http://localhost:5173/extraction/simplified
- **Original Workflow**: http://localhost:5173/extraction (unchanged)

### Backend API Endpoints:
- **Simplified Upload**: `POST /api/user/simplified/extract-upload`
- **Simplified Base64**: `POST /api/user/simplified/extract-base64`
- **Original Endpoints**: All existing endpoints remain unchanged

## 📁 New Files Created

### Backend:
1. `Backend/src/config/simplifiedAttributes.ts` - Fixed 27-attribute schema definition
2. `Backend/src/controllers/simplifiedExtractionController.ts` - Simplified extraction logic
3. `Backend/src/routes/simplifiedExtraction.ts` - API routes for simplified workflow
4. `Backend/src/services/simplifiedPromptService.ts` - VLM prompts for 27 attributes

### Frontend:
1. `Frontend/src/features/extraction/components/SimplifiedCategorySelector.tsx` - Dept → Major Category selector
2. `Frontend/src/features/extraction/pages/SimplifiedExtractionPage.tsx` - Simplified UI workflow

### Modified Files:
1. `Backend/src/index.ts` - Added route registration for `/api/user/simplified`
2. `Frontend/src/AppModern.tsx` - Added route for `/extraction/simplified`

## 🔄 Rollback Capability

**All existing code is preserved!** The simplified workflow runs alongside the original:

- Original extraction controller: ✅ Untouched
- Original extraction page: ✅ Untouched
- Original category selector: ✅ Untouched
- Database schema: ✅ No changes required

To revert to original workflow only:
1. Remove simplified route from `AppModern.tsx`
2. Remove simplified route registration from `Backend/src/index.ts`
3. Delete the 6 new files listed above

## 🎨 UI Differences

### Original Workflow:
```
Step 1: Select Category
  ├── Department
  ├── Sub-Department
  ├── Major Category
  └── Minor Category

Step 2: Upload Images
  └── Fill Metadata Form (vendor, design#, rate, etc.)

Step 3: Manual Start Extraction
  └── Click "Start Batch"
```

### Simplified Workflow:
```
Step 1: Select Category
  ├── Department
  └── Major Category ✨ (simplified!)

Step 2: Upload Images
  └── Auto-start extraction ✨ (no metadata form!)

Step 3: View Results
  └── High-confidence only (≥65%) ✨
```

## 🧪 Testing

### Test Simplified Workflow:
1. Start backend: `cd Backend && npm run dev`
2. Start frontend: `cd Frontend && npm run dev`
3. Login at http://localhost:5173/login
4. Navigate to http://localhost:5173/extraction/simplified
5. Select: Department = "Mens", Major Category = "Tops"
6. Upload a fashion image
7. Extraction auto-starts
8. View filtered results (confidence ≥65% only)

### Test Original Workflow:
1. Navigate to http://localhost:5173/extraction
2. All original features work exactly as before

## 📊 Confidence Filtering

The AI model provides confidence scores for each attribute (0-100%).

**Simplified workflow filters**:
- ≥65%: Attribute shown ✅
- <65%: Attribute hidden (set to null) ❌

Example:
```json
{
  "collar": {
    "rawValue": "round collar",
    "visualConfidence": 85  // ✅ Shown (≥65%)
  },
  "placket": {
    "rawValue": "button placket",
    "visualConfidence": 45  // ❌ Hidden (<65%)
  }
}
```

## 🔧 Configuration

### Adjust Confidence Threshold:
Edit `Backend/src/config/simplifiedAttributes.ts`:
```typescript
export const SIMPLIFIED_ATTRIBUTES: SimplifiedAttribute[] = [
  { key: 'neck', label: 'Neck', type: 'TEXT', confidenceThreshold: 70 }, // Change from 65 to 70
  // ...
];
```

### Add/Remove Attributes:
Same file, add or remove items from the array. Maximum recommended: 30 attributes (for optimal VLM performance).

## 💡 Best Practices

1. **Use Simplified for**: Quick extractions, batch processing, high-volume workflows
2. **Use Original for**: Complex categorization, metadata-rich exports, R&D projects
3. **Quality Images**: Higher image quality = higher confidence scores
4. **Batch Uploads**: Upload multiple images at once for efficient processing

## 🐛 Troubleshooting

### Issue: All attributes showing as null
- **Cause**: Images may be low quality or confidence threshold too high
- **Fix**: Use higher resolution images or lower threshold to 60%

### Issue: Simplified route not working
- **Cause**: Backend route not registered
- **Fix**: Restart backend server, check console for route registration logs

### Issue: Auto-extraction not starting
- **Cause**: Category not selected before upload
- **Fix**: Ensure both Department and Major Category are selected

## 📝 Next Steps

Recommended enhancements:
1. Add batch export for simplified results
2. Add confidence threshold slider in UI
3. Create presets for different departments
4. Add comparison view (simplified vs comprehensive)
5. Analytics dashboard for simplified workflow metrics

---

**Note**: Both workflows use the same authentication, database, and VLM infrastructure. Choose the workflow that best fits your use case!

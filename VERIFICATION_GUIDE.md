# Verification Guide: DeepSeek Schema Fix

This guide helps verify that the DeepSeek schema fix is working correctly in your environment.

## Quick Verification

### 1. Check Patch Application
After running `npm install`, verify the patch was applied:

```bash
npm run postinstall
```

Expected output:
```
patch-package 8.0.0
Applying patches...
genkitx-deepseek@1.0.1 ✔
```

### 2. Verify Schema Structure
Run the verification script:

```bash
node /tmp/test-schema-fix.js
```

Expected output:
```
Testing DeepSeek Schema Fix...

Test 1: Verifying schema structure...
✓ Schema validation passed
  - Role: model
  - Content type: Array
  - Content length: 1
  - First content item: { text: 'Hello, this is a test response.' }

Test 2: Verifying old schema format is rejected...
✓ Old schema format correctly rejected

Test 3: Testing fromDeepSeekChoice function...
✓ fromDeepSeekChoice conversion passed
  - Converted role: model
  - Converted content: [ { text: 'This is a test response from DeepSeek API' } ]
  - Content is array: true

========================================
All tests passed! ✓
The DeepSeek schema fix is working correctly.
========================================
```

### 3. Type Check
Verify TypeScript compilation:

```bash
npm run typecheck
```

Expected: No errors

### 4. Build Verification
Verify production build:

```bash
npm run build
```

Expected: Successful build

## End-to-End Testing

To test the full transcription pipeline (requires DeepSeek API key):

### 1. Set Environment Variables
Create a `.env.local` file:

```bash
DEEPSEEK_API_KEY=your-actual-api-key-here
NEXT_PUBLIC_DAREDEVIL_API_URL=https://devel.cid-uff.net
```

### 2. Test AI Flows

#### Test Transcription Correction
```typescript
import { correctTranscriptionErrors } from '@/ai/flows/correct-transcription-errors';

const result = await correctTranscriptionErrors({
  transcription: "Ola mundo isto e um teste"
});

console.log(result.correctedTranscription);
// Should output corrected text without errors
```

#### Test Speaker Identification
```typescript
import { identifySpeakers } from '@/ai/flows/identify-speakers-in-text';

const result = await identifySpeakers({
  text: "Olá, tudo bem? Sim, estou bem, obrigado."
});

console.log(result.identifiedText);
// Should output text with speakers identified
```

#### Test Summary Generation
```typescript
import { summarizeText } from '@/ai/flows/summarize-text';

const result = await summarizeText({
  text: "Locutor 1: Vamos discutir o projeto. Locutor 2: Concordo, precisamos definir o cronograma."
});

console.log(result.summary);
// Should output a meeting summary in Markdown
```

## Troubleshooting

### Issue: Patch doesn't apply
**Solution:** 
1. Delete `node_modules/genkitx-deepseek`
2. Run `npm install`
3. Verify patch application with `npm run postinstall`

### Issue: Schema validation still fails
**Solution:**
1. Check that the patch file exists: `ls patches/genkitx-deepseek+1.0.1.patch`
2. Verify patch content matches the expected changes
3. Clean install: `rm -rf node_modules package-lock.json && npm install`

### Issue: TypeScript errors
**Solution:**
1. Run `npm run typecheck` to see specific errors
2. Verify TypeScript version matches package.json
3. Clean TypeScript cache: `rm -rf .next`

## Expected Behavior After Fix

### Before Fix
```
Error: INVALID_ARGUMENT: Schema validation failed. 
Parse Errors: - candidates.0.message: must have required property 'content'
```

### After Fix
All AI flows execute successfully:
- ✅ Transcription correction completes
- ✅ Speaker identification works
- ✅ Summary generation succeeds
- ✅ No schema validation errors

## Monitoring

Monitor your application logs for:
- ✅ No "INVALID_ARGUMENT" errors
- ✅ Successful DeepSeek API calls
- ✅ Proper AI flow completions

## Support

If you encounter issues after applying this fix:
1. Check the `DEEPSEEK_SCHEMA_FIX.md` for detailed information
2. Review `FIX_SUMMARY.md` for implementation details
3. Ensure you're using genkitx-deepseek v1.0.1 (the patched version)
4. Verify your DeepSeek API key is valid and has sufficient quota

## Success Indicators

You'll know the fix is working when:
- ✅ Patch applies without errors during `npm install`
- ✅ TypeScript compilation succeeds
- ✅ Production build completes
- ✅ AI flows process text without errors
- ✅ Transcription service works end-to-end

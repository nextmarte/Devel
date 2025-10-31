# DeepSeek Schema Fix

## Problem

The application was encountering a schema validation error when using the DeepSeek AI model through Genkit:

```
INVALID_ARGUMENT: Schema validation failed. Parse Errors: - candidates.0.message: must have required property 'content'
```

## Root Cause

The `genkitx-deepseek` package (v1.0.1) was using an incompatible schema format for the candidate message structure. Specifically:

- **Package used**: `message.text` (string) with role `'assistant'`
- **Genkit expected**: `message.content` (array of parts) with role `'model'`

This mismatch caused schema validation failures when the AI flows tried to process responses from DeepSeek.

## Solution

We created a patch for the `genkitx-deepseek` package that fixes the schema mismatch. The patch modifies three key areas:

### 1. Schema Definition
Changed from:
```javascript
message: z.object({
  role: z.literal('assistant'),
  text: z.string(),
})
```

To:
```javascript
message: z.object({
  role: z.literal('model'),
  content: z.array(z.object({
    text: z.string(),
  })),
})
```

### 2. Response Conversion Functions
Updated `fromDeepSeekChoice` and `fromDeepSeekChunkChoice` to:
- Use `role: 'model'` instead of `'assistant'`
- Convert text to `content: [{ text: '...' }]` format

### 3. Streaming Callback
Fixed the streaming callback to pass the correct content structure.

## Implementation

The fix is implemented using [patch-package](https://github.com/ds300/patch-package), which allows us to apply patches to npm packages:

1. **Patch file**: `patches/genkitx-deepseek+1.0.1.patch`
2. **Auto-apply**: The patch is automatically applied after `npm install` via the `postinstall` script

## Testing

Run the test to verify the fix:
```bash
node /tmp/test-schema-fix.js
```

All AI flows (`correctTranscriptionErrors`, `identifySpeakers`, `summarizeText`) should now work without schema validation errors.

## Impact

This fix resolves the following issues:
- ✅ Transcription error correction works correctly
- ✅ Speaker identification processes text properly
- ✅ Meeting summary generation completes successfully
- ✅ Both streaming and non-streaming responses are handled correctly

## Future Considerations

If the `genkitx-deepseek` package is updated to version 1.0.2 or higher, check if the schema issue has been fixed upstream. If so, the patch can be removed by:

1. Deleting `patches/genkitx-deepseek+1.0.1.patch`
2. Removing or updating the version-specific patch in `package.json`
3. Running `npm install` to use the unpatched version

## Related Files

- `patches/genkitx-deepseek+1.0.1.patch` - The patch file
- `package.json` - Contains the `postinstall` script
- `src/ai/flows/*.ts` - AI flows that use the DeepSeek model

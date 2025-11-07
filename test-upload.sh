#!/bin/bash

# Teste para ver a resposta completa

echo "Testando upload..."

dd if=/dev/zero of=/tmp/silence.raw bs=1 count=64000 2>/dev/null
ffmpeg -f u8 -acodec pcm_u8 -ar 16000 -ac 1 -i /tmp/silence.raw -acodec libmp3lame -ab 32k /tmp/test.mp3 -y 2>/dev/null

curl -s -X POST \
  -F "file=@/tmp/test.mp3" \
  -F "generateSummary=true" \
  -H "X-Session-Id: test-session" \
  http://localhost:3000/api/transcribe/async 

echo ""

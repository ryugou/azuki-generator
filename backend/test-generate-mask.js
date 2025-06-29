// Test Generate Mask Image API
const fs = require('fs');

async function testGenerateMask() {
  // 1x1の透明なPNG画像（テスト用）
  const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  const testCases = [
    { missing_part: 'lower body', description: '下半身欠損' },
    { missing_part: 'upper body', description: '上半身欠損' },
    { missing_part: 'none', description: '欠損なし' }
  ];

  for (const testCase of testCases) {
    console.log(`\n=== Testing: ${testCase.description} ===`);
    
    try {
      const response = await fetch('http://localhost:8080/api/generate-mask-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_image: testImage,
          missing_part: testCase.missing_part
        }),
      });

      const result = await response.json();
      console.log('Status:', response.status);
      
      if (result.mask_image) {
        console.log('Mask image generated successfully');
        console.log('Base64 length:', result.mask_image.length);
        
        // マスク画像を保存（確認用）
        const filename = `test-mask-${testCase.missing_part.replace(' ', '-')}.png`;
        fs.writeFileSync(filename, Buffer.from(result.mask_image, 'base64'));
        console.log(`Saved to: ${filename}`);
      } else {
        console.log('Error:', result);
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
}

// Node.js環境でfetchが利用できない場合の対処
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testGenerateMask();
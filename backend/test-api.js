const fs = require('fs');
const path = require('path');

// テスト用の画像をBase64に変換
function imageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
}

// サンプル画像のパスを指定（実際の画像ファイルに置き換えてください）
const sampleItemImage = path.join(__dirname, 'images', 'sample-item.png');
const sampleBaseImage = path.join(__dirname, 'images', 'sample-base.png');

// 画像が存在する場合はBase64に変換
if (fs.existsSync(sampleItemImage)) {
  console.log('Item image Base64:');
  console.log(imageToBase64(sampleItemImage));
  console.log('\n');
}

if (fs.existsSync(sampleBaseImage)) {
  console.log('Base image Base64:');
  console.log(imageToBase64(sampleBaseImage));
  console.log('\n');
}

// APIテスト関数
async function testAPI(endpoint, data) {
  try {
    const response = await fetch(`http://localhost:8080${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log(`\n=== ${endpoint} ===`);
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(`Error testing ${endpoint}:`, error.message);
    return null;
  }
}

// テスト実行
async function runTests() {
  console.log('Starting API tests...\n');

  // Test 1: Analyze Item Image（サンプル画像が必要）
  // const analyzeResult = await testAPI('/api/analyze-item-image', {
  //   item_image: imageToBase64(sampleItemImage)
  // });

  // Test 2: Generate Prompt（Test 1の結果を使用）
  const promptResult = await testAPI('/api/generate-prompt', {
    'image-info': {
      species: 'owl',
      color: 'pink',
      expression: 'angry',
      style: 'pixel art',
      missing_part: 'lower body',
      caption: 'A pixel art illustration of a pink owl character with sharp eyes, showing only the upper body.'
    }
  });

  // Test 3: Generate Mask Image（サンプル画像が必要）
  // const maskResult = await testAPI('/api/generate-mask-image', {
  //   item_image: imageToBase64(sampleItemImage),
  //   missing_part: 'lower body'
  // });

  console.log('\nTests completed!');
}

// Node.js環境でfetchが利用できない場合の対処
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// テスト実行
runTests();
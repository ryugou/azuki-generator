// Test Generate Prompt API
async function testGeneratePrompt() {
  const testData = {
    'image-info': {
      species: 'owl',
      color: 'pink',
      expression: 'angry',
      style: 'pixel art',
      missing_part: 'lower body',
      caption: 'A pixel art illustration of a pink owl character with sharp eyes, showing only the upper body.'
    }
  };

  try {
    const response = await fetch('http://localhost:8080/api/generate-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Node.js環境でfetchが利用できない場合の対処
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testGeneratePrompt();
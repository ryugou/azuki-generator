const fs = require('fs');
const path = require('path');

// テスト用のサンプル画像を作成
// 実際のテストでは、プロジェクトのimagesフォルダにある画像を使用してください

// 画像をBase64に変換する関数
function imageToBase64(imagePath) {
  if (fs.existsSync(imagePath)) {
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString('base64');
  }
  return null;
}

// imagesディレクトリの画像を確認
const imagesDir = path.join(__dirname, 'images');
if (fs.existsSync(imagesDir)) {
  const files = fs.readdirSync(imagesDir);
  console.log('Available images in images directory:');
  files.forEach(file => {
    if (file.endsWith('.png') || file.endsWith('.jpg')) {
      console.log(`- ${file}`);
      const base64 = imageToBase64(path.join(imagesDir, file));
      if (base64) {
        console.log(`  Base64 length: ${base64.length}`);
        // Base64の最初の100文字を表示（確認用）
        console.log(`  Base64 preview: ${base64.substring(0, 100)}...`);
      }
    }
  });
} else {
  console.log('No images directory found');
}

// もし画像がない場合は、小さなテスト画像を作成
const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAaGVYSWZNTQAqAAAACAAEAQYAAwAAAAEAAgAAARIAAwAAAAEAAQAAASgAAwAAAAEAAgAAh2kABAAAAAEAAAA+AAAAAAADoAEAAwAAAAEAAQAAoAIABAAAAAEAAAAIoAMABAAAAAEAAAAIAAAAABMtWdoAAAGxaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA2LjAuMCI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIj4KICAgICAgICAgPHRpZmY6Q29tcHJlc3Npb24+MTwvdGlmZjpDb21wcmVzc2lvbj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPHRpZmY6WFJlc29sdXRpb24+NzI8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOllSZXNvbHV0aW9uPjcyPC90aWZmOllSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4K5W0vWwAAADxJREFUGBljZGBg+M9AAWBiIBFMCuBnYPj/n4GBgfE/AwODPwMDA8N/BgYGBkYGhn8gGgyI1UGyGpgBABlKB+hqgVBRAAAAAElFTkSuQmCC';

console.log('\nTest image Base64 (8x8 pink square):');
console.log(testImageBase64);
import { Router } from 'express';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// OpenAIクライアントは必要時に作成
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

router.post('/', async (req, res): Promise<any> => {
  try {
    const { base_image, mask_image, prompt } = req.body;

    if (!base_image) {
      return res.status(400).json({ error: 'base_image is required' });
    }

    if (!mask_image) {
      return res.status(400).json({ error: 'mask_image is required' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    console.log('=== DALL-E Image Edit API CALLED ===');
    console.log('Prompt:', prompt);

    // 一時ファイルとして保存
    const tempDir = '/tmp';
    const baseImagePath = path.join(tempDir, `base_${uuidv4()}.png`);
    const maskImagePath = path.join(tempDir, `mask_${uuidv4()}.png`);
    let debugImagePath: string | undefined;

    try {
      // Base64をBufferに変換
      const baseImageBuffer = Buffer.from(base_image, 'base64');
      const maskImageBuffer = Buffer.from(mask_image, 'base64');

      // マスク画像のメタデータを取得してsize-Aを決定
      const maskMetadata = await sharp(maskImageBuffer).metadata();
      const maskWidth = maskMetadata.width || 512;
      const maskHeight = maskMetadata.height || 512;

      // 元画像のメタデータを取得
      const baseMetadata = await sharp(baseImageBuffer).metadata();
      const originalWidth = baseMetadata.width || 512;
      const originalHeight = baseMetadata.height || 512;

      console.log(`Original image size: ${originalWidth}x${originalHeight}`);
      console.log(`Mask size (size-A): ${maskWidth}x${maskHeight}`);

      // 元画像をマスクサイズ（size-A）に拡張
      // 欠損部分は黒、非欠損部分は透明
      // 元画像の配置位置を計算（欠損方向に応じて）
      let offsetX = 0;
      let offsetY = 0;
      
      // マスクサイズから拡張方向を判定して配置位置を決定
      if (maskHeight > originalHeight && maskWidth < originalWidth * 1.5) {
        // 縦方向拡張 = 上下のいずれかが欠損
        offsetX = Math.floor((maskWidth - originalWidth) / 2); // 中央配置
        if (maskHeight > originalHeight * 1.4) {
          // 下方向拡張と判定
          offsetY = 0; // 上端配置
        } else {
          // 上方向拡張と判定  
          offsetY = maskHeight - originalHeight; // 下端配置
        }
      } else if (maskWidth > originalWidth && maskHeight < originalHeight * 1.5) {
        // 横方向拡張 = 左右のいずれかが欠損
        offsetY = Math.floor((maskHeight - originalHeight) / 2); // 中央配置
        if (maskWidth > originalWidth * 1.4) {
          // 右方向拡張と判定
          offsetX = 0; // 左端配置
        } else {
          // 左方向拡張と判定
          offsetX = maskWidth - originalWidth; // 右端配置
        }
      } else {
        // デフォルト：中央配置
        offsetX = Math.floor((maskWidth - originalWidth) / 2);
        offsetY = Math.floor((maskHeight - originalHeight) / 2);
      }

      // 透明背景で元画像を配置
      const expandedImageBuffer = await sharp({
        create: {
          width: maskWidth,
          height: maskHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }, // 透明
        },
      })
        .composite([{
          input: baseImageBuffer,
          left: offsetX,
          top: offsetY,
        }])
        .png()
        .toBuffer();

      // 拡張された画像とマスク画像をファイルに保存
      await fs.writeFile(baseImagePath, expandedImageBuffer);
      await fs.writeFile(maskImagePath, maskImageBuffer);

      if (process.env.NODE_ENV === 'development') {
        console.log(`Expanded image to ${maskWidth}x${maskHeight} with offset (${offsetX}, ${offsetY})`);
        
        // デバッグ: 入力されたbase_image（元画像）とexpanded_image（拡張後）を保存
        try {
          const debugInputPath = path.join(process.cwd(), `debug_input_item_${Date.now()}.png`);
          await fs.writeFile(debugInputPath, Buffer.from(base_image, 'base64'));
          console.log('Debug input item image saved to:', debugInputPath);

          await fs.mkdir('./tmp', { recursive: true });
          const debugExpandedPath = './tmp/expanded_image.png';
          await fs.writeFile(debugExpandedPath, expandedImageBuffer);
          console.log('Debug expanded image saved to:', debugExpandedPath);
        } catch (debugError) {
          console.warn('Debug file save failed:', debugError);
        }
      }

      // DALL-E Edit APIを呼び出し - toFileを使用
      const openai = getOpenAIClient();
      
      // OpenAI SDKのtoFileを使用してファイルオブジェクトを作成（MIMEタイプを明示的に指定）
      const imageFile = await toFile(fsSync.createReadStream(baseImagePath), 'image.png', {
        type: 'image/png'
      });
      const maskFile = await toFile(fsSync.createReadStream(maskImagePath), 'mask.png', {
        type: 'image/png'
      });
      
      const response = await openai.images.edit({
        image: imageFile,
        mask: maskFile,
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json',
      });

      const generatedImageBase64 = response.data?.[0]?.b64_json;

      if (!generatedImageBase64) {
        throw new Error('No image data in DALL-E response');
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('DALL-E Edit completed, returned image base64 length:', generatedImageBase64.length);

        // デバッグ: 生成された画像をローカルに保存（開発環境のみ）
        try {
          debugImagePath = path.join(process.cwd(), `debug_generated_${Date.now()}.png`);
          await fs.writeFile(debugImagePath, Buffer.from(generatedImageBase64, 'base64'));
          console.log('Debug image saved to:', debugImagePath);

          await fs.mkdir('./tmp', { recursive: true });
          const resultPath = './tmp/result.png';
          await fs.writeFile(resultPath, Buffer.from(generatedImageBase64, 'base64'));
          console.log('DALL-E generated image saved to:', resultPath);
        } catch (debugError) {
          console.warn('Debug file save failed:', debugError);
        }
      }

      // Base64をBufferに変換して画像として返す
      const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Image buffer length:', imageBuffer.length);
      }
      
      res.set('Content-Type', 'image/png');
      res.set('Content-Length', imageBuffer.length.toString());
      res.end(imageBuffer);
    } finally {
      // 一時ファイルを削除
      try {
        await fs.unlink(baseImagePath);
        await fs.unlink(maskImagePath);
        // デバッグファイルは削除しない（デバッグ用のため）
        // if (debugImagePath && fsSync.existsSync(debugImagePath)) {
        //   await fs.unlink(debugImagePath);
        // }
      } catch (err) {
        console.error('Failed to clean up temp files:', err);
      }
    }
  } catch (error) {
    console.error('DALL-E Edit API error:', error);
    
    // OpenAI APIエラーの場合
    if (error instanceof Error && 'status' in error) {
      return res.status(error.status as number || 500).json({ 
        error: error.message,
        details: 'error' in error ? error.error : undefined 
      });
    }
    
    // その他のエラー
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

export { router as generateItemImageRouter };
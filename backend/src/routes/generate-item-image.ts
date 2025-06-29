import { Router } from 'express';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
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
      // Base64をファイルに書き込み
      await fs.writeFile(baseImagePath, Buffer.from(base_image, 'base64'));
      await fs.writeFile(maskImagePath, Buffer.from(mask_image, 'base64'));

      // デバッグ: 入力されたbase_image（item画像）を保存
      const debugInputPath = path.join(process.cwd(), `debug_input_item_${Date.now()}.png`);
      await fs.writeFile(debugInputPath, Buffer.from(base_image, 'base64'));
      console.log('Debug input item image saved to:', debugInputPath);

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

      console.log('DALL-E Edit completed, returned image base64 length:', generatedImageBase64.length);

      // デバッグ: 生成された画像をローカルに保存（プロジェクトルートに保存）
      debugImagePath = path.join(process.cwd(), `debug_generated_${Date.now()}.png`);
      await fs.writeFile(debugImagePath, Buffer.from(generatedImageBase64, 'base64'));
      console.log('Debug image saved to:', debugImagePath);

      // デバッグ: 生成された画像を backend/tmp/result.png として保存（Dockerボリューム経由でローカルにアクセス可能）
      const resultPath = '/app/tmp/result.png';
      await fs.writeFile(resultPath, Buffer.from(generatedImageBase64, 'base64'));
      console.log('DALL-E generated image saved to:', resultPath);
      console.log('ローカルPCからは backend/tmp/result.png でアクセス可能');

      // Base64をBufferに変換して画像として返す
      const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
      console.log('Image buffer length:', imageBuffer.length);
      
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
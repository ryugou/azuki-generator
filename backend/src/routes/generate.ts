import { Router } from 'express';
import sharp from 'sharp';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const storage = new Storage();

router.post('/', async (req, res, next): Promise<any> => {
  try {
    const { base_image, item_image, position } = req.body;

    if (!base_image) {
      return res.status(400).json({ error: 'base_image is required' });
    }

    if (!item_image) {
      return res.status(400).json({ error: 'item_image is required' });
    }

    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
      return res.status(400).json({ error: 'position with x and y coordinates is required' });
    }

    console.log('=== Image Composition ===');
    console.log('Position:', position);

    // Base64をBufferに変換
    const baseBuffer = Buffer.from(base_image, 'base64');
    const itemBuffer = Buffer.from(item_image, 'base64');

    // Base画像のメタデータ取得
    const baseMetadata = await sharp(baseBuffer).metadata();
    const baseWidth = baseMetadata.width || 1000;
    const baseHeight = baseMetadata.height || 1000;

    // Item画像のメタデータ取得
    const itemMetadata = await sharp(itemBuffer).metadata();
    const itemWidth = itemMetadata.width || 256;
    const itemHeight = itemMetadata.height || 256;

    // Base画像の1/4サイズに縮小
    const targetSize = Math.min(baseWidth, baseHeight) / 4;
    const scaleFactor = targetSize / Math.max(itemWidth, itemHeight);
    const resizedWidth = Math.round(itemWidth * scaleFactor);
    const resizedHeight = Math.round(itemHeight * scaleFactor);

    console.log(`Resizing item from ${itemWidth}x${itemHeight} to ${resizedWidth}x${resizedHeight}`);

    // Item画像をリサイズ
    const resizedItemBuffer = await sharp(itemBuffer)
      .resize(resizedWidth, resizedHeight, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // 透明背景
      })
      .png()
      .toBuffer();

    // 合成
    const composedBuffer = await sharp(baseBuffer)
      .composite([
        {
          input: resizedItemBuffer,
          left: Math.round(position.x),
          top: Math.round(position.y),
        },
      ])
      .png()
      .toBuffer();

    // 一時的な開発環境対応: Base64で返す
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Returning base64 image');
      const base64Image = `data:image/png;base64,${composedBuffer.toString('base64')}`;
      res.json({ result_image: base64Image });
      return;
    }

    // GCSにアップロード（本番環境）
    console.log('Uploading to GCS...');
    const bucketName = process.env.GCS_BUCKET_NAME || 'azuki-generator-images';
    const bucket = storage.bucket(bucketName);
    
    // ファイル名を生成
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const fileName = `output/${dateStr}/${uuidv4()}.png`;
    
    const file = bucket.file(fileName);
    
    // アップロード
    await file.save(composedBuffer, {
      metadata: {
        contentType: 'image/png',
      },
      public: true, // 公開設定
    });

    // 公開URLを生成
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    
    console.log('Image uploaded to GCS:', publicUrl);

    res.json({ result_image: publicUrl });
  } catch (error) {
    console.error('Image composition error:', error);
    next(error);
  }
});

export { router as generateRouter };
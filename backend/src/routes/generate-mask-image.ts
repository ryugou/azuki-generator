import { Router } from 'express';
import sharp from 'sharp';
import fs from 'fs/promises';

const router = Router();

router.post('/', async (req, res, next): Promise<any> => {
  try {
    const { item_image, missing_part } = req.body;

    if (!item_image) {
      return res.status(400).json({ error: 'item_image is required' });
    }

    if (!missing_part) {
      return res.status(400).json({ error: 'missing_part is required' });
    }

    // Base64をBufferに変換
    const imageBuffer = Buffer.from(item_image, 'base64');

    // 画像のメタデータを取得
    const metadata = await sharp(imageBuffer).metadata();
    const originalWidth = metadata.width || 512;
    const originalHeight = metadata.height || 512;

    // 補完方向に応じて拡張してsize-Aを計算
    let expandedWidth = originalWidth;
    let expandedHeight = originalHeight;

    if (missing_part === 'lower body') {
      // 下方向に1.5倍、左右に1.25倍
      expandedWidth = Math.floor(originalWidth * 1.25);
      expandedHeight = Math.floor(originalHeight * 1.5);
    } else if (missing_part === 'upper body') {
      // 上方向に1.5倍、左右に1.25倍
      expandedWidth = Math.floor(originalWidth * 1.25);
      expandedHeight = Math.floor(originalHeight * 1.5);
    } else if (missing_part === 'left body') {
      // 左方向に1.5倍、上下に1.25倍
      expandedWidth = Math.floor(originalWidth * 1.5);
      expandedHeight = Math.floor(originalHeight * 1.25);
    } else if (missing_part === 'right body') {
      // 右方向に1.5倍、上下に1.25倍
      expandedWidth = Math.floor(originalWidth * 1.5);
      expandedHeight = Math.floor(originalHeight * 1.25);
    }

    let maskBuffer: Buffer;

    if (missing_part === 'none') {
      // 欠損なしの場合は拡張サイズで全部黒（補完しない）
      maskBuffer = await sharp({
        create: {
          width: expandedWidth,
          height: expandedHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 255 }, // 黒
        },
      })
        .png()
        .toBuffer();
    } else {
      // マスク画像の生成（size-A）
      let whiteRects: sharp.OverlayOptions[] = [];

      if (missing_part === 'lower body') {
        // 下の拡張部分のみ白
        const whiteRect = await sharp({
          create: {
            width: expandedWidth,
            height: expandedHeight - originalHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 255 }, // 白
          },
        })
          .png()
          .toBuffer();

        whiteRects = [
          {
            input: whiteRect,
            top: originalHeight,
            left: 0,
          },
        ];
      } else if (missing_part === 'upper body') {
        // 上の拡張部分のみ白
        const whiteRect = await sharp({
          create: {
            width: expandedWidth,
            height: expandedHeight - originalHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 255 }, // 白
          },
        })
          .png()
          .toBuffer();

        whiteRects = [
          {
            input: whiteRect,
            top: 0,
            left: 0,
          },
        ];
      } else if (missing_part === 'left body') {
        // 左の拡張部分のみ白
        const whiteRect = await sharp({
          create: {
            width: expandedWidth - originalWidth,
            height: expandedHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 255 }, // 白
          },
        })
          .png()
          .toBuffer();

        whiteRects = [
          {
            input: whiteRect,
            top: 0,
            left: 0,
          },
        ];
      } else if (missing_part === 'right body') {
        // 右の拡張部分のみ白
        const whiteRect = await sharp({
          create: {
            width: expandedWidth - originalWidth,
            height: expandedHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 255 }, // 白
          },
        })
          .png()
          .toBuffer();

        whiteRects = [
          {
            input: whiteRect,
            top: 0,
            left: originalWidth,
          },
        ];
      }

      // 黒い背景（size-A）を作成して、白い矩形を合成
      maskBuffer = await sharp({
        create: {
          width: expandedWidth,
          height: expandedHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 255 }, // 黒
        },
      })
        .composite(whiteRects)
        .png()
        .toBuffer();
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`Generated mask for missing_part: ${missing_part}`);
      console.log(`Original size: ${originalWidth}x${originalHeight}, Expanded size: ${expandedWidth}x${expandedHeight}`);
      console.log('Mask buffer length:', maskBuffer.length);

      // デバッグ: マスク画像を backend/tmp/mask.png として保存（開発環境のみ）
      try {
        const maskPath = './tmp/mask.png';
        await fs.mkdir('./tmp', { recursive: true });
        await fs.writeFile(maskPath, maskBuffer);
        console.log('Mask image saved to:', maskPath);
      } catch (debugError) {
        console.warn('Debug file save failed:', debugError);
      }
    }

    // 画像として直接レスポンス（CORS設定を一時的に変更、圧縮無効化）
    res.set({
      'Content-Type': 'image/png',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'false',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.removeHeader('Content-Encoding');
    res.end(maskBuffer);
  } catch (error) {
    next(error);
  }
});

export { router as generateMaskImageRouter };
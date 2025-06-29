import { Router } from 'express';
import sharp from 'sharp';

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
    const width = metadata.width || 512;
    const height = metadata.height || 512;

    let maskBuffer: Buffer;

    if (missing_part === 'none') {
      // 欠損なしの場合は全部黒（補完しない）
      maskBuffer = await sharp({
        create: {
          width,
          height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 255 }, // 黒
        },
      })
        .png()
        .toBuffer();
    } else {
      // マスク画像の生成
      let compositeData: sharp.OverlayOptions[] = [];

      if (missing_part === 'lower body') {
        // 下半身が欠損 = 縦の中央から下を白で塗る
        const whiteRect = await sharp({
          create: {
            width,
            height: Math.floor(height / 2),
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 255 }, // 白
          },
        })
          .png()
          .toBuffer();

        compositeData = [
          {
            input: whiteRect,
            top: Math.floor(height / 2),
            left: 0,
          },
        ];
      } else if (missing_part === 'upper body') {
        // 上半身が欠損 = 上端から縦の中央までを白で塗る
        const whiteRect = await sharp({
          create: {
            width,
            height: Math.floor(height / 2),
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 255 }, // 白
          },
        })
          .png()
          .toBuffer();

        compositeData = [
          {
            input: whiteRect,
            top: 0,
            left: 0,
          },
        ];
      }

      // 黒い背景を作成して、白い矩形を合成
      maskBuffer = await sharp({
        create: {
          width,
          height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 255 }, // 黒
        },
      })
        .composite(compositeData)
        .png()
        .toBuffer();
    }

    console.log(`Generated mask for missing_part: ${missing_part}, size: ${width}x${height}`);

    // 画像として直接レスポンス
    res.set('Content-Type', 'image/png');
    res.send(maskBuffer);
  } catch (error) {
    next(error);
  }
});

export { router as generateMaskImageRouter };
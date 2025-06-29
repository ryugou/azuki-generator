import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const execAsync = promisify(exec);

router.post('/', async (req, res, next): Promise<any> => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'image is required' });
    }

    console.log('=== Background Removal with rembg ===');

    // 一時ファイルのパス
    const tempDir = '/tmp';
    const inputPath = path.join(tempDir, `input_${uuidv4()}.png`);
    const outputPath = path.join(tempDir, `output_${uuidv4()}.png`);

    try {
      // Base64をファイルに書き込み
      await fs.writeFile(inputPath, Buffer.from(image, 'base64'));

      // rembgコマンドを実行
      const command = `rembg i "${inputPath}" "${outputPath}"`;
      console.log('Executing:', command);

      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stderr.includes('INFO')) {
        console.error('rembg stderr:', stderr);
      }

      if (stdout) {
        console.log('rembg stdout:', stdout);
      }

      // 出力ファイルの存在確認
      try {
        await fs.access(outputPath);
      } catch {
        throw new Error('rembg failed to create output file');
      }

      // 出力ファイルを読み込んで画像として返す
      const outputBuffer = await fs.readFile(outputPath);

      console.log('Background removal completed, output size:', outputBuffer.length);

      // 画像として直接レスポンス
      res.set('Content-Type', 'image/png');
      res.send(outputBuffer);
    } finally {
      // 一時ファイルを削除
      try {
        await fs.unlink(inputPath);
        await fs.unlink(outputPath);
      } catch (err) {
        console.error('Failed to clean up temp files:', err);
      }
    }
  } catch (error) {
    console.error('Background removal error:', error);
    next(error);
  }
});

export { router as removeBackgroundRouter };
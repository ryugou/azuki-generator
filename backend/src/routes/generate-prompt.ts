import { Router } from 'express';

const router = Router();

interface ImageInfo {
  species: string;
  color: string;
  expression: string;
  style: string;
  missing_part: string;
  caption: string;
}

interface GeneratePromptRequest {
  'image-info': ImageInfo;
}

router.post('/', async (req, res, next): Promise<any> => {
  try {
    const requestBody = req.body as GeneratePromptRequest;
    const imageInfo = requestBody['image-info'];

    if (!imageInfo) {
      return res.status(400).json({ error: 'image-info is required' });
    }

    const { style, color, species, expression, missing_part } = imageInfo;

    // expression部分の生成（neutralの場合は空文字）
    const expressionPart = expression === 'neutral' ? '' : ` with ${expression} expression`;

    // 表示部位の判定
    let showingPart = '';
    if (missing_part === 'lower body') {
      showingPart = 'upper body';
    } else if (missing_part === 'upper body') {
      showingPart = 'lower body';
    }

    // プロンプトの生成
    let prompt = '';
    if (missing_part && missing_part !== 'none') {
      prompt = `A ${style} illustration of a ${color} ${species} character${expressionPart}, currently only showing the ${showingPart}. Please complete the missing ${missing_part} naturally while preserving the style, color, and expression.`;
    } else {
      // 欠損がない場合は、背景除去のみのプロンプト
      prompt = `A ${style} illustration of a ${color} ${species} character${expressionPart} with transparent background.`;
    }

    console.log('Generated DALL-E prompt:', prompt);

    res.json({ prompt });
  } catch (error) {
    next(error);
  }
});

export { router as generatePromptRouter };
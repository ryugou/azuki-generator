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
  model: string;
}

router.post('/', async (req, res, next): Promise<any> => {
  try {
    const requestBody = req.body as GeneratePromptRequest;
    const imageInfo = requestBody['image-info'];
    const model = requestBody.model || 'dalle';

    console.log('Received model parameter:', model);

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

    let prompt = '';
    
    // モデル別にプロンプトを生成
    if (model.startsWith('huggingface-')) {
      // HuggingFace系はマスクが使えないため、全体再生成用のプロンプト
      if (missing_part && missing_part !== 'none') {
        prompt = `A complete ${style} illustration of a ${color} ${species} character${expressionPart}, full body, clear details, centered composition`;
      } else {
        prompt = `A ${style} illustration of a ${color} ${species} character${expressionPart}, clear and detailed`;
      }
    } else if (model === 'replicate') {
      // Replicate (Stable Diffusion) 用のプロンプト
      if (missing_part && missing_part !== 'none') {
        prompt = `A ${style} digital art of a ${color} ${species} character${expressionPart}, complete ${missing_part}, seamless inpainting, high quality, detailed`;
      } else {
        prompt = `A ${style} digital art of a ${color} ${species} character${expressionPart}, transparent background, high quality`;
      }
    } else {
      // DALL-E用のプロンプト（従来のまま）
      if (missing_part && missing_part !== 'none') {
        prompt = `A ${style} illustration of a ${color} ${species} character${expressionPart}, currently only showing the ${showingPart}. Please complete the missing ${missing_part} naturally while preserving the style, color, and expression.`;
      } else {
        prompt = `A ${style} illustration of a ${color} ${species} character${expressionPart} with transparent background.`;
      }
    }

    console.log(`Generated ${model} prompt:`, prompt);

    res.json({ prompt });
  } catch (error) {
    next(error);
  }
});

export { router as generatePromptRouter };

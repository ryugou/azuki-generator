import { Router } from 'express';
import OpenAI from 'openai';

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

interface AnalyzeResponse {
  species: string;
  color: string;
  expression: string;
  style: string;
  missing_part: string;
  caption: string;
}

router.post('/', async (req, res, next): Promise<any> => {
  try {
    const { item_image } = req.body;

    if (!item_image) {
      return res.status(400).json({ error: 'item_image is required' });
    }

    // GPT-4o Vision APIへのプロンプト
    const prompt = `次の画像を見て、以下の 5 つの情報を JSON 形式で抽出してください：

1. キャラクターの種別（例: owl, cat, dragon などの動物名または humanoid など）
2. 支配的な色（例: pink, blue, red などの基本色）
3. 表情（例: angry, smiling, neutral など）
4. スタイル（例: pixel art, hand-drawn, realistic など）
5. 欠損している部位（例: lower body, upper body, none）

加えて、上記の情報を要約した英語の 1 文キャプションも返してください。

出力は以下の形式で、**必ず JSON 構造**として返してください：

{
"species": "...",
"color": "...",
"expression": "...",
"style": "...",
"missing_part": "...",
"caption": "..."
}

以下は、レスポンスの例です

{
  "species": "owl",
  "color": "pink",
  "expression": "angry",
  "style": "pixel art",
  "missing_part": "lower body",
  "caption": "A pixel art illustration of a pink owl character with sharp eyes, showing only the upper body."
}`;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${item_image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content in GPT-4o response');
    }

    // JSONをパース
    let result: AnalyzeResponse;
    try {
      // コードブロックがある場合は削除
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse GPT-4o response:', content);
      throw new Error('Failed to parse GPT-4o response as JSON');
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('GPT-4o analysis result:', result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export { router as analyzeItemImageRouter };
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API client on server
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API Endpoint: Analyze and Segment Chinese Text using Gemini 3.6 Flash
app.post('/api/analyze-article', async (req, res) => {
  try {
    const { text, title } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text content is required' });
      return;
    }

    const ai = getAiClient();

    const prompt = `請分析以下中文文本，進行精準的中文分詞、漢語拼音標註（含聲調符號，如 xiǎo míng）、中文解釋、英文翻譯與造句（含造句拼音）。

文章標題: ${title || '未命名'}
文章內容:
${text}

請將內容完整拆解為連續的詞語與標點符號數組，確保詞語拼接後能完美重構原文。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction: `你是一位專業的繁體華語文教學專家與語言學家。你的任務是將輸入的中文文章拆解為適合語言學習者閱讀的分詞列表，並為每一個詞語提供完整的字典釋義資料。
要求：
1. 完整保留原文順序，包含標點符號。
2. 對於標點符號（如：，。！？「」），設定 isPunctuation 為 true，其餘 pinyin、explanation、english、example、examplePinyin 均填入空字串 ""。
3. 對於所有中文詞語（isPunctuation 為 false），你必須自動生成：
   - text: 詞語（繁體中文，如：兔子、爬得很慢、比賽）
   - pinyin: 正確帶聲調符號的漢語拼音（如：tù zi, pá de hěn màn）
   - explanation: 適合華語學習者的簡明中文解釋（如：一種長耳朵、短尾巴的可愛小動物）
   - english: 精準英文翻譯（如：rabbit / hare）
   - example: 實用的中文例句/造句（如：小兔子在草地上快樂地跳躍。）
   - examplePinyin: 造句帶聲調符號的漢語拼音（如：Xiǎo tù zi zài cǎo dì shàng kuài lè de tiào yuè.）
4. 必須確保「每一個」中文詞語都有拼音、英文翻譯、中文解釋與造句，不可留空。
5. 生成 titlePinyin 為標題的漢語拼音，並且建議一個適當的閱讀難度 level（初級、中級、高級）。`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titlePinyin: { type: Type.STRING, description: '標題的漢語拼音' },
            level: { type: Type.STRING, description: '閱讀等級：初級, 中級, 高級' },
            category: { type: Type.STRING, description: '文章分類（如：寓言故事、生活美文、成語故事）' },
            words: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: '詞語或標點符號' },
                  pinyin: { type: Type.STRING, description: '漢語拼音，含聲調' },
                  explanation: { type: Type.STRING, description: '中文解釋' },
                  english: { type: Type.STRING, description: '英文翻譯' },
                  example: { type: Type.STRING, description: '造句例句' },
                  examplePinyin: { type: Type.STRING, description: '造句拼音' },
                  isPunctuation: { type: Type.BOOLEAN, description: '是否為標點符號' },
                },
                required: ['text', 'pinyin', 'explanation', 'english', 'example', 'examplePinyin', 'isPunctuation'],
              },
            },
          },
          required: ['words'],
        },
      },
    });

    const jsonText = response.text || '{}';
    const result = JSON.parse(jsonText);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error analyzing article with Gemini:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze article with AI',
    });
  }
});

// API Endpoint: Generate Detail for a Single Word
app.post('/api/generate-word-detail', async (req, res) => {
  try {
    const { word, context } = req.body;
    if (!word) {
      res.status(400).json({ error: 'Word is required' });
      return;
    }

    const ai = getAiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `請為中文詞語「${word}」提供詳細的語言學習辭典資料。上下文參考：${context || '無'}`,
      config: {
        systemInstruction: `你是一位華語教學權威。請輸出繁體中文詞語字典資料，包含帶聲調的漢語拼音（如 xiǎo míng）、生動簡明中文解釋、英文翻譯、以及含拼音的造句例句。`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            pinyin: { type: Type.STRING, description: '帶聲調符號的漢語拼音' },
            explanation: { type: Type.STRING, description: '中文解釋' },
            english: { type: Type.STRING, description: '英文翻譯' },
            example: { type: Type.STRING, description: '造句' },
            examplePinyin: { type: Type.STRING, description: '造句漢語拼音' },
          },
          required: ['word', 'pinyin', 'explanation', 'english', 'example', 'examplePinyin'],
        },
      },
    });

    const jsonText = response.text || '{}';
    const result = JSON.parse(jsonText);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error generating word detail:', error);
    res.status(500).json({ error: error.message || 'Failed to generate word detail' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

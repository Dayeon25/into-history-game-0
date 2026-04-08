import { GoogleGenAI } from "@google/genai";
import { Character, Message } from "../types";

// Helper to get AI instance lazily to avoid top-level failures if key is missing
let aiInstance: any = null;
const getAI = () => {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'undefined' || key === 'MY_GEMINI_API_KEY' || !key.trim()) {
      throw new Error("GEMINI_API_KEY가 설정되지 않았습니다. Vercel 프로젝트 설정에서 Environment Variables를 확인하고 다시 배포해주세요.");
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
};

export async function generateHistoricalResponse(
  character: Character,
  history: Message[],
  userInput: string
) {
  const ai = getAI();
  const systemInstruction = `
    당신은 역사 역할 놀이 게임의 마스터이자 상대 캐릭터입니다.
    사용자의 캐릭터 정보:
    - 이름: ${character.name}
    - 성별: ${character.gender === 'male' ? '남성' : character.gender === 'female' ? '여성' : '기타'}
    - 시대: ${character.era}
    - 역할: ${character.role}
    - 특징: ${character.traits.join(', ')}
    - 설명: ${character.description}

    규칙:
    1. 당신은 해당 시대에 맞는 역사적 인물(또는 가상 인물)이 되어 대화하세요.
    2. 시대적 배경, 말투, 지식을 철저히 지키세요.
    3. 사용자의 행동에 반응하고, 대화를 이어갈 수 있는 질문이나 상황을 제시하세요.
    4. 한국어로 대화하세요.
    5. 너무 길지 않게, 몰입감을 줄 수 있도록 묘사와 대화를 섞어서 작성하세요.
    6. 마크다운 형식을 사용하여 대화는 " "로, 행동이나 묘사는 * *로 표시하세요.
  `;

  try {
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    contents.push({
      role: 'user',
      parts: [{ text: userInput }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction,
      }
    });

    if (!response.text) {
      throw new Error("AI가 응답을 생성하지 못했습니다. (Empty response)");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    throw new Error(error.message || "AI 대화 중 오류가 발생했습니다.");
  }
}

export async function generateCharacterImage(character: Character) {
  try {
    const ai = getAI();
    const prompt = `
      A high-quality, detailed historical portrait of a character.
      Gender: ${character.gender === 'male' ? 'male' : character.gender === 'female' ? 'female' : 'androgynous'}
      Era: ${character.era}
      Role: ${character.role}
      Traits: ${character.traits.join(', ')}
      Description: ${character.description}
      Style: Cinematic historical painting, realistic, atmospheric lighting.
      The character should be the central focus.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation service error:", error);
    return null;
  }
}

import { GoogleGenAI } from "@google/genai";
import { Character, Message } from "../types";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing. Please set it in your environment variables.");
  }
  return new GoogleGenAI({ apiKey: apiKey || "" });
};

const ai = getAI();

export async function generateHistoricalResponse(
  character: Character,
  history: Message[],
  userInput: string
) {
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
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction,
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }))
    });

    const result = await chat.sendMessage({
      message: userInput
    });

    return result.text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
}

export async function generateCharacterImage(character: Character) {
  const prompt = `
    A professional, high-quality historical portrait of a single person.
    Gender: ${character.gender === 'male' ? 'male' : character.gender === 'female' ? 'female' : 'androgynous'}
    Era: ${character.era}
    Role: ${character.role}
    Traits: ${character.traits.join(', ')}
    Description: ${character.description}
    Visual Style: Cinematic historical painting, realistic, atmospheric lighting, detailed facial features.
    Composition: Close-up portrait, head and shoulders, looking at camera.
    The character should be the central focus. No text, no frames.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
  }
  return null;
}

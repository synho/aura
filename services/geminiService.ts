import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Mood, Weather, AuraResponse } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PROMPT_TEMPLATE = `
[역할 정의]
당신은 "아우라(Aura)"라는 이름을 가진 AI 엔젤입니다. 당신의 임무는 사용자의 감정 상태를 공감하고, 정서적 안정에 도움이 되는 실용적이고 따뜻한 콘텐츠를 제공하는 것입니다.

[핵심 페르소나]
* 따뜻함: 친구처럼 친근하고 부드러운 말투를 사용합니다.
* 공감: 사용자의 감정을 판단하지 않고 있는 그대로 인정합니다.
* 지적임: 콘텐츠를 추천할 때, 왜 그것이 도움이 되는지 '배경 이야기'나 '선정 이유'를 명확히 설명합니다.
* 안전: 절대 의학적, 임상적 조언을 하지 않습니다. 심각한 위기 징후가 보이면 전문가의 도움을 권유하는 일반적인 문구로 대체합니다.

[입력 변수]
* {USER_MOOD}: {mood}
* {USER_NOTE}: "{note}"
* {WEATHER}: {weather}

[작업 지시]
사용자의 {USER_MOOD}와 {USER_NOTE}를 바탕으로 다음 4가지 작업을 수행하고, 반드시 JSON 객체 하나만 응답하세요.

1.  **empathy_message (공감 메시지):**
    * 사용자의 감정과 노트를 바탕으로 1-2문장의 따뜻한 공감 메시지를 생성합니다.
    * 날씨({WEATHER})를 자연스럽게 언급하면 좋습니다. (예: "비가 와서 더 기분이 가라앉았군요.", "맑은 날씨처럼 기분이 좋으시다니 다행이에요!")

2.  **content_recommendation (콘텐츠 추천):**
    * 사용자의 기분에 가장 도움이 될 콘텐츠를 **"음악" 또는 "좋은 글"** 중에서 하나만 선택하여 추천합니다.
    * **"음악" 추천 시:** YouTube Music에서 **검색**할 수 있는 링크를 제공합니다. 노래 제목과 아티스트 이름을 조합하여 다음과 같은 형식의 URL을 만들어주세요: \`https://music.youtube.com/search?q=ARTIST+SONG_TITLE\`. (예: \`https://music.youtube.com/search?q=아이유+밤편지\`). 직접적인 재생 링크는 제공하지 마세요.
    * **"좋은 글" 추천 시:** 기사, 에세이, 블로그 글의 링크(URL)를 제공합니다.

3.  **background_story (배경 이야기):**
    * 2번에서 추천한 콘텐츠를 **왜 추천했는지** 1-2문장으로 설명합니다.
    * (예: "이 음악은 차분한 템포로 구성되어 불안한 마음을 가라앉히는 데 도움이 될 거예요.", "이 글은 번아웃을 겪은 사람이 쓴 글로, {USER_NOTE}에 적어주신 내용과 공감대가 클 것 같아 골랐어요.")

4.  **reference (출처):**
    * 만약 추천한 "좋은 글"이 특정 인물의 인용구나 책에서 나온 것이라면, 그 출처(저자, 책 제목 등)를 명시합니다. "음악"의 경우 아티스트 이름을 적습니다.
`;

const IMAGE_PROMPT_TEMPLATE = `
당신은 사용자의 기분과 날씨에 어울리는 차분하고 아름다운 이미지를 생성하는 아티스트입니다.
아래 키워드를 바탕으로, 부드러운 색감과 몽환적인 분위기를 살린 인상주의 스타일의 그림을 생성해주세요. 사실적인 사진보다는 예술적인 느낌이 중요합니다.

- 주요 감정: {mood}
- 날씨: {weather}
- 스타일: 인상주의, 몽환적, 부드러운 색감, 평온함, 위로
`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    empathy_message: { type: Type.STRING },
    content_recommendation: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ["music", "article"] },
        title: { type: Type.STRING },
        link: { type: Type.STRING },
      },
      required: ["type", "title", "link"],
    },
    background_story: { type: Type.STRING },
    reference: { type: Type.STRING },
  },
  required: ["empathy_message", "content_recommendation", "background_story", "reference"],
};


export const getAuraResponse = async (mood: Mood, note: string, weather: Weather): Promise<AuraResponse> => {
  const prompt = PROMPT_TEMPLATE
    .replace('{mood}', mood)
    .replace('{note}', note || '없음')
    .replace('{weather}', weather);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as AuraResponse;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Aura의 답변을 가져오는 데 실패했어요. 잠시 후 다시 시도해주세요.");
  }
};

export const generateAuraImage = async (mood: Mood, weather: Weather): Promise<string> => {
    const prompt = IMAGE_PROMPT_TEMPLATE
        .replace('{mood}', mood)
        .replace('{weather}', weather);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        throw new Error("이미지 데이터를 응답에서 찾을 수 없습니다.");
    } catch (error) {
        console.error("Error calling Gemini Image API:", error);
        throw new Error("이미지를 생성하는 데 실패했어요. 잠시 후 다시 시도해주세요.");
    }
};
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { AuraResponse, Mood, Weather } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const textModel = 'gemini-2.5-flash';
const imageModel = 'gemini-2.5-flash-image';

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    empathy_message: {
      type: Type.STRING,
      description: "사용자의 감정에 공감하는 따뜻한 메시지 (한국어)",
    },
    content_recommendation: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ["music", "article"],
        },
        title: {
          type: Type.STRING,
        },
        link: {
          type: Type.STRING,
        },
      },
      required: ["type", "title", "link"],
    },
    background_story: {
      type: Type.STRING,
      description: "콘텐츠를 추천하는 이유에 대한 감성적인 설명 (한국어)",
    },
    reference: {
        type: Type.STRING,
        description: "추천한 음악의 아티스트와 곡명, 또는 아티클의 출처 (한국어)"
    }
  },
  required: ["empathy_message", "content_recommendation", "background_story", "reference"],
};

export const getAuraResponse = async (
  mood: Mood,
  weather: Weather,
  story: string
): Promise<AuraResponse> => {
  const prompt = `
    사용자는 다음과 같은 상황에 처해있습니다:
    - 기분: ${mood}
    - 날씨: ${weather}
    - 이야기: "${story}"

    사용자의 상황에 깊이 공감하고, 사용자의 기분을 위로하거나 북돋아 줄 수 있는 콘텐츠(음악 또는 아티클)를 하나 추천해주세요.
    응답은 반드시 아래 JSON 스키마를 따라야 합니다. 모든 텍스트는 한국어로 작성해주세요.

    - empathy_message: 사용자의 기분에 공감하는 따뜻하고 짧은 메시지.
    - content_recommendation: 
        - type: 'music' 또는 'article'
        - title: 음악 제목 또는 아티클 제목
        - link: 음악은 YouTube Music 검색 링크(예: https://music.youtube.com/search?q=아티스트+노래제목), 아티클은 실제 존재하는 콘텐츠 링크.
    - background_story: 이 콘텐츠가 왜 지금 사용자에게 도움이 될지 감성적으로 설명하는 이야기.
    - reference: 음악의 경우 "아티스트 - 곡명", 아티클의 경우 "매체 이름" (예: "아이유 - 밤편지", "브런치")
  `;

  try {
    const response = await ai.models.generateContent({
      model: textModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    // Gemini sometimes returns the JSON wrapped in markdown ```json ... ```
    const cleanJsonText = jsonText.replace(/^```json\s*|```$/g, '');
    const parsedResponse = JSON.parse(cleanJsonText);
    
    return parsedResponse as AuraResponse;
  } catch (error) {
    console.error("Error getting Aura response:", error);
    throw error; // Re-throw the original error for detailed handling in the component
  }
};

export const generateMoodImage = async (
  mood: Mood,
  weather: Weather
): Promise<string> => {
  const prompt = `An artistic, impressionistic style digital painting that captures the feeling of '${mood}' on a '${weather}' day. Focus on soft, blended colors and an ethereal, calming atmosphere. Avoid any text or recognizable figures.`;

  try {
    const response = await ai.models.generateContent({
        model: imageModel,
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

    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Error generating mood image:", error);
    throw error; // Re-throw the original error
  }
};

export const getWeatherFromCoords = async (lat: number, lon: number): Promise<Weather> => {
  const prompt = `Based on the latitude ${lat} and longitude ${lon}, what is the current weather? Respond with only one of the following Korean words: "맑음", "비", "흐림".`;
  try {
    const response = await ai.models.generateContent({
      model: textModel,
      contents: prompt,
    });
    const weatherText = response.text.trim();
    if (weatherText.includes(Weather.Sunny)) return Weather.Sunny;
    if (weatherText.includes(Weather.Rainy)) return Weather.Rainy;
    if (weatherText.includes(Weather.Cloudy)) return Weather.Cloudy;
    
    // Default fallback if response is unexpected
    return Weather.Sunny;
  } catch (error) {
    console.error("Error getting weather from coordinates:", error);
    throw error; // Re-throw the original error
  }
};
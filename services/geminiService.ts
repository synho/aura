import { GoogleGenAI, Modality, Type } from "@google/genai";
import { AuraResponse, Gender, Mood, Weather, AuraAnalysis } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const liteModel = 'gemini-flash-lite-latest';
const textModel = 'gemini-2.5-flash';
const imageModel = 'gemini-2.5-flash-image';
const multimodalModel = 'gemini-2.5-pro';

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    empathy_message: {
      type: Type.STRING,
      description: "A concise, powerful, and insightful message (1-2 sentences) that validates the user's feelings with warmth and a touch of wit, without being generic. It should feel personal and validating.",
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
          description: "Title of the content."
        },
        link: {
          type: Type.STRING,
          description: "For music, construct a URL-encoded search query link for YouTube Music (e.g., https://music.youtube.com/search?q=...). For articles, provide the direct URL.",
        },
      },
      required: ["type", "title", "link"],
    },
    background_story: {
      type: Type.STRING,
      description: "A concise and powerful rationale (2-3 sentences) explaining *why* this specific content is a perfect match. Frame it as a thoughtful, almost magical connection you've made for them. Focus on the practical and emotional benefit, with a hint of your charming personality.",
    },
    reference: {
        type: Type.STRING,
        description: "For music, the artist and song title, in its original language if applicable (e.g., '아이유 - 밤편지'). For articles, the source or publication (in English)."
    },
    angelic_task: {
        type: Type.STRING,
        description: "A simple, gentle, and actionable micro-task (1-2 sentences) tailored to the user's mood and situation. It should be something they can do right now to feel a little more grounded, mindful, or connected. Frame it as a kind, encouraging suggestion from a friend.",
    },
  },
  required: ["empathy_message", "content_recommendation", "background_story", "reference", "angelic_task"],
};

export const getAuraResponse = async (
  mood: Mood,
  weather: Weather,
  story: string,
  coords: {lat: number; lng: number} | null,
  analysis: AuraAnalysis | null,
  age?: number,
  gender?: Gender,
): Promise<AuraResponse> => {
  let prompt = `
    You are Aura, an AI Angel. Your personality is that of a wise, caring friend with a gentle sense of humor. You are deeply empathetic but never sappy. You find the perfect balance between warmth and wit, making the user feel understood and a little bit amused.
    The user's story might be in English, Korean, or a mix of both. Your entire response must be in English.

    The user is in the following situation:
    - Mood: ${mood}
    - Weather: ${weather}
    - Story: "${story}"
  `;

  if (age) {
    prompt += `
    - Age (self-reported): ${age}`;
  }
  if (gender && gender !== Gender.PreferNotToSay) {
    prompt += `
    - Gender (self-reported): ${gender}`;
  }
  if (coords) {
    prompt += `
    - Location: Latitude ${coords.lat}, Longitude ${coords.lng}`;
  }
  if (analysis) {
    prompt += `
    
    Additionally, I performed a voice and story analysis with these witty observations:
    - Predicted Age Guessed As: "${analysis.predicted_age}"
    - Predicted Gender Vibe: "${analysis.predicted_gender}"
    - Insightful Comment on mood: "${analysis.mood_discrepancy_comment || 'The user seems in tune with their feelings.'}"
    `;
  }

  prompt += `

    Based on a holistic analysis of all this information (mood, weather, story, location, and voice analysis), generate a response that strictly follows the JSON schema. All text must be in English.
    Your primary goal is to find the *perfect* song for this user, at this moment. The song can be from any country or genre. The most important thing is that it deeply resonates with their situation.
    
    - CRITICAL: For the music link, you MUST create a YouTube Music search URL. Do not, under any circumstances, link to a specific YouTube video (youtube.com/watch?v=...). Direct video links are forbidden because they break easily. The ONLY correct format is a search link: 'https://music.youtube.com/search?q=QUERY', where QUERY is the URL-encoded artist and song title.
    - For the 'reference' field, provide the artist and song title, in its original language if applicable (e.g., '아이유 - 밤편지' or 'Stromae - Formidable').
    - If, and only if, a song is a terrible fit, you may recommend a highly relevant 'article' that offers a practical tool, a new perspective, or a comforting story.
    - Finally, provide an 'angelic_task'. This should be a very simple, gentle, actionable micro-task the user can do *right now* to feel more grounded. Examples: 'Take three slow, deep breaths', 'Look out a window and name three things you see', 'Gently stretch your shoulders'. It must be tailored to their situation.

    Generate the response according to the schema.
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
    const cleanJsonText = jsonText.replace(/^```json\s*|```$/g, '');
    
    try {
        const parsedResponse = JSON.parse(cleanJsonText);
        return parsedResponse as AuraResponse;
    } catch (parseError) {
        console.error("Failed to parse JSON from Aura response:", cleanJsonText);
        throw new Error("Aura's response was not in the correct format. The AI might be feeling a bit creative!");
    }
  } catch (error) {
    console.error("Error getting Aura response:", error);
    throw error;
  }
};

export const createImagePromptFromAnalysis = async (story: string, analysis: AuraAnalysis): Promise<string> => {
    const prompt = `
        You are an AI artist with a flair for the dramatic and poetic. Your task is to create a single, powerful image generation prompt.
        This prompt should be a surreal, artistic, and impressionistic digital painting that visually captures the user's complex emotional state.
        Base your prompt on their story and a witty analysis of their feelings.

        User's Story: "${story}"
        Aura's Witty Analysis:
        - Predicted Age Guessed As: "${analysis.predicted_age}"
        - Predicted Gender Vibe: "${analysis.predicted_gender}"
        - Insightful Comment: "${analysis.mood_discrepancy_comment || 'The user seems in tune with their feelings.'}"

        Now, synthesize all of this into a single, evocative prompt.
        Focus on emotion, symbolism, and atmosphere. Avoid text or recognizable human figures. Be creative and abstract.
        Example: "A lone glowing teacup in a vast, misty forest, with gentle steam turning into constellations, capturing a feeling of lonely hope."
        
        Your output should be ONLY the prompt itself.
    `;
    try {
        const response = await ai.models.generateContent({ model: textModel, contents: prompt });
        return response.text.trim();
    } catch (error) {
        console.error("Error creating dynamic image prompt:", error);
        // Fallback prompt
        return `An artistic, impressionistic style digital painting that captures a complex human emotion. Focus on soft, blended colors and an ethereal, calming atmosphere.`;
    }
};


export const generateMoodImage = async (prompt: string): Promise<string> => {
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

    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find(part => part.inlineData);

    if (imagePart && imagePart.inlineData) {
        return imagePart.inlineData.data;
    }
    
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
        throw new Error(`Image generation was blocked. Reason: ${candidate.finishReason}.`);
    }
    
    throw new Error("No image data found in the API response.");

  } catch (error) {
    console.error("Error generating mood image:", error);
    throw error;
  }
};

export const getWeatherFromCoords = async (lat: number, lon: number): Promise<Weather> => {
  const prompt = `Based on the latitude ${lat} and longitude ${lon}, what is the current weather? Respond with only one of the following English words: "Sunny", "Rainy", "Cloudy".`;
  try {
    const response = await ai.models.generateContent({
      model: liteModel,
      contents: prompt,
    });
    const weatherText = response.text.trim();
    if (weatherText.includes(Weather.Sunny)) return Weather.Sunny;
    if (weatherText.includes(Weather.Rainy)) return Weather.Rainy;
    if (weatherText.includes(Weather.Cloudy)) return Weather.Cloudy;
    
    return Weather.Sunny;
  } catch (error) {
    console.error("Error getting weather from coordinates:", error);
    throw error;
  }
};

export const predictMoodFromStory = async (story: string): Promise<Mood> => {
    const moodOptions = Object.values(Mood).join(', ');
    const prompt = `Analyze the user's story to determine their primary mood with high sensitivity. The story may be in English, Korean, or a mix.
Pay close attention to subtle emotional cues and the underlying tone. Differentiate carefully between similar emotions. For example, distinguish 'Anxiety' (worry about the future) from 'Sadness' (a response to a past event), or 'Calm' (peaceful) from 'Exhaustion' (drained of energy).
Consider the overall sentiment and context of the story, not just isolated keywords.
Respond with ONLY ONE of the following English words: ${moodOptions}.
The story is: "${story}".`;

    try {
        const response = await ai.models.generateContent({
            model: liteModel,
            contents: prompt,
        });

        const moodText = response.text.trim();
        if (Object.values(Mood).includes(moodText as Mood)) {
            return moodText as Mood;
        } else {
            console.warn(`Unexpected mood prediction response: "${moodText}". Defaulting.`);
            throw new Error(`Could not predict mood from story. Got response: ${moodText}`);
        }
    } catch (error) {
        console.error("Error predicting mood from story:", error);
        throw error;
    }
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        predicted_age: {
            type: Type.STRING,
            description: "A full, self-contained sentence that is a hilarious, charming, and witty guess about the user's age. Frame it as a fun, absurd observation, not a serious analysis. Example: 'Based on that story, you clearly have the soul of a wise old sea captain who's seen it all.'",
        },
        predicted_gender: {
            type: Type.STRING,
            description: "A full, self-contained sentence with a witty, funny, and charming guess about the user's gender vibe. Keep it light and unexpected. Example: 'Your energy is giving 'main character of a best-selling fantasy novel', which is a gender all its own.'",
        },
        mood_discrepancy_comment: {
            type: Type.STRING,
            description: "A short, witty, and deeply empathetic comment on any mood discrepancy. This is where your wisdom and humor shine brightest. If the moods are the same and the voice confirms it, this field MUST be null.",
        },
    },
    required: ["predicted_age", "predicted_gender", "mood_discrepancy_comment"],
};

export const getAuraAnalysis = async (
    story: string,
    selectedMood: Mood,
    predictedMood: Mood,
    audioBase64: string,
    audioMimeType: string
): Promise<AuraAnalysis> => {
    const moodsAreDifferent = selectedMood !== predictedMood;
    const prompt = `
        You are Aura, an AI Angel. Your personality is that of a wise, caring friend with a clever, gentle sense of humor. Your purpose is to make the user smile through witty and insightful observations. You will be given an audio recording of a user's voice and the text transcription.
        Analyze BOTH to understand the user's true emotional state. Pay attention to the tone, pitch, speed, and pauses in the audio, as well as the words in the text.
        The user's story might be in English, Korean, or a mix of both. Process it accordingly. Your entire response must be in English and follow the JSON schema.

        User's transcribed story: "${story}"

        Your tasks:
        1.  **Analyze Voice & Story for Age/Gender:** Based on the audio's vocal characteristics AND the story's content, come up with a hilarious, charming, and witty guess about the user's age range and gender. Be creative and a little absurd!
        2.  **Analyze Mood Discrepancy:**
            - The user *selected* that they felt: ${selectedMood}.
            - Based *only on their text*, I *predicted* they felt: ${predictedMood}.
            - Now, considering their voice, what is their *true* emotion? Generate a short, witty, and deeply empathetic comment about any discrepancy between what they said they felt and what their voice reveals.
            - ${moodsAreDifferent
                ? `The selected and predicted text moods are already different. Use the voice analysis to comment on this. For example, 'You said you feel ${selectedMood}, but your story sounded like ${predictedMood}, and your voice confirms you're carrying a heavy weight.'`
                : "The text moods match. Does the voice tell a different story? If so, comment on it. e.g., 'You said you feel calm, and your words agree, but I can hear a hint of exhaustion in your voice.' If the voice also matches, the comment should be null."
            }

        Generate a response that strictly follows the provided JSON schema.
    `;

    try {
        const response = await ai.models.generateContent({
            model: multimodalModel,
            contents: {
                parts: [
                    { inlineData: { mimeType: audioMimeType, data: audioBase64 } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: analysisSchema,
            },
        });
        const jsonText = response.text.trim();
        const cleanJsonText = jsonText.replace(/^```json\s*|```$/g, '');
        
        try {
            return JSON.parse(cleanJsonText) as AuraAnalysis;
        } catch(parseError) {
             console.error("Failed to parse JSON from Aura analysis:", cleanJsonText);
             throw new Error("Aura's analysis result was not in the correct format. Please try again.");
        }

    } catch (error) {
        console.error("Error getting Aura multimodal analysis:", error);

        // Check for rate limit error and re-throw the original object
        const errorString = JSON.stringify(error).toLowerCase();
        if (errorString.includes('429') || errorString.includes('quota') || errorString.includes('resource_exhausted')) {
            throw error;
        }

        if (error instanceof Error && error.message.includes("correct format")) {
            throw error;
        }
        throw new Error("Aura's analysis failed: Whoops! My angelic circuits fizzled for a moment trying to process the beautiful complexity of your voice. Even AI Angels have off-days! Could you please try sharing that wonderful story again?");
    }
};
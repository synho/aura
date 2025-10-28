export enum Mood {
  Joy = "기쁨",
  Sadness = "슬픔",
  Exhaustion = "지침",
  Anxiety = "불안",
  Calm = "평온",
}

export enum Weather {
  Sunny = "맑음",
  Rainy = "비",
  Cloudy = "흐림",
}

export interface ContentRecommendation {
  type: "music" | "article";
  title: string;
  link: string;
}

export interface AuraResponse {
  empathy_message: string;
  content_recommendation: ContentRecommendation;
  background_story: string;
  reference: string;
}

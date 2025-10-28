export enum Mood {
  Joy = "Joy",
  Sadness = "Sadness",
  Exhaustion = "Exhaustion",
  Anxiety = "Anxiety",
  Calm = "Calm",
  Anger = "Anger",
  Hopeful = "Hopeful",
  Overwhelmed = "Overwhelmed",
  Excited = "Excited",
  Grateful = "Grateful",
  Confused = "Confused",
  Lonely = "Lonely",
  Proud = "Proud",
  Bored = "Bored",
  Nostalgic = "Nostalgic",
}

export enum Weather {
  Sunny = "Sunny",
  Rainy = "Rainy",
  Cloudy = "Cloudy",
}

export enum Gender {
  Male = "Male",
  Female = "Female",
  Other = "Other",
  PreferNotToSay = "Prefer not to say",
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

export interface AuraAnalysis {
  predicted_age: string;
  predicted_gender: string;
  mood_discrepancy_comment: string | null;
}
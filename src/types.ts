export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonExample {
  problem: string;
  solution: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  icon: string; // Name of lucide-react icon
  color: string; // Tailwind color theme for cards
  theory: string; // Markdown or rich text explanations
  examples: LessonExample[];
  interactiveWidget: "fractions" | "decimals" | "equations" | "geometry" | "rounding";
  quiz: QuizQuestion[];
}

export interface UserProfile {
  name: string;
  xp: number;
  level: number;
  streak: number;
  completedLessons: string[];
  unlockedAchievements: string[];
  lastActiveDate: string;
  solvedCount: number;
  language?: "kg" | "ru";
  hasPaid?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  requirement: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

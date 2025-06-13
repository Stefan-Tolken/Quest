// lib/types.ts
import { DateRange } from "react-day-picker";

export type Hint = {
  id?: string;
  description: string;
  displayAfterAttempts: number;
  displayedHint?: boolean;
};

export type HintDisplayMode = "sequential" | "random";

export interface ArtifactDetails {
  created: string;
  origin: string;
  currentLocation: string;
  dimensions: string;
  materials: string;
}

export type ComponentData = {
  id: string;
  type: "heading" | "paragraph" | "image" | "restoration" | "details";
  content: string | ImageContent | RestorationContent | ArtifactDetails;
  image?: string;
  order?: number;
};

export type ImageContent = {
  url: string;
  points: Array<{
    id: string;
    x: number;
    y: number;
    text: string;
  }>;
};

export type RestorationContent = {
  restorations: Array<{
    id: string;
    name: string;
    date: string | "unknown";
    description: string;
    imageUrl: string;
    organization?: string;
  }>;
};

export type Artefact = {
  id: string;
  name: string;
  artist: string;
  date?: string;
  description: string;
  image: File | string;
  components: ComponentData[];
  createdAt: string;
  partOfQuest: string[];
};

export type QuestArtefact = {
  artefactId: string;
  name?: string;
  hints: Hint[];
  hintDisplayMode: HintDisplayMode;
};

export type Quest = {
  quest_id: string;
  title: string;
  description: string;
  artefacts: QuestArtefact[];
  questType: "sequential" | "concurrent";
  dateRange?: DateRange;
  prize?: {
    title: string;
    description: string;
    image?: string;
    imagePreview?: string;
  };
  createdAt: string;
};

export type MainQuest = Omit<Quest, 'artefacts'> & {
  artefacts: Array<{
    artefactId: string;
    hints: Hint[];
    hintDisplayMode: 'sequential' | 'random';
    name?: string;
  }>;
  dateRange?: {
    from?: string;
    to?: string;
  };
  questType?: 'sequential' | 'random';
  prize?: {
    title: string;
  };
};

export interface UserQuestProgress {
  userId: string;
  questId: string;
  collectedArtefactIds: string[];
  completed: boolean;
  completedAt?: string;
  attempts: number;
  startTime: string;
  endTime?: string;
  lastAttemptedArtefactId?: string;
  displayedHints: Record<string, boolean>;
}

export interface QuestProgress {
  collectedArtefactIds: string[];
  completed: boolean;
  completedAt?: string | null;
  attempts: number;
  startTime?: string;
  endTime?: string;
  lastAttemptedArtefactId?: string;
  displayedHints: Record<string, boolean>;
}

export type ProfileSettings = {
  theme?: "light" | "dark";
  notifications?: boolean;
  language?: string;
};

export type CompletedQuest = {
  questId: string;
  completedAt: string;
  prize?: string;
};

export type UserData = {
  userId: string;
  email: string;
  profile_settings: ProfileSettings;
  completed_quests: CompletedQuest[];
  artefacts_collected: string[];
  createdAt: string;
  updatedAt: string;
};
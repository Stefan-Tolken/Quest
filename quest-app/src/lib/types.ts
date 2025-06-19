// lib/types.ts

import { AttributeValue } from "@aws-sdk/client-dynamodb";

export type DateRange = {
  from?: string;
  to?: string;
};

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
  type: "heading" | "paragraph" | "image" | "restoration" | "details" | "3DModel" | "subheading";
  content: string | ImageContent | RestorationContent | ArtifactDetails | Model3DContent;
  image?: string;
  order?: number;
};

export interface Point {
  id: string;
  x: number;
  y: number;
  text: string;
}

export interface ImageEditorProps {
  imageUrl: string;
  points: Point[];
  onSave: (points: Point[]) => void;
  onClose: () => void;
}

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
  type?: string;
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
    image: string;
  };
};

export interface ArtefactDetailProps {
  artefactId: string | null | undefined;
  isOpen: boolean;
  finalSubmission: boolean;
  onClose: () => void;
  onVisibilityChange?: (isVisible: boolean) => void;
}

export interface CalendarProps {
  mode?: "single" | "range"
  selected?: Date | { from?: Date; to?: Date }
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
  initialFocus?: boolean
  showOutsideDays?: boolean
  defaultMonth?: Date
  numberOfMonths?: number
}

export interface QuestContextType {
  activeQuest: Quest | null;
  isLoading: boolean;
  acceptQuest: (quest: Quest) => Promise<void>;
  cancelQuest: () => Promise<void>;
  submitArtefact: (artefactId: string) => Promise<{
    success: boolean;
    status: 'success' | 'error' | 'already';
    message?: string;
    progress?: QuestProgress;
  }>;
}

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

// 3D Model Editor Types

export type Model3DContent = {
  url: string;
}

export type ModelObject = {
    id: string,
    name: string,
    fileName: string,
    url: string,
    points: Array<{
        position: { x: number, y: number, z: number },
        rotation: { x: number, y: number, z: number },
        text: string
    }>;
    light?: number;
};

// DynamoDB types

export interface DynamoDBItem {
  id: AttributeValue;
  name: AttributeValue;
  artist?: AttributeValue;
  type?: AttributeValue;
  date?: AttributeValue;
  description: AttributeValue;
  image?: AttributeValue;
  components: AttributeValue;
  createdAt: AttributeValue;
  partOfQuest: AttributeValue;
}

export interface DynamoDBModelItem {
  id: AttributeValue;
  name: AttributeValue;
  fileName?: AttributeValue;
  url?: AttributeValue;
  points?: AttributeValue;
  createdAt?: AttributeValue;
  light?: AttributeValue;
}

'use client';

import { createContext, useContext, useState } from 'react';

interface Quest {
  quest_id: string;
  title: string;
  description: string;
  artifacts: Array<{
    id: string;
    hints: Array<{
      description: string;
      displayAfterAttempts: number;
    }>;
    hintDisplayMode: 'sequential' | 'random';
  }>;
  questType: 'sequential' | 'concurrent';
  dateRange?: {
    from: string;
    to: string;
  };
  prize?: {
    title: string;
    description: string;
    imageBase64?: string;
  };
  createdAt: string;
}

type QuestContextType = {
  activeQuest: Quest | null;
  acceptQuest: (quest: Quest) => void;
  cancelQuest: () => void;
  submitArtefact: (artefactId: string) => boolean;
};

const QuestContext = createContext<QuestContextType | undefined>(undefined);

export const QuestProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);

  const acceptQuest = (quest: Quest) => {
    if (!activeQuest) {
      setActiveQuest(quest);
    } else {
      console.warn('A quest is already active. Cancel it before accepting a new one.');
    }
  };

  const cancelQuest = () => {
    setActiveQuest(null);
  };

  const submitArtefact = (artefactId: string): boolean => {
    if (!activeQuest) return false;
    return activeQuest.artifacts.some((artifact) => artifact.id === artefactId);
  };

  return (
    <QuestContext.Provider value={{ activeQuest, acceptQuest, cancelQuest, submitArtefact }}>
      {children}
    </QuestContext.Provider>
  );
};

export const useQuest = () => {
  const context = useContext(QuestContext);
  if (!context) throw new Error('useQuest must be used within a QuestProvider');
  return context;
};
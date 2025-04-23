'use client';

import { createContext, useContext, useState } from 'react';
import { Quest } from '@/lib/mockData';

type QuestContextType = {
  activeQuest: Quest | null;
  acceptQuest: (quest: Quest) => void;
  submitArtefact: (artefactId: string) => boolean;
};

const QuestContext = createContext<QuestContextType | undefined>(undefined);

export const QuestProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);

  const acceptQuest = (quest: Quest) => {
    setActiveQuest(quest);
  };

  const submitArtefact = (artefactId: string): boolean => {
    if (!activeQuest) return false;
    return activeQuest.requiredArtefactIds.includes(artefactId);
  };

  return (
    <QuestContext.Provider value={{ activeQuest, acceptQuest, submitArtefact }}>
      {children}
    </QuestContext.Provider>
  );
};

export const useQuest = () => {
  const context = useContext(QuestContext);
  if (!context) throw new Error('useQuest must be used within a QuestProvider');
  return context;
};
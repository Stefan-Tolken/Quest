'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Quest, QuestContextType } from '@/lib/types';

const QuestContext = createContext<QuestContextType | undefined>(undefined);

export const QuestProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore active quest from sessionStorage on mount
  useEffect(() => {
    const storedQuest = sessionStorage.getItem('activeQuest');
    if (storedQuest) {
      try {
        setActiveQuest(JSON.parse(storedQuest));
      } catch (err) {
        console.error('Error parsing stored quest:', err);
        sessionStorage.removeItem('activeQuest');
      }
    }
    setIsLoading(false);
  }, []);

  // Save active quest to sessionStorage whenever it changes
  useEffect(() => {
    if (activeQuest) {
      sessionStorage.setItem('activeQuest', JSON.stringify(activeQuest));
    } else {
      sessionStorage.removeItem('activeQuest');
    }
  }, [activeQuest]);

  const acceptQuest = async (quest: Quest) => {
    if (activeQuest) {
      console.warn('A quest is already active. Cancel it before accepting a new one.');
      return;
    }
    // Get JWT token from localStorage or sessionStorage (OIDC user)
    let token = localStorage.getItem('token');
    if (!token && typeof window !== 'undefined') {
      const oidcKey = Object.keys(sessionStorage).find((k) => k.startsWith('oidc.user:'));
      if (oidcKey) {
        try {
          const oidcUser = JSON.parse(sessionStorage.getItem(oidcKey) || '{}');
          token = oidcUser.id_token;
        } catch {
          console.error('Error parsing OIDC user from sessionStorage');
          sessionStorage.removeItem(oidcKey); // Clean up if parsing fails
        }
      }
    }
    try {
      const res = await fetch('/api/start-quest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ questId: quest.quest_id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActiveQuest(quest);
      } else if (res.status === 409) {
        // Quest already started for this user
        setActiveQuest(quest);
      } else {
        console.error('Failed to start quest:', data.error || res.statusText);
        toast.error('Failed to accept quest: ' + (data.error || res.statusText));
      }
    } catch (err) {
      console.error('Error starting quest:', err);
      toast.error('Error accepting quest. Please try again.');
    }
  };

  const cancelQuest = async () => {
    let token = localStorage.getItem('token');
    if (!token && typeof window !== 'undefined') {
      const oidcKey = Object.keys(sessionStorage).find(k => k.startsWith('oidc.user:'));
      if (oidcKey) {
        try {
          const oidcUser = JSON.parse(sessionStorage.getItem(oidcKey) || '{}');
          token = oidcUser.id_token;
        } catch {
          console.error('Error parsing OIDC user from sessionStorage');
          sessionStorage.removeItem(oidcKey); // Clean up if parsing fails
        }
      }
    }

    if (activeQuest) {
      try {
        // Optional: Notify backend that user cancelled quest
        await fetch(`/api/user-quest-progress?questId=${activeQuest.quest_id}`, {
          method: 'DELETE',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
      } catch (err) {
        console.error('Error cancelling quest:', err);
      }
    }
    setActiveQuest(null);
  };

  const submitArtefact = (artefactId: string): boolean => {
    if (!activeQuest) return false;
    return activeQuest.artefacts.some((artefact) => artefact.artefactId === artefactId);
  };

  // Helper function to delete quest progress
  const deleteQuestProgress = async (questId: string, token: string | null) => {
    try {
      await fetch(`/api/user-quest-progress?questId=${questId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      console.log('Quest progress deleted successfully');
    } catch (err) {
      console.error('Error deleting quest progress:', err);
    }
  };

  // Updated function to check and handle quest completion with auto-cleanup
  const checkQuestCompletion = async (collectedArtefactIds: string[]) => {
    if (!activeQuest) {
      console.log('No active quest, returning early');
      return;
    }

    // Check if all artefacts have been collected
    const totalArtefacts = activeQuest.artefacts.length;
    const collectedCount = collectedArtefactIds.length;
    
    console.log('Checking quest completion:', {
      questId: activeQuest.quest_id,
      totalArtefacts,
      collectedCount,
      isComplete: collectedCount >= totalArtefacts
    });
    
    if (collectedCount >= totalArtefacts) {
      try {
        // Get authentication token
        let token = localStorage.getItem('token');
        if (!token && typeof window !== 'undefined') {
          const oidcKey = Object.keys(sessionStorage).find(k => k.startsWith('oidc.user:'));
          if (oidcKey) {
            try {
              const oidcUser = JSON.parse(sessionStorage.getItem(oidcKey) || '{}');
              token = oidcUser.id_token;
            } catch {
              console.error('Error parsing OIDC user from sessionStorage');
            }
          }
        }

        // Call complete-quest endpoint to save completion data to userData
        const completeResponse = await fetch('/api/complete-quest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            questId: activeQuest.quest_id,
            collectedArtefactIds: collectedArtefactIds,
            questTitle: activeQuest.title,
            prize: activeQuest.prize
          })
        });

        if (!completeResponse.ok) {
          const errorData = await completeResponse.json();
          throw new Error(errorData.error || 'Failed to complete quest');
        }

        console.log('Quest completion saved to userData successfully');

        // Now clean up the quest progress data since it's saved in userData
        try {
          await deleteQuestProgress(activeQuest.quest_id, token);
          console.log('Quest progress data cleaned up successfully');
        } catch (cleanupError) {
          // Don't fail the entire completion if cleanup fails
          console.warn('Failed to cleanup quest progress data:', cleanupError);
        }

        // Show success message
        toast.success(`Quest "${activeQuest.title}" completed! 🎉`);
        
        // Clear active quest after successful completion
        setActiveQuest(null);
        
      } catch (err) {
        console.error('Error completing quest:', err);
        toast.error('Error completing quest. Please try again.');
      }
    }
  };

  return (
    <QuestContext.Provider value={{ 
      activeQuest, 
      isLoading, 
      acceptQuest, 
      cancelQuest, 
      submitArtefact,
      checkQuestCompletion
    }}>
      {children}
    </QuestContext.Provider>
  );
};

export const useQuest = () => {
  const context = useContext(QuestContext);
  if (!context) throw new Error('useQuest must be used within a QuestProvider');
  return context;
};
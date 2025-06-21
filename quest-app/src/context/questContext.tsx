'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { Quest, QuestContextType, QuestProgress, UserData } from '@/lib/types';

// Extended context type with new functionality
interface ExtendedQuestContextType extends QuestContextType {
  progress: QuestProgress | null;
  isNextSequential: (artefactId: string) => boolean;
  getNextHint: () => { description: string } | null;
  submitArtefact: (artefactId: string) => Promise<{
    success: boolean;
    status: 'success' | 'error' | 'already';
    message?: string;
    progress?: QuestProgress;
  }>;
  refreshProgress: () => Promise<void>;
  checkQuestCompletion: (collectedArtefactIds: string[]) => Promise<void>;
  setActiveQuest: (quest: Quest | null) => void;
}

const QuestContext = createContext<ExtendedQuestContextType | undefined>(undefined);

export const QuestProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<QuestProgress | null>(null);

  // Helper function to get JWT token
  const getToken = useCallback(() => {
    let token = localStorage.getItem('token');
    if (!token && typeof window !== 'undefined') {
      const oidcKey = Object.keys(sessionStorage).find(k => k.startsWith('oidc.user:'));
      if (oidcKey) {
        try {
          const oidcUser = JSON.parse(sessionStorage.getItem(oidcKey) || '{}');
          token = oidcUser.id_token;
        } catch {
          console.error('Error parsing OIDC user from sessionStorage');
          sessionStorage.removeItem(oidcKey);
        }
      }
    }
    return token;
  }, []);

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

  // Fetch user quest progress when active quest changes
  const refreshProgress = useCallback(async () => {
    if (!activeQuest?.quest_id) {
      setProgress(null);
      return;
    }

    const token = getToken();
    
    try {
      const res = await fetch(`/api/user-quest-progress?questId=${activeQuest.quest_id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      const data = await res.json();
      
      if (!data.error) {
        const progressData: QuestProgress = {
          collectedArtefactIds: data.collectedArtefactIds || [],
          completed: data.completed || false,
          completedAt: data.completedAt,
          attempts: data.attempts || 0,
          lastAttemptedArtefactId: data.lastAttemptedArtefactId,
          displayedHints: data.displayedHints || {}
        };
        setProgress(progressData);
      } else {
        console.warn('User quest progress error:', data.error);
        setProgress(null);
      }
    } catch (err) {
      console.error('Failed to fetch quest progress:', err);
      setProgress(null);
    }
  }, [activeQuest?.quest_id, getToken]);

  // Fetch progress when active quest changes
  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  // Check if this is a sequential quest and if given artefact is the next one
  const isNextSequential = useCallback((artefactId: string): boolean => {
    if (!activeQuest?.artefacts || !progress) return false;
    
    const questArtefacts = Array.isArray(activeQuest.artefacts) ? activeQuest.artefacts : [];
    const hintDisplayMode = questArtefacts[0]?.hintDisplayMode || 'concurrent';
    const isSequential = hintDisplayMode === 'sequential';
    
    if (!isSequential) return true; // Non-sequential quests allow any order
    
    const foundIds = Array.isArray(progress.collectedArtefactIds) ? progress.collectedArtefactIds : [];
    const nextArtefact = questArtefacts.find((a: { artefactId?: string } | string) => {
      const artefactIdFromQuest = typeof a === 'object' && a !== null ? a.artefactId ?? '' : a ?? '';
      return !foundIds.includes(artefactIdFromQuest);
    });
    
    const nextArtefactId = typeof nextArtefact === 'object' && nextArtefact !== null ? nextArtefact.artefactId ?? '' : nextArtefact ?? '';
    return nextArtefactId === artefactId;
  }, [activeQuest?.artefacts, progress]);

  // Get the next hint for sequential quests
  const getNextHint = useCallback((): { description: string } | null => {
    if (!activeQuest?.artefacts || !progress) return null;
    
    const questArtefacts = Array.isArray(activeQuest.artefacts) ? activeQuest.artefacts : [];
    const hintDisplayMode = questArtefacts[0]?.hintDisplayMode || 'concurrent';
    const isSequential = hintDisplayMode === 'sequential';
    
    if (!isSequential) return null;
    
    const foundIds = Array.isArray(progress.collectedArtefactIds) ? progress.collectedArtefactIds : [];
    
    // Find the next artifact that hasn't been collected yet
    const nextArtefact = questArtefacts.find((a: any) => {
      const artefactId = typeof a === 'object' && a !== null ? a.artefactId ?? '' : a ?? '';
      return !foundIds.includes(artefactId);
    });
    
    // If there's no next artifact (all collected) or the next artifact isn't an object, return null
    if (!nextArtefact || typeof nextArtefact !== 'object') return null;
    
    const hints = nextArtefact.hints || [];
    if (hints.length === 0) return null;
    
    // Get the number of attempts for this quest to determine which hint to show
    const attempts = progress.attempts || 0;
    
    // Log for debugging
    console.log(`artefact at index: ${questArtefacts.findIndex((a: any) => a.artefactId === nextArtefact.artefactId)} is ${nextArtefact.artefactId} attempts: safeAttempts: ${attempts}`);
    
    // Show hints based on attempts: first hint after first attempt (attempts >= 1)
    // Cap at the last available hint
    const hintIndex = Math.min(attempts, hints.length - 1);
    
    return hints[hintIndex];
  }, [activeQuest?.artefacts, progress]);

  const acceptQuest = async (quest: Quest) => {
    if (activeQuest) {
      console.warn('A quest is already active. Cancel it before accepting a new one.');
      return;
    }
    
    const token = getToken();
    
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
    const token = getToken();

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
    setProgress(null);
  };

  // Enhanced submitArtefact function with centralized logic
  const submitArtefact = async (artefactId: string) => {
    if (!activeQuest || !artefactId) {
      return { success: false, status: 'error' as const, message: 'No active quest or artefact ID' };
    }

    const token = getToken();
    
    try {
      const res = await fetch('/api/collect-artifact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ questId: activeQuest.quest_id, artefactId })
      });
      
      const data = await res.json();
      
      if (data.success) {
        const newProgress: QuestProgress = {
          collectedArtefactIds: data.collectedArtefactIds || [],
          completed: data.completed || false,
          completedAt: data.completedAt,
          attempts: data.attempts || 0,
          lastAttemptedArtefactId: data.lastAttemptedArtefactId,
          displayedHints: data.displayedHints || {}
        };
        setProgress(newProgress);

        // Check for quest completion - FIXED: Check if we just completed it
        if (activeQuest.artefacts.length > 0 && 
            data.collectedArtefactIds && 
            data.collectedArtefactIds.length >= activeQuest.artefacts.length) {
          console.log('Checking quest completion...', {
            totalArtefacts: activeQuest.artefacts.length,
            collectedArtefacts: data.collectedArtefactIds.length,
            collectedIds: data.collectedArtefactIds,
            backendCompletedFlag: data.completed
          });
          
          console.log('All artifacts collected, triggering completion check');
          await checkQuestCompletion(data.collectedArtefactIds);
        }

        if (data.alreadyCollected) {
          return { 
            success: false, 
            status: 'already' as const, 
            message: 'Already submitted.',
            progress: newProgress 
          };
        } else {
          return { 
            success: true, 
            status: 'success' as const, 
            message: 'Artefact submitted successfully!',
            progress: newProgress 
          };
        }
      } else if (!data.success && data.error) {
        // Handle incorrect answers (both wrong artefact and wrong sequence)
        if (data.attempts !== undefined && data.progress) {
          const updatedProgress: QuestProgress = {
            collectedArtefactIds: progress?.collectedArtefactIds || [],
            completed: progress?.completed || false,
            completedAt: progress?.completedAt,
            attempts: data.attempts,
            lastAttemptedArtefactId: artefactId,
            displayedHints: progress?.displayedHints || {}
          };
          setProgress(updatedProgress);
        }

        // Check if this is a sequential quest error and provide hint
        const questArtefacts = Array.isArray(activeQuest.artefacts) ? activeQuest.artefacts : [];
        const hintDisplayMode = questArtefacts[0]?.hintDisplayMode || 'concurrent';
        const isSequential = hintDisplayMode === 'sequential';
        
        if (isSequential && !isNextSequential(artefactId)) {
          const nextHint = getNextHint();
          const hintText = nextHint ? `Hint: ${nextHint.description}` : 'Incorrect artefact for this step. Try another.';
          return { 
            success: false, 
            status: 'error' as const, 
            message: hintText 
          };
        }

        return { 
          success: false, 
          status: 'error' as const, 
          message: 'Error submitting. Try again.' 
        };
      } else {
        return { 
          success: false, 
          status: 'error' as const, 
          message: 'Error submitting. Try again.' 
        };
      }
    } catch (error) {
      console.error('Submit error:', error);
      return { 
        success: false, 
        status: 'error' as const, 
        message: 'Error submitting. Try again.' 
      };
    }
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
        // Get userId from localStorage or sessionStorage (adjust as needed)
        let userId = localStorage.getItem('userId');
        if (!userId && typeof window !== 'undefined') {
          const oidcKey = Object.keys(sessionStorage).find(k => k.startsWith('oidc.user:'));
          if (oidcKey) {
            try {
              const oidcUser = JSON.parse(sessionStorage.getItem(oidcKey) || '{}');
              userId = oidcUser.profile?.sub || oidcUser.sub || '';
            } catch {
              console.error('Error parsing OIDC user from sessionStorage');
            }
          }
        }

        console.log('Calling complete-quest API with:', {
          userId,
          questId: activeQuest.quest_id,
          tokenExists: !!token
        });

        const completeResponse = await fetch('/api/complete-quest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            userId,
            questId: activeQuest.quest_id,
            collectedArtefactIds: collectedArtefactIds,
            questTitle: activeQuest.title,
            prize: activeQuest.prize
          })
        });

        // Debug the API response
        const responseText = await completeResponse.text();
        console.log('API Response Status:', completeResponse.status);
        console.log('API Response Headers:', Object.fromEntries(completeResponse.headers.entries()));
        
        // Try to parse as JSON if possible
        try {
          const responseData = JSON.parse(responseText);
          console.log('API Response Data:', responseData);
          
          if (!completeResponse.ok) {
            throw new Error(responseData.error || responseData.message || 'Failed to complete quest');
          }
        } catch (parseError) {
          console.error('Error parsing response as JSON:', parseError);
          console.log('Raw response text:', responseText);
          
          if (!completeResponse.ok) {
            throw new Error('Failed to complete quest: ' + responseText);
          }
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
      progress,
      setActiveQuest,
      acceptQuest, 
      cancelQuest, 
      submitArtefact,
      checkQuestCompletion,
      isNextSequential,
      getNextHint,
      refreshProgress
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

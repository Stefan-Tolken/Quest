// hooks/useUserData.ts
import { useState, useEffect } from 'react';
import { useAuthState } from '@/lib/useAuth';
import { UserData } from '@/lib/types';

export function useUserData() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthState();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize user data when authenticated
  useEffect(() => {
    if (isAuthenticated && user && !authLoading) {
      // Extract email from user object based on your Cognito setup
      const userEmail = user.profile?.email;
      const userId = user.profile?.sub;
      
      if (userEmail && userId) {
        initializeUser(userEmail, userId);
      } else {
        setError('User email or ID not available from authentication');
      }
    }
  }, [isAuthenticated, user, authLoading]);

  const initializeUser = async (email: string, userId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to get existing user first
      const getResponse = await fetch(`/api/user?email=${encodeURIComponent(email)}`);
      
      if (getResponse.ok) {
        const { user: existingUser } = await getResponse.json();
        setUserData(existingUser);
        console.log('Existing user loaded:', existingUser);
      } else if (getResponse.status === 404) {
        // User doesn't exist, create new user
        console.log('User not found, creating new user...');
        const createResponse = await fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            userId: userId,
          }),
        });

        if (createResponse.ok) {
          const { user: newUser } = await createResponse.json();
          setUserData(newUser);
          console.log('New user created:', newUser);
        } else {
          const errorData = await createResponse.json();
          throw new Error(errorData.error || 'Failed to create user');
        }
      } else {
        const errorData = await getResponse.json();
        throw new Error(errorData.error || 'Failed to fetch user data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error initializing user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserData = async (updateData: Partial<UserData>) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    const userEmail = user.profile?.email;
    if (!userEmail) {
      setError('User email not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          updateData,
        }),
      });

      if (response.ok) {
        const { user: updatedUser } = await response.json();
        setUserData(updatedUser);
        return updatedUser;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error updating user:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const addArtefactToCollection = async (artefactId: string) => {
    if (!userData) {
      console.log('No user data available');
      return;
    }

    const updatedArtefacts = [...userData.artefacts_collected];
    if (!updatedArtefacts.includes(artefactId)) {
      updatedArtefacts.push(artefactId);
      await updateUserData({ artefacts_collected: updatedArtefacts });
      console.log(`Artefact ${artefactId} added to collection`);
    } else {
      console.log(`Artefact ${artefactId} already in collection`);
    }
  };

  const markQuestAsCompleted = async (questId: string, prize?: string) => {
    if (!userData) {
      console.log('No user data available');
      return;
    }

    // Check if quest is already completed
    const isAlreadyCompleted = userData.completed_quests.some(quest => quest.questId === questId);
    if (isAlreadyCompleted) {
      console.log(`Quest ${questId} already completed`);
      return;
    }

    const completedQuest = {
      questId,
      completedAt: new Date().toISOString(),
      ...(prize && { prize }),
    };

    const updatedCompletedQuests = [...userData.completed_quests, completedQuest];
    await updateUserData({ completed_quests: updatedCompletedQuests });
    console.log(`Quest ${questId} marked as completed`);
  };

  const updateProfileSettings = async (newSettings: Partial<UserData['profile_settings']>) => {
    if (!userData) {
      console.log('No user data available');
      return;
    }

    const updatedSettings = {
      ...userData.profile_settings,
      ...newSettings,
    };

    await updateUserData({ profile_settings: updatedSettings });
    console.log('Profile settings updated:', newSettings);
  };

  const refreshUserData = () => {
    if (isAuthenticated && user) {
      const userEmail = user.profile?.email;
      const userId = user.profile?.sub;
      
      if (userEmail && userId) {
        initializeUser(userEmail, userId);
      }
    }
  };

  return {
    userData,
    isLoading,
    error,
    updateUserData,
    addArtefactToCollection,
    markQuestAsCompleted,
    updateProfileSettings,
    refreshUserData,
  };
}
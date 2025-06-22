"use client";

import { useAuthState } from "@/lib/useAuth";
import { useUserData } from "@/hooks/useUserData";
import AuthButton from '@/components/ui/authButton';
import CameraBackground from '@/components/ui/cameraBackground';
import CompletedQuestsDisplay from '@/components/ui/completedQuestsdisplay';
import EditProfileModal from '@/components/ui/editprofilemodal';
import Link from 'next/link';
import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { User, Trophy, Settings, Trash2, AlertTriangle, Edit3, ArrowRight, Clock, Award } from "lucide-react";
import { ScrollArea } from '@/components/ui/scroll-area';

const ProfilePage = () => {
  const { user } = useAuthState();
  const { userData, error, updateUserData } = useUserData();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [leaderboardMode, setLeaderboardMode] = useState<'fastest' | 'first'>('fastest');

  const handleDelete = async () => {
    if (!user?.profile?.email) {
      setDeleteError('No email found for user');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch('/api/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.profile.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      console.log('Account deleted successfully:', data);
      
      // Optionally show success message before redirecting
      alert('Account deleted successfully. You will be signed out.');
      
      // Sign out the user after successful deletion
      window.location.href = '/';
      
    } catch (error) {
      console.error('Error deleting account:', error);
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveProfile = async (profileData: { displayName: string; profileImage?: File }) => {
    if (!user?.profile?.email) {
      throw new Error('No email found for user');
    }

    const formData = new FormData();
    formData.append('email', user.profile.email);
    formData.append('displayName', profileData.displayName);
    
    if (profileData.profileImage) {
      formData.append('profileImage', profileData.profileImage);
    }

    const response = await fetch('/api/save-user', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save profile');
    }

    console.log('Profile saved successfully:', data);
    
    // Refresh user data
    await updateUserData({});
  };

  const handleQuestClick = () => {
    window.dispatchEvent(new CustomEvent('showCompletedQuests', {
      detail: { leaderboardMode }
    }));
  };
  
  const email = user?.profile?.email || "No email available";
  const displayName = userData?.displayName || user?.profile?.name || user?.profile?.preferred_username || "Student";
  const profileImage = userData?.profileImage;
  const isAdmin = Array.isArray(user?.profile?.["cognito:groups"]) ? user.profile["cognito:groups"].includes("Admin") : false;

  // Show error state if there's an error
  if (error) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center">
        <CameraBackground />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-8 flex flex-col items-center gap-4 max-w-md w-full">
            <div className="text-red-500 text-center">
              <p className="font-semibold">Error loading profile</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <CameraBackground />
      {user ? (
        <div className="p-4 h-full min-h-0 ">
          <div className="max-w-2xl mx-auto h-full flex flex-col">

            {/* Main Content Tabs */}
            <Tabs defaultValue="achievements" className="w-full h-full min-h-0 flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="achievements" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  <span className="">Achievements</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>
              <TabsContent value="achievements" className="flex flex-col h-full min-h-0">            
                {/* Leaderboard Mode Toggle */}
                <div className="flex h-15 items-center mb-4 p-[3px] glass rounded-lg">
                  <Button
                    onClick={() => setLeaderboardMode('fastest')}
                    variant={leaderboardMode === 'fastest' ? "glassDark" : "ghost"}
                    className={`flex-1 h-13 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium whitespace-nowrap ${leaderboardMode === 'fastest' ? "" : "!text-foreground"}`}
                  >
                    <Clock className="h-4 w-4" />
                    Speed
                  </Button>
                  <Button
                    onClick={() => setLeaderboardMode('first')}
                    variant={leaderboardMode === 'first' ? "glassDark" : "ghost"}
                    className={`flex-1 h-13 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium whitespace-nowrap ${leaderboardMode === 'first' ? "" : "!text-foreground"}`}
                  >
                    <Award className="h-4 w-4" />
                    Rank
                  </Button>
                </div>

                {userData && (
                  <ScrollArea className="flex-1 min-h-0 max-w-full mb-9 rounded-xl">
                    <CompletedQuestsDisplay
                      userId={userData.userId}
                      userEmail={userData.email}
                      completedQuests={userData.completed_quests || []}
                      onQuestClick={handleQuestClick}
                      leaderboardMode={leaderboardMode}
                    />
                  </ScrollArea>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                {/* User Profile Card */}
                <div className="glass flex flex-col items-center rounded-xl shadow-lg py-8 px-6 mb-4">
                  {/* Profile Image */}
                  <div className="w-40 h-40 rounded-full overflow-hidden bg-foreground/20 mb-4 flex items-center justify-center">
                    {profileImage ? (
                      <Image
                        src={profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        width={128}
                        height={128}
                        unoptimized
                      />
                    ) : (
                      <svg className="w-8 h-8 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.25a7.75 7.75 0 0115 0v.25a.75.75 0 01-.75-.75h-13.5a.75.75 0 01-.75-.75v-.25z" />
                      </svg>
                    )}
                  </div>

                  {/* Name and Edit Button */}
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-foreground text-center truncate">{displayName}</h1>
                    <Button
                      onClick={() => setIsEditModalOpen(true)}
                      variant={'ghost'}
                    >
                      <Edit3 className="w-4 h-4 text-foreground" />
                    </Button>
                  </div>

                  {/* Email */}
                  <div className="text-foreground text-md text-center truncate">{email}</div>
                </div>
                <div className="glass rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Account Settings</h3>
                  
                  <div className="space-y-4">
                    {isAdmin && (
                      <Link href="/admin">
                        <Button variant="glass" className="w-full mb-4">
                          Admin Dashboard
                        </Button>
                      </Link>
                    )}
                    
                    <AuthButton />
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="glassDestructive" className="w-full">
                          Delete Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center justify-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Delete Account?
                          </DialogTitle>
                          <DialogDescription className="py-2">
                            <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                          </DialogDescription>
                        </DialogHeader>
                        
                        {deleteError && (
                          <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-600">{deleteError}</p>
                          </div>
                        )}
                        
                        <DialogFooter className="flex flex-row justify-end gap-2">
                          <DialogClose asChild>
                            <Button 
                              className="flex-1" 
                              type="button" 
                              variant="glass"
                              disabled={isDeleting}
                            >
                              Cancel
                            </Button>
                          </DialogClose>
                          <Button 
                            onClick={handleDelete} 
                            className="flex-1" 
                            type="button" 
                            variant="glassDestructive"
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Edit Profile Modal */}
            <EditProfileModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSave={handleSaveProfile}
              currentName={displayName}
              currentImage={profileImage}
              userEmail={email}
            />
          </div>
        </div>
      ) : (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-6">
          <main className="flex flex-col items-center gap-8 max-w-xl w-full">
            <Image
              src="/icons/icon-512x512.png"
              alt="Quest App Logo"
              width={256}
              height={256}
              className="mb-2"
              priority
            />
          </main>
          <footer className="flex flex-col gap-6 w-full absolute bottom-0 left-0 p-6 pb-20 text-background/70 text-sm text-center">
            <AuthButton />
          </footer>
        </div>
      )}
    </>
  );
};

export default ProfilePage;
"use client";

import { useAuthState } from "@/lib/useAuth";
import { useUserData } from "@/hooks/useUserData";
import AuthButton from '@/components/ui/authButton';
import CameraBackground from '@/components/ui/cameraBackground';
import Link from 'next/link';
import React from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
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

const ProfilePage = () => {
  const { user } = useAuthState();
  const { userData, isLoading, error } = useUserData();
  
  const email = user?.profile?.email || "No email available";
  const name = user?.profile?.name || user?.profile?.preferred_username || "Student";
  const isAdmin = Array.isArray(user?.profile?.["cognito:groups"]) ? user.profile["cognito:groups"].includes("Admin") : false;
  
  // Show loading state while user data is being fetched/created
  // if (isLoading) {
  //   return (
  //     <div className="relative min-h-screen w-full flex items-center justify-center">
  //       <CameraBackground />
  //       <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
  //         <div className="glass rounded-xl shadow-lg p-8 flex flex-col items-center gap-4 max-w-md w-full">
  //           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  //           <p className="text-gray-600">Loading profile...</p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

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
    <div className="relative min-h-screen w-full flex items-center justify-center">
      <CameraBackground />
      {user ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <div className="glass rounded-xl shadow-lg p-6 flex flex-col items-center gap-4 max-w-md w-full">
            <div className="w-24 h-24 rounded-full bg-foreground/20 flex items-center justify-center">
              <svg className="w-16 h-16 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.25a7.75 7.75 0 0115 0v.25a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75v-.25z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{name}</h1>
            <p className="text-foreground">{email}</p>
            
            <div className="flex flex-col gap-3 w-full">
              {isAdmin && (
                <Link 
                  href="/admin"
                >
                  <Button variant={"glassDark"} className="w-full">
                    Admin Dashboard
                  </Button>
                </Link>
              )}
              <AuthButton />
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="glassDestructive">Delete Account</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Delete Account?</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete your account? This action can not be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex flex-row justify-end gap-2">
                    <DialogClose asChild>
                      <Button className="flex-1" type="button" variant="glass">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button className="flex-1" type="button" variant="glassDestructive">
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
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
    </div>
  );
};

export default ProfilePage;
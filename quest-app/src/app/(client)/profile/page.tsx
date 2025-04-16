"use client";

import { useAuthState } from "@/lib/useAuth";
import AuthButton from '@/components/ui/authButton';
import React from 'react';


const ProfilePage = () => {
 const { user } = useAuthState();

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1>Profile</h1>
      <p>{user?.profile.email}</p>
      <AuthButton />
    </div>
  );
};

export default ProfilePage;
  
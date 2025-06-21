import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Camera, Save, X, AlertTriangle } from "lucide-react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { displayName: string; profileImage?: File }) => Promise<void>;
  currentName: string;
  currentImage?: string | null;
  userEmail: string;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentName,
  currentImage,
  userEmail
}) => {
  const [editedName, setEditedName] = useState("");
  const [editedImage, setEditedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    image?: string;
    general?: string;
  }>({});
  const [badWords, setBadWords] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_USERNAME_LENGTH = 20;
  const MIN_USERNAME_LENGTH = 2;

  // Load bad words list
  useEffect(() => {
    const loadBadWords = async () => {
      try {
        const response = await fetch('/bad-words.txt');
        if (response.ok) {
          const text = await response.text();
          const words = text.split('\n')
            .map(word => word.trim().toLowerCase())
            .filter(word => word.length > 0);
          setBadWords(words);
        }
      } catch (error) {
        console.error('Failed to load bad words list:', error);
        // Fallback list
        setBadWords(['fuck', 'shit', 'damn', 'bitch', 'ass', 'hell']);
      }
    };

    loadBadWords();
  }, []);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      setEditedName(currentName);
      setImagePreview(currentImage || null);
      setEditedImage(null);
      setErrors({});
    }
  }, [isOpen, currentName, currentImage]);

  const validateUsername = (username: string): string | null => {
    if (!username.trim()) {
      return "Username is required";
    }

    if (username.trim().length < MIN_USERNAME_LENGTH) {
      return `Username must be at least ${MIN_USERNAME_LENGTH} characters`;
    }

    if (username.trim().length > MAX_USERNAME_LENGTH) {
      return `Username must be no more than ${MAX_USERNAME_LENGTH} characters`;
    }

    // Check for profanity
    const lowerUsername = username.toLowerCase();
    const containsBadWord = badWords.some(badWord => 
      lowerUsername.includes(badWord.toLowerCase())
    );

    if (containsBadWord) {
      return "Username contains inappropriate language";
    }

    // Check for valid characters (letters, numbers, spaces, basic punctuation)
    const validPattern = /^[a-zA-Z0-9\s\-_.]+$/;
    if (!validPattern.test(username)) {
      return "Username can only contain letters, numbers, spaces, hyphens, underscores, and periods";
    }

    return null;
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Clear previous image error
      setErrors(prev => ({ ...prev, image: undefined }));

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'Please select a valid image file' }));
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Image must be smaller than 5MB' }));
        return;
      }

      setEditedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNameChange = (value: string) => {
    setEditedName(value);
    // Clear name error when user starts typing
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
  };

  const handleSave = async () => {
    const nameError = validateUsername(editedName);
    
    if (nameError) {
      setErrors(prev => ({ ...prev, name: nameError }));
      return;
    }

    if (errors.image) {
      return;
    }

    setIsSaving(true);
    setErrors(prev => ({ ...prev, general: undefined }));

    try {
      await onSave({
        displayName: editedName.trim(),
        profileImage: editedImage || undefined
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrors(prev => ({ 
        ...prev, 
        general: error instanceof Error ? error.message : 'Failed to save profile' 
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your display name and profile picture
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-foreground/20 flex items-center justify-center">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                    width={80}
                    height={80}
                    unoptimized
                  />
                ) : (
                  <svg className="w-10 h-10 text-foreground/60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.25a7.75 7.75 0 0115 0v.25a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75v-.25z" />
                  </svg>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSaving}
              className="text-xs"
            >
              Change Photo
            </Button>

            {errors.image && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertTriangle className="w-4 h-4" />
                {errors.image}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              disabled={isSaving}
            />
          </div>

          {/* Username Section */}
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Display Name
            </label>
            <Input
              id="username"
              value={editedName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter your display name"
              disabled={isSaving}
              className={errors.name ? "border-red-500" : ""}
              maxLength={MAX_USERNAME_LENGTH}
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>
                {editedName.length}/{MAX_USERNAME_LENGTH} characters
              </span>
              {errors.name && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="w-3 h-3" />
                  {errors.name}
                </div>
              )}
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Email (cannot be changed)
            </label>
            <Input
              value={userEmail}
              disabled
              className="bg-muted"
            />
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertTriangle className="w-4 h-4" />
                {errors.general}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row gap-2 sm:justify-end">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isSaving}
            className="flex-1 sm:flex-none"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving || !!errors.name || !!errors.image}
            className="flex-1 sm:flex-none"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;
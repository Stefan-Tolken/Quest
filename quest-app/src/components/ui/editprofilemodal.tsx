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
import { Camera, Save, X, AlertTriangle, Upload } from "lucide-react";

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
  const [profaneWords, setProfaneWords] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_USERNAME_LENGTH = 20;
  const MIN_USERNAME_LENGTH = 2;

  // Load profane words from npm package
  useEffect(() => {
    const loadProfaneWords = async () => {
      try {
        // Import the profane-words package
        const profaneWordsModule = await import('profane-words');
        const words = profaneWordsModule.default || profaneWordsModule;
        setProfaneWords(Array.isArray(words) ? words : []);
      } catch (error) {
        console.error('Failed to load profane words package:', error);
        setProfaneWords([]);
      }
    };

    loadProfaneWords();
  }, []);

  // Load custom bad words list
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

    // Check for profanity using both lists
    const lowerUsername = username.toLowerCase();
    
    // Check custom bad words list
    const containsBadWord = badWords.some(badWord => 
      lowerUsername.includes(badWord.toLowerCase())
    );

    // Check profane words package
    const containsProfaneWord = profaneWords.some(profaneWord => 
      lowerUsername.includes(profaneWord.toLowerCase())
    );

    if (containsBadWord || containsProfaneWord) {
      return "Username contains inappropriate language";
    }

    // Check for valid characters (letters, numbers, spaces, basic punctuation)
    const validPattern = /^[a-zA-Z0-9\s\-_.]+$/;
    if (!validPattern.test(username)) {
      return "Username can only contain letters, numbers, spaces, hyphens, underscores, and periods";
    }

    return null;
  };

  const validateAndProcessImage = (file: File) => {
    // Clear previous image error
    setErrors(prev => ({ ...prev, image: undefined }));

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, image: 'Please select a valid image file' }));
      return false;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image must be smaller than 5MB' }));
      return false;
    }

    setEditedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    return true;
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndProcessImage(file);
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
      <DialogContent className="sm:max-w-lg bg-white/90 backdrop-blur-md border border-white/20 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-gray-900">Edit Profile</DialogTitle>
          <DialogDescription className="text-gray-600">
            Update your display name and profile picture
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Image Section with Drag & Drop */}
          <div className="flex flex-col items-center gap-4">
            <div 
              className={`relative group cursor-pointer transition-all duration-200`}
              onClick={() => !isSaving && fileInputRef.current?.click()}
            >
              <div className={`w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-4 transition-all duration-200`}>
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                    width={128}
                    height={128}
                    unoptimized
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.25a7.75 7.75 0 0115 0v.25a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75v-.25z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Camera Icon Overlay */}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <div className="text-white text-center">
                  <Camera className="w-8 h-8 mx-auto mb-1" />
                  <p className="text-sm font-medium">Change Photo</p>
                </div>
              </div>

              {/* Camera Button */}
              <button
                disabled={isSaving}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors shadow-lg"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Click To Edit Your Profile Image
              </p>
            </div>

            {errors.image && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
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
          <div className="space-y-3">
            <label htmlFor="username" className="text-sm font-medium text-gray-700">
              Display Name
            </label>
            <Input
              id="username"
              value={editedName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter your display name"
              disabled={isSaving}
              className={`bg-white/80 border-gray-200 text-gray-900 placeholder:text-gray-500 ${
                errors.name ? "border-red-500 bg-red-50" : ""
              }`}
              maxLength={MAX_USERNAME_LENGTH}
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">
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

          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertTriangle className="w-4 h-4" />
                {errors.general}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isSaving}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving || !!errors.name || !!errors.image}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
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
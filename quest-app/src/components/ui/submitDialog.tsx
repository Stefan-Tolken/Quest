'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuest } from '@/context/questContext';
import { useState} from 'react';


interface SubmitDialogProps {
  open?: boolean;
  onClose?: () => void;
  scanResult: string | null | undefined;
  submitStatus: 'idle' | 'success' | 'already' | 'error' | null;
  message?: string | null;
  activeQuest: any; // Adjust type
  handleSubmit: () => void;
  handleViewArtefact: () => void;
  children?: React.ReactNode;
  finalSubmission: boolean;
  isSubmitting: boolean;
}

export default function SubmitDialog({
  open,
  onClose,
  scanResult,
  submitStatus,
  message,
  handleSubmit,
  handleViewArtefact,
  children,
  finalSubmission,
  isSubmitting
}: SubmitDialogProps) {
    const isControlled = typeof open !== 'undefined';
    const { 
        activeQuest,
        progress,
        submitArtefact: questSubmitArtefact,
        isNextSequential
    } = useQuest();

    const artefactLength = activeQuest?.artefacts.length;
    const currentArtefactLength = progress?.collectedArtefactIds.length; 

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (isControlled && !isOpen) {
          onClose?.();
        }
      }}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-md">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">
            {finalSubmission ? "Well Done!" : submitStatus === 'error' || submitStatus === 'already' ? "Oops!" : submitStatus === 'success' ? "Nice Job!" : "Ready to Submit?"}
          </DialogTitle>
          <DialogDescription>
            {finalSubmission ? 
              "You can head over to the completed Quests section to view your prize." : 
              submitStatus === 'error' ? "This seems to be the wrong artefact for this part of the Quest." :
              submitStatus === 'already' ? "This Artefact has already been submitted to this quest" :
              submitStatus === 'success' ? "You submitted the correct Artefact." :
              "This artefact can be submitted to your active quest."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm text-muted-foreground">
          {submitStatus === 'success' && (
            <div className="glass rounded-lg p-3 !bg-green-200/40">
              {finalSubmission ? "Quest Completed!" : "Artefact submitted!"}
            </div>
          )}

          {submitStatus === 'already' && (
            <div className="glass rounded-lg p-3 !bg-red-200/40">
              Already submitted.
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="glass rounded-lg p-3 !bg-blue-200/40">
              {message || 'Something went wrong. Try again.'}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row gap-2">
            <>
                {!children ? (                    
                    <Button onClick={handleViewArtefact} variant="glass" className="flex-1">
                        View Artefact
                    </Button>
                ) : (<></>)}
            </>
          <Button
            onClick={handleSubmit}
            variant="glassDark"
            className="flex-1"
            disabled={
              submitStatus === 'success' ||
              submitStatus === 'already' ||
              submitStatus === 'error' ||
              isSubmitting
            }
          >
            Submit Artefact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
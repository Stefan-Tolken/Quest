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
}: SubmitDialogProps) {
    const isControlled = typeof open !== 'undefined';
    const { 
        activeQuest,
        submitArtefact: questSubmitArtefact,
        isNextSequential
    } = useQuest();

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
          <DialogTitle className="text-xl">Ready to Submit?</DialogTitle>
          <DialogDescription>
            This artefact can be submitted to your active quest. Make sure you're happy with it — submissions are final!
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm text-muted-foreground">
          <p>
            Submitting this artefact will mark it as part of your progress in <strong>your current quest</strong>.
          </p>

          {!submitStatus && scanResult && !isNextSequential(scanResult) && (
            <div className="glass rounded-lg p-3 !bg-yellow-200/40">
              This may not be the correct artefact for the current step in your quest.
            </div>
          )}

          {submitStatus === 'success' && (
            <div className="glass rounded-lg p-3 !bg-green-200/40">
              Artefact submitted!
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
              submitStatus === 'error'
            }
          >
            Submit Artefact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import { useEffect } from 'react';
import type { Hint, QuestProgress, MainQuest } from '@/lib/types';


// Separate component for hints display to properly handle hooks
export const HintsToDisplay = ({ 
  artefact, 
  questId, 
  hints,
  attempts,
  isCollected, 
  completed,
  displayedHints,
  onUpdateProgress 
}: { 
  artefact: MainQuest['artefacts'][0],
  questId: string,
  hints: Hint[],
  isCollected: boolean,
  attempts: number,
  completed: boolean,
  displayedHints: Record<string, boolean>,
  onUpdateProgress: (updates: Partial<QuestProgress>) => void
}) => {
  useEffect(() => {
    if (!isCollected && !completed) {
      hints.forEach((hint, idx) => {
        const hintKey = `${artefact.artefactId}-${idx}`;
        if (!displayedHints[hintKey]) {
          fetch(`/api/user-quest-progress`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questId: questId,
              artefactId: artefact.artefactId,
              displayedHint: { [hintKey]: true }
            })
          }).catch(console.error);

          onUpdateProgress({
            displayedHints: {
              ...displayedHints,
              [hintKey]: true
            }
          });
        }
      });
    }
  }, [artefact.artefactId, hints, isCollected, completed, displayedHints, questId, onUpdateProgress]);

  return (
    <>
      {hints.slice(0, attempts).map((hint, idx) => (
        <div 
          key={idx}
          className="text-sm glass p-3 rounded-md"
        >
          <div className="flex gap-2 items-center">
            <span className="font-medium">Hint {idx + 1}</span>
          </div>
          <p className="mt-1 text-muted-foreground">{hint.description}</p>
        </div>
      ))}
    </>
  );
};
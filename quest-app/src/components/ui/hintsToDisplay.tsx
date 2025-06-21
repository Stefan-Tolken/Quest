import { useEffect } from 'react';
import type { Hint, QuestProgress, MainQuest } from '@/lib/types';
import { useQuest } from '@/context/questContext';
import { useMemo } from 'react';

// Separate component for hints display to properly handle hooks
export const HintsToDisplay = ({ 
  artefact, 
  questId, 
  isCollected, 
  completed
}: { 
  artefact: MainQuest['artefacts'][0],
  questId: string,
  isCollected: boolean,
  completed: boolean,
}) => {
  // Get context from useQuest hook directly
  const { 
    progress, 
    getCurrentArtefactHints,
    getCurrentArtefactAttempts,
    updateProgress
  } = useQuest();

  // Get hints for the current artifact
  const hints = getCurrentArtefactHints(artefact.artefactId);
  
  // Get attempts for the current artifact
  const attempts = getCurrentArtefactAttempts(artefact.artefactId);

  const displayedHints = useMemo(() => progress?.displayedHints || {}, [progress]);

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

          updateProgress({
            displayedHints: {
              ...displayedHints,
              [hintKey]: true
            }
          });
        }
      });
    }
  }, [artefact.artefactId, hints, isCollected, completed, displayedHints, questId, updateProgress]);

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
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { LineChart, X, Trophy, Clock, Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import LeaderboardComponent from "@/components/ui/leaderboard";

interface LeaderboardModalProps {
  questId: string;
  questTitle: string;
  isAdmin?: boolean;
  userId?: string;
  userEmail?: string;
  buttonVariant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function LeaderboardModal({
  questId,
  questTitle,
  isAdmin = false,
  userId,
  userEmail,
  buttonVariant = "default",
  buttonSize = "sm",
  className = "",
}: LeaderboardModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        className={`flex items-center gap-1 ${className}`}
        onClick={() => setIsOpen(true)}
      >
        <LineChart className="h-4 w-4" />
        Leaderboard
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-lg shadow-xl border max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Trophy className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Leaderboard
                  </h3>
                  <p className="text-sm text-gray-500">
                    View completion statistics for this quest
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <LeaderboardComponent
                questId={questId}
                questTitle={questTitle}
                isAdmin={isAdmin}
                userId={userId}
                userEmail={userEmail}
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50/30">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
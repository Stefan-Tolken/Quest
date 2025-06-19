import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LineChart } from "lucide-react";
import LeaderboardComponent from "@/components/ui/leaderboard";

interface LeaderboardModalProps {
  questId: string;
  questTitle: string;
  isAdmin?: boolean;
  userId?: string;
  userEmail?: string; // Add userEmail prop
  buttonVariant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function LeaderboardModal({
  questId,
  questTitle,
  isAdmin = false,
  userId,
  userEmail, // Accept userEmail prop
  buttonVariant = "default",
  buttonSize = "sm",
  className = "",
}: LeaderboardModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={buttonVariant}
          size={buttonSize}
          className={`flex items-center gap-1 ${className}`}
        >
          <LineChart className="h-4 w-4" />
          Leaderboard
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Leaderboard</DialogTitle>
          <DialogDescription>
            View completion statistics for this quest
          </DialogDescription>
        </DialogHeader>
        {/* Only render LeaderboardComponent when modal is open */}
        {isOpen && (
          <LeaderboardComponent
            questId={questId}
            questTitle={questTitle}
            isAdmin={isAdmin}
            userId={userId}
            userEmail={userEmail}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
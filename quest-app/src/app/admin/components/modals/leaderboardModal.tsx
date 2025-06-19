import React from "react";
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
  buttonVariant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function LeaderboardModal({
  questId,
  questTitle,
  isAdmin = false,
  userId,
  buttonVariant = "default",
  buttonSize = "sm",
  className = "",
}: LeaderboardModalProps) {
  return (
    <Dialog>
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
        <LeaderboardComponent
          questId={questId}
          questTitle={questTitle}
          isAdmin={isAdmin}
          userId={userId}
        />
      </DialogContent>
    </Dialog>
  );
}
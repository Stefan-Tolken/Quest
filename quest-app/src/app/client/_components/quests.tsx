'use client';
import { useEffect, useState } from 'react';
import { useQuest } from '@/context/questContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Quest {
  quest_id: string;
  title: string;
  description: string;
  artifacts: Array<{
    id: string;
    hints: Array<{
      description: string;
      displayAfterAttempts: number;
    }>;
    hintDisplayMode: 'sequential' | 'random';
  }>;
  questType: 'sequential' | 'concurrent';
  dateRange?: {
    from: string;
    to: string;
  };
  prize?: {
    title: string;
    description: string;
    imageBase64?: string;
  };
  createdAt: string;
}

export default function Quests() {
  const { activeQuest, acceptQuest, cancelQuest } = useQuest();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const res = await fetch('/api/get-quests');
        const data = await res.json();
        setQuests(data.quests || []);
      } catch (err) {
        console.error('Failed to fetch quests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuests();
  }, []);

  if (loading) return <div className="p-6">Loading quests...</div>;
  if (!quests.length) return <div className="p-6">No quests available.</div>;

  return (
    <div className="p-6 gap-6 flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Quests</h1>
      {quests.map((quest) => (
        <div
          key={quest.quest_id}
          className="bg-gray-100 p-4 rounded shadow-sm flex flex-col gap-2"
        >
          <h2 className="text-xl font-semibold">{quest.title}</h2>
          <p className="text-gray-700">{quest.description}</p>

          {activeQuest?.quest_id === quest.quest_id ? (
            <Button 
              onClick={() => cancelQuest()}
              variant={"destructive"}
            >
              Cancel Quest
            </Button>
          ) : activeQuest ? (
            <></>
          ) : (
            <Button
              onClick={() => acceptQuest(quest)}
              variant={"default"}
            >
              Accept Quest
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
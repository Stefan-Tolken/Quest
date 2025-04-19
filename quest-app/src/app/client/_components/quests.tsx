'use client';
import { mockQuests } from '@/lib/mockData';
import { useQuest } from '@/context/questContext';
import { useRouter } from 'next/navigation';

export default function Quests() {
  const { activeQuest, acceptQuest } = useQuest();
  const router = useRouter();

  const quest = mockQuests[0]; // Only one for now

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Current Quest</h1>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-xl font-semibold">{quest.title}</h2>
        <p className="text-gray-700">{quest.description}</p>

        {!activeQuest && (
          <button
            onClick={() => {
              acceptQuest(quest);
            }}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Accept Quest
          </button>
        )}
        {activeQuest && <p className="mt-4 text-green-600">Quest already accepted!</p>}
      </div>
    </div>
  );
}
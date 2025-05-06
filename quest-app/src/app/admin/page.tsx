'use client';

import { useData } from '@/context/dataContext';
import type { Artefact, Quest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminHome() {
  const { artefacts, quests, loading, error } = useData();
  const router = useRouter();

  if (loading) {
    return (
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-[90vh] p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
          <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-4xl">
              <div className="flex flex-col w-full gap-8">
                <div>
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                  <p className="text-sm text-gray-500 mb-6">Manage your quests and artefacts here.</p>
                </div>
                  
                <p>Loading...</p>
              </div>                
          </main>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-[90vh] p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-4xl">
            <div className="flex flex-col w-full gap-8">
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-gray-500 mb-6">Manage your quests and artefacts here.</p>
              </div>
                
              <div className='bg-white shadow-sm rounded-lg p-6'>
                <div className='flex justify-between items-center mb-4'>
                  <h2 className="text-xl font-semibold mb-4">Quests</h2>
                  <Button
                      variant="default"
                      onClick={() => router.push('/admin/page-builder')}
                  >
                      Create New Quest
                  </Button>
                </div>
                <div className="space-y-3">
                    {quests.map((quest) => (
                        <Button
                            key={quest.id}
                            variant="outline"
                            className="w-full justify-between px-4 py-6 text-left hover:border-indigo-500 group"
                            onClick={() => {}}
                        >
                            <div>
                                <h3 className="font-medium text-base group-hover:text-indigo-600">
                                    {quest.title}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                    {quest.description}
                                </p>
                            </div>
                            <Edit className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
                        </Button>
                    ))}
                </div>
              </div>

              <div className='bg-white shadow-sm rounded-lg p-6'>
                <div className='flex justify-between items-center mb-4'>
                  <h2 className="text-xl font-semibold mb-4">Artefacts</h2>
                  <Button
                      variant="default"
                      onClick={() => router.push('/admin/page-builder')}
                  >
                      Create New artefact
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {artefacts.map((artefact) => (
                        <Button
                            key={artefact.id}
                            variant="outline"
                            className="w-full justify-between px-4 py-6 text-left hover:border-indigo-500 group"
                            onClick={() => {}}
                        >
                            <div>
                                <h3 className="font-medium text-base group-hover:text-indigo-600">
                                    {artefact.name}
                                </h3>
                            </div>
                            <Edit className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
                        </Button>
                    ))}                        
                </div>
              </div>
            </div>                
        </main>
    </div>
  );
}
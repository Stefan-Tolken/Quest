export type Quest = {
    id: string;
    title: string;
    description: string;
    requiredArtefactIds: string[];
  };
  
  export type Artefact = {
    id: string;
    name: string;
    description: string;
    image: string;
  };
  
  export const mockQuests: Quest[] = [
    {
      id: 'quest-001',
      title: 'The Lost Relic',
      description: 'Find and submit the ancient relic hidden in the ruins.',
      requiredArtefactIds: ['artefact-002'],
    },
  ];
  
  export const mockArtefacts: Artefact[] = [
    {
      id: 'artefact-001',
      name: 'Broken Sword',
      description: 'A rusty sword from an old battle.',
      image: '/images/sword.png',
    },
    {
      id: 'artefact-002',
      name: 'Ancient Relic',
      description: 'A mysterious artefact glowing with power.',
      image: '/images/relic.png',
    },
    {
      id: 'artefact-003',
      name: 'Old Scroll',
      description: 'An unreadable scroll of forgotten knowledge.',
      image: '/images/scroll.png',
    },
  ];
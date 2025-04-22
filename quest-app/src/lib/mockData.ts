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
    {
      id: 'artefact-004',
      name: 'Golden Chalice',
      description: 'A chalice made of pure gold, encrusted with jewels.',
      image: '/images/chalice.png',
    },
    {
      id: 'artefact-005',
      name: 'Mystic Amulet',
      description: 'An amulet said to protect its wearer from harm.',
      image: '/images/amulet.png',
    },
    {
      id: 'artefact-006',
      name: 'Crystal Orb',
      description: 'A clear orb that seems to hold swirling mist inside.',
      image: '/images/orb.png',
    },
    {
      id: 'artefact-007',
      name: 'Ancient Coin',
      description: 'A coin from a long-lost civilization.',
      image: '/images/coin.png',
    },
    {
      id: 'artefact-008',
      name: 'Enchanted Ring',
      description: 'A ring that glows faintly in the dark.',
      image: '/images/ring.png',
    },
    {
      id: 'artefact-009',
      name: 'Dragon Scale',
      description: 'A shimmering scale from a legendary dragon.',
      image: '/images/scale.png',
    },
    {
      id: 'artefact-010',
      name: 'Runed Tablet',
      description: 'A stone tablet covered in glowing runes.',
      image: '/images/tablet.png',
    },
    {
      id: 'artefact-011',
      name: 'Phoenix Feather',
      description: 'A feather from the mythical phoenix.',
      image: '/images/feather.png',
    },
    {
      id: 'artefact-012',
      name: 'Cursed Dagger',
      description: 'A dagger that hums with dark energy.',
      image: '/images/dagger.png',
    },
    {
      id: 'artefact-013',
      name: 'Elven Bow',
      description: 'A finely crafted bow of elven origin.',
      image: '/images/bow.png',
    },
  ];
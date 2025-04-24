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
    group: string;
  };
  
  export const mockQuests: Quest[] = [
    {
      id: 'quest-001',
      title: 'The Wave Chaser',
      description: 'Locate and submit the famous woodblock print depicting a giant wave.',
      requiredArtefactIds: ['artefact-008'],
    },
  ];
  
  export const mockArtefacts: Artefact[] = [
  {
    id: 'artefact-001',
    name: 'Mona Lisa',
    description: 'A portrait painting by Leonardo da Vinci, famous for its enigmatic expression.',
    group: 'Paintings',
  },
  {
    id: 'artefact-002',
    name: 'Rosetta Stone',
    description: 'An ancient Egyptian stone slab inscribed with three scripts, key to deciphering hieroglyphs.',
    group: 'Historical Inscriptions',
  },
  {
    id: 'artefact-003',
    name: 'Venus de Milo',
    description: 'An ancient Greek statue of the goddess Aphrodite, renowned for its beauty despite missing arms.',
    group: 'Sculptures',
  },
  {
    id: 'artefact-004',
    name: 'Terracotta Warrior',
    description: 'A life-sized clay soldier from the Terracotta Army of China’s first emperor.',
    group: 'Sculptures',
  },
  {
    id: 'artefact-005',
    name: 'The Starry Night',
    description: 'A famous painting by Vincent van Gogh depicting a swirling night sky.',
    group: 'Paintings',
  },
  {
    id: 'artefact-006',
    name: 'The Thinker',
    description: 'A bronze sculpture by Auguste Rodin representing deep thought.',
    group: 'Sculptures',
  },
  {
    id: 'artefact-007',
    name: 'Tutankhamun’s Mask',
    description: 'A golden funerary mask of the ancient Egyptian pharaoh Tutankhamun.',
    group: 'Historical Artefacts',
  },
  {
    id: 'artefact-008',
    name: 'The Great Wave off Kanagawa',
    description: 'A famous woodblock print by Hokusai depicting a giant wave.',
    group: 'Prints',
  },
  {
    id: 'artefact-009',
    name: 'David',
    description: 'A marble statue by Michelangelo representing the biblical hero David.',
    group: 'Sculptures',
  },
  {
    id: 'artefact-010',
    name: 'The Persistence of Memory',
    description: 'A surreal painting by Salvador Dalí featuring melting clocks.',
    group: 'Paintings',
  },
  {
    id: 'artefact-011',
    name: 'Liberty Bell',
    description: 'An iconic symbol of American independence, cracked but preserved.',
    group: 'Historical Artefacts',
  },
  {
    id: 'artefact-012',
    name: 'The Scream',
    description: 'An expressionist painting by Edvard Munch depicting a figure in anguish.',
    group: 'Paintings',
  },
  {
    id: 'artefact-013',
    name: 'Winged Victory of Samothrace',
    description: 'An ancient Greek statue of the goddess Nike, symbolizing victory.',
    group: 'Sculptures',
  },
  {
    id: 'artefact-014',
    name: 'Code of Hammurabi',
    description: 'A Babylonian stone stele inscribed with one of the earliest legal codes.',
    group: 'Historical Inscriptions',
  },
  {
    id: 'artefact-015',
    name: 'Guernica',
    description: 'A mural-sized painting by Pablo Picasso depicting the horrors of war.',
    group: 'Paintings',
  },
  {
    id: 'artefact-016',
    name: 'The Last Supper',
    description: 'A mural painting by Leonardo da Vinci depicting Jesus and his disciples.',
    group: 'Paintings',
  },
  {
    id: 'artefact-017',
    name: 'The Book of Kells',
    description: 'An illuminated manuscript Gospel book created by Celtic monks.',
    group: 'Manuscripts',
  },
  {
    id: 'artefact-018',
    name: 'The Discus Thrower',
    description: 'An ancient Greek statue capturing the motion of a discus thrower.',
    group: 'Sculptures',
  },
  {
    id: 'artefact-019',
    name: 'The Bayeux Tapestry',
    description: 'A medieval embroidery depicting the Norman conquest of England.',
    group: 'Textiles',
  },
  {
    id: 'artefact-020',
    name: 'The Dead Sea Scrolls',
    description: 'Ancient Jewish manuscripts discovered in the Qumran Caves.',
    group: 'Manuscripts',
  },
  ];
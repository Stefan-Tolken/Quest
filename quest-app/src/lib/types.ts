export type Artefact = {
    id: string;
    name: string;
    components: {
        id: string;
        name: string;
    }[];
    createdAt: string;
    partOfQuest: boolean;
};

export type Quest = {
    quest_id: string;
    title: string;
    description: string;
    artifacts: string[];
    questType: string;
    dateRange?: {
        from: string;
        to: string;
    };
    prize?: {
        title: string;
        description: string;
    };
    createdAt: string;
};
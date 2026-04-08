export type Era = 'ancient_rome' | 'joseon' | 'victorian' | 'renaissance';
export type Gender = 'male' | 'female' | 'non_binary';

export interface Character {
  id: string;
  name: string;
  gender: Gender;
  era: Era;
  role: string;
  description: string;
  traits: string[];
  imageUrl?: string;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
}

export interface SavedStory {
  id: string;
  character: Character;
  messages: Message[];
  lastUpdated: number;
}

export const ERA_DATA: Record<Era, { label: string; description: string; defaultRoles: string[]; traits: string[] }> = {
  ancient_rome: {
    label: '고대 로마',
    description: '공화정과 제국의 영광이 공존하는 시대',
    defaultRoles: ['군단병', '의원', '검투사', '상인'],
    traits: ['용맹한', '지혜로운', '야심찬', '충성스러운'],
  },
  joseon: {
    label: '조선 시대',
    description: '유교적 질서와 선비 정신의 나라',
    defaultRoles: ['선비', '무관', '기생', '암행어사'],
    traits: ['강직한', '풍류를 아는', '정의로운', '냉철한'],
  },
  victorian: {
    label: '빅토리아 시대',
    description: '산업 혁명과 대영 제국의 전성기',
    defaultRoles: ['탐정', '귀족', '공장 노동자', '발명가'],
    traits: ['신사적인', '호기심 많은', '냉소적인', '예의 바른'],
  },
  renaissance: {
    label: '르네상스',
    description: '예술과 과학이 꽃피는 이탈리아',
    defaultRoles: ['화가', '조각가', '은행가', '학자'],
    traits: ['창의적인', '열정적인', '계산적인', '우아한'],
  },
};

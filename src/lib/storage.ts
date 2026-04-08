import { SavedStory } from '../types';

const STORAGE_KEY = 'historical_rpg_stories';

export const storage = {
  saveStory: (story: SavedStory) => {
    const stories = storage.getStories();
    const index = stories.findIndex(s => s.id === story.id);
    if (index >= 0) {
      stories[index] = { ...story, lastUpdated: Date.now() };
    } else {
      stories.push({ ...story, lastUpdated: Date.now() });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
  },

  getStories: (): SavedStory[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse stories', e);
      return [];
    }
  },

  deleteStory: (id: string) => {
    const stories = storage.getStories().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
  }
};

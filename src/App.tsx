/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import CharacterCreator from './components/CharacterCreator';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import { Character, SavedStory, Message } from './types';
import { ScrollText, Home } from 'lucide-react';

type View = 'dashboard' | 'creator' | 'chat';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [activeStoryId, setActiveStoryId] = useState<string>('');

  const handleNewStory = () => {
    setActiveCharacter(null);
    setActiveMessages([]);
    const newId = typeof crypto.randomUUID === 'function' 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setActiveStoryId(newId);
    setView('creator');
  };

  const handleLoadStory = (story: SavedStory) => {
    setActiveCharacter(story.character);
    setActiveMessages(story.messages);
    setActiveStoryId(story.id);
    setView('chat');
  };

  const handleCharacterComplete = (char: Character) => {
    setActiveCharacter(char);
    setView('chat');
  };

  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center p-4 sm:p-8 selection:bg-accent/20">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/paper.png')]" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-accent rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent rounded-full blur-[120px]" />
      </div>

      <header className="mb-12 text-center relative z-10 w-full max-w-5xl flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 px-4 py-2 bg-accent/10 rounded-full text-accent"
          >
            <ScrollText size={18} />
            <span className="text-sm font-bold tracking-widest uppercase">Chronicles of Time</span>
          </motion.div>
          
          {view !== 'dashboard' && (
            <button
              onClick={() => setView('dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white rounded-full text-accent font-bold transition-all shadow-sm"
            >
              <Home size={18} />
              <span>서재로 돌아가기</span>
            </button>
          )}
        </div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-5xl sm:text-6xl font-serif font-bold text-ink mb-4"
        >
          역사 속으로
        </motion.h1>
      </header>

      <main className="w-full max-w-5xl relative z-10 flex-1">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Dashboard onNewStory={handleNewStory} onLoadStory={handleLoadStory} />
            </motion.div>
          )}

          {view === 'creator' && (
            <motion.div
              key="creator"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
            >
              <CharacterCreator onComplete={handleCharacterComplete} />
            </motion.div>
          )}

          {view === 'chat' && activeCharacter && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ChatInterface 
                character={activeCharacter} 
                initialMessages={activeMessages}
                storyId={activeStoryId}
                onReset={() => setView('dashboard')} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-12 text-ink/30 text-xs font-serif italic relative z-10">
        © 2026 Chronicles of Time - AI Historical Roleplay
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SavedStory, ERA_DATA } from '../types';
import { storage } from '../lib/storage';
import { Plus, Trash2, Play, Clock, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  onNewStory: () => void;
  onLoadStory: (story: SavedStory) => void;
}

export default function Dashboard({ onNewStory, onLoadStory }: Props) {
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const loadedStories = storage.getStories().sort((a, b) => b.lastUpdated - a.lastUpdated);
    setStories(loadedStories);
  }, []);

  const handleDelete = (id: string) => {
    storage.deleteStory(id);
    setDeleteId(null);
    setStories(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif font-bold text-accent flex items-center gap-3">
          <BookOpen size={32} /> 나의 서재
        </h2>
        <button
          onClick={onNewStory}
          className="px-6 py-3 bg-accent text-white rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
        >
          <Plus size={20} /> 새로운 이야기 시작
        </button>
      </div>

      {stories.length === 0 ? (
        <div className="text-center py-20 bg-white/30 backdrop-blur-sm rounded-3xl border-2 border-dashed border-accent/20">
          <p className="text-ink/40 font-serif italic">아직 기록된 이야기가 없습니다. 새로운 모험을 시작해보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stories.map(story => (
            <motion.div
              key={story.id}
              whileHover={{ y: -5 }}
              onClick={() => onLoadStory(story)}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-accent/10 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
            >
              {story.character.imageUrl && (
                <div 
                  className="absolute inset-0 opacity-[0.05] grayscale pointer-events-none"
                  style={{ 
                    backgroundImage: `url(${story.character.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
              )}
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {story.character.imageUrl ? (
                      <img 
                        src={story.character.imageUrl} 
                        className="w-12 h-12 rounded-full object-cover border border-accent/20" 
                        alt={story.character.name}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent font-serif font-bold">
                        {story.character.name[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-serif font-bold text-ink">{story.character.name}</h3>
                      <p className="text-xs text-ink/60">
                        {ERA_DATA[story.character.era].label} | {story.character.role} | {story.character.gender === 'male' ? '남성' : story.character.gender === 'female' ? '여성' : '기타'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(story.id);
                    }}
                    className="p-2 text-ink/20 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs text-ink/40 mt-6">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {new Date(story.lastUpdated).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Play size={14} />
                    {story.messages.length}개의 대화
                  </div>
                </div>
              </div>

              {/* Delete Confirmation Overlay */}
              <AnimatePresence>
                {deleteId === story.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-red-500/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 p-4 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-white font-bold mb-4">이 이야기를 영구적으로 삭제할까요?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDelete(story.id)}
                        className="px-4 py-2 bg-white text-red-600 rounded-lg font-bold text-sm"
                      >
                        삭제
                      </button>
                      <button
                        onClick={() => setDeleteId(null)}
                        className="px-4 py-2 bg-white/20 text-white rounded-lg font-bold text-sm"
                      >
                        취소
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

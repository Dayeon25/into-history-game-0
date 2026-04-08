import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Character, Message, SavedStory } from '../types';
import { generateHistoricalResponse } from '../services/geminiService';
import { Send, User, Bot, Loader2, RefreshCcw, Save, Edit2, Trash2, Check, X, History } from 'lucide-react';
import { cn } from '../lib/utils';
import { storage } from '../lib/storage';

interface Props {
  character: Character;
  initialMessages?: Message[];
  storyId: string;
  onReset: () => void;
}

export default function ChatInterface({ character, initialMessages = [], storyId, onReset }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<number>(Date.now());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Initial greeting if no messages
  useEffect(() => {
    if (messages.length === 0) {
      const init = async () => {
        setIsLoading(true);
        try {
          const response = await generateHistoricalResponse(
            character,
            [],
            "역할 놀이를 시작해줘. 당신은 누구이며 지금 어떤 상황인지 묘사하며 인사를 건네줘."
          );
          const newMsg: Message = { role: 'model', content: response };
          setMessages([newMsg]);
          saveToStorage([newMsg]);
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      };
      init();
    }
  }, [character]);

  const saveToStorage = (updatedMessages: Message[]) => {
    const story: SavedStory = {
      id: storyId,
      character,
      messages: updatedMessages,
      lastUpdated: Date.now()
    };
    storage.saveStory(story);
    setLastSaved(Date.now());
  };

  const handleSend = async (customInput?: string, overrideMessages?: Message[]) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || isLoading) return;

    const currentMessages = overrideMessages || messages;
    const userMsg: Message = { role: 'user', content: textToSend };
    const newMessages = [...currentMessages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateHistoricalResponse(
        character,
        currentMessages,
        textToSend
      );
      const modelMsg: Message = { role: 'model', content: response };
      const finalMessages = [...newMessages, modelMsg];
      setMessages(finalMessages);
      saveToStorage(finalMessages);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "죄송합니다. 시공간의 뒤틀림이 발생했습니다. 다시 시도해주세요." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMessage = (index: number) => {
    // When deleting a user message, we should also delete the subsequent AI response
    const newMessages = messages.filter((_, i) => i !== index && i !== index + 1);
    setMessages(newMessages);
    saveToStorage(newMessages);
  };

  const startEditing = (index: number, content: string) => {
    setEditingIndex(index);
    setEditValue(content);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const saveEdit = async (index: number) => {
    if (!editValue.trim()) return;
    
    // Truncate messages up to this point and re-generate
    const baseMessages = messages.slice(0, index);
    setEditingIndex(null);
    await handleSend(editValue, baseMessages);
  };

  const getMessageAvatar = (msg: Message) => {
    if (msg.role === 'user') {
      return character.imageUrl || `https://picsum.photos/seed/player-${storyId}/200/200`;
    }
    
    // Try to detect a speaker in the message content (e.g., "**Name**: ...")
    const speakerMatch = msg.content.match(/^(\*\*|__)?([^:*]+)(\*\*|__)?\s*[:：]/);
    if (speakerMatch) {
      const speakerName = speakerMatch[2].trim();
      // If the speaker name is the same as the user's character name, it's probably a mistake in the model's output or a self-reference, 
      // but usually the model plays other characters.
      return `https://picsum.photos/seed/npc-${speakerName}/200/200`;
    }

    // Default image for the "History Master" or unnamed NPC - using a seed that's more likely to be a person
    return `https://picsum.photos/seed/person-${character.era}-narrator/200/200`;
  };

  return (
    <div className="flex flex-col h-[80vh] max-w-4xl mx-auto bg-white/40 backdrop-blur-md rounded-3xl shadow-2xl border border-accent/10 overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-accent text-white flex justify-between items-center">
        <div className="flex items-center gap-4">
          {character.imageUrl ? (
            <div className="w-16 h-16 rounded-full border-2 border-white/30 overflow-hidden shrink-0 shadow-inner">
              <img 
                src={character.imageUrl} 
                alt={character.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl font-serif shrink-0">
              {character.name[0]}
            </div>
          )}
          <div>
            <h2 className="text-xl font-serif font-bold">{character.name}</h2>
            <p className="text-xs opacity-80">{character.role} | {character.era}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] text-white/40 flex items-center gap-1 mr-2">
            <Save size={10} />
            저장됨: {new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button 
            onClick={onReset}
            className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2 text-sm"
          >
            <RefreshCcw size={16} /> 서재로
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth relative"
      >
        {character.imageUrl && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.03] grayscale mix-blend-multiply"
            style={{ 
              backgroundImage: `url(${character.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        )}
        <div className="relative z-10 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-4",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-sm border-2",
                  msg.role === 'user' ? "border-accent/20" : "border-white"
                )}>
                  <img 
                    src={getMessageAvatar(msg)} 
                    alt={msg.role}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className={cn(
                  "max-w-[80%] p-4 rounded-2xl shadow-sm relative group/msg",
                  msg.role === 'user' 
                    ? "bg-accent/10 text-ink rounded-tr-none" 
                    : "bg-white text-ink rounded-tl-none border border-accent/5"
                )}>
                  {editingIndex === i ? (
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full bg-white border border-accent/20 rounded p-2 text-ink outline-none focus:border-accent h-24 resize-none text-sm"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={cancelEditing} className="p-1 hover:bg-accent/10 rounded text-ink/40"><X size={16} /></button>
                        <button onClick={() => saveEdit(i)} className="p-1 hover:bg-accent/10 rounded text-accent"><Check size={16} /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none prose-stone">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}

                  {/* Message Actions */}
                  {msg.role === 'user' && editingIndex !== i && !isLoading && (
                    <div className={cn(
                      "absolute top-0 opacity-0 group-hover/msg:opacity-100 transition-opacity flex gap-1",
                      msg.role === 'user' ? "right-full mr-2" : "left-full ml-2"
                    )}>
                      <button 
                        onClick={() => startEditing(i, msg.content)}
                        className="p-1.5 bg-white/80 hover:bg-white rounded-full text-ink/40 hover:text-accent transition-colors shadow-sm border border-accent/10"
                        title="수정"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        onClick={() => deleteMessage(i)}
                        className="p-1.5 bg-white/80 hover:bg-white rounded-full text-ink/40 hover:text-red-500 transition-colors shadow-sm border border-accent/10"
                        title="삭제"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-sm border-2 border-white relative bg-accent/10">
                <img 
                  src={`https://picsum.photos/seed/narrator-${character.era}/200/200`} 
                  alt="Loading"
                  className="w-full h-full object-cover opacity-40 grayscale"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={16} className="animate-spin text-accent" />
                </div>
              </div>
              <div className="bg-white/50 p-4 rounded-2xl italic text-ink/40 text-sm">
                역사의 기록을 읽어오는 중...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white/50 border-t border-accent/10">
        <div className="relative">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="당신의 행동이나 대화를 입력하세요..."
            className="w-full p-4 pr-16 bg-white border-2 border-accent/10 rounded-2xl focus:border-accent outline-none transition-all resize-none h-24"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={cn(
              "absolute right-3 bottom-3 p-3 rounded-xl transition-all",
              input.trim() && !isLoading 
                ? "bg-accent text-white shadow-lg hover:scale-105" 
                : "bg-ink/10 text-ink/30 cursor-not-allowed"
            )}
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-[10px] text-ink/40 mt-2 text-center">
          Enter를 눌러 전송, Shift+Enter로 줄바꿈
        </p>
      </div>
    </div>
  );
}

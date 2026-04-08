import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Character, Era, ERA_DATA } from '../types';
import { cn } from '../lib/utils';
import { User, Scroll, MapPin, ChevronRight, History, Loader2, Image as ImageIcon } from 'lucide-react';
import { generateCharacterImage } from '../services/geminiService';

interface Props {
  onComplete: (char: Character) => void;
}

export default function CharacterCreator({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [char, setChar] = useState<Partial<Character>>({
    name: '',
    gender: 'male',
    era: 'joseon',
    role: '',
    description: '',
    traits: [],
  });

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const isStepValid = () => {
    if (step === 1) return char.name && char.name.length > 0;
    if (step === 2) return !!char.gender;
    if (step === 3) return char.era;
    if (step === 4) return char.role;
    if (step === 5) return char.traits && char.traits.length > 0;
    return true;
  };

  const handleStart = async () => {
    setIsGeneratingImage(true);
    try {
      // Set a timeout for image generation
      const imagePromise = generateCharacterImage(char as Character);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("TIMEOUT")), 15000)
      );
      
      const imageUrl = await Promise.race([imagePromise, timeoutPromise]) as string | null;
      onComplete({ ...char, imageUrl: imageUrl || undefined } as Character);
    } catch (error) {
      console.error("Image generation failed or timed out", error);
      onComplete(char as Character);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const toggleTrait = (trait: string) => {
    const current = char.traits || [];
    if (current.includes(trait)) {
      setChar({ ...char, traits: current.filter(t => t !== trait) });
    } else {
      setChar({ ...char, traits: [...current, trait] });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl border border-accent/20">
      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-3xl font-serif font-bold text-accent">캐릭터 생성</h2>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className={cn(
                "w-3 h-3 rounded-full transition-colors",
                step >= i ? "bg-accent" : "bg-accent/20"
              )}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User size={16} /> 당신의 이름은 무엇입니까?
              </label>
              <input
                type="text"
                value={char.name}
                onChange={e => setChar({ ...char, name: e.target.value })}
                placeholder="예: 홍길동, 마르쿠스..."
                className="w-full p-4 bg-parchment/30 border-b-2 border-accent/30 focus:border-accent outline-none transition-colors text-xl font-serif"
              />
            </div>
            <p className="text-sm text-ink/60 italic">역사 속에서 불릴 당신의 이름을 정해주세요.</p>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <label className="text-sm font-medium flex items-center gap-2">
              <User size={16} /> 성별을 선택해주세요.
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'male', label: '남성' },
                { id: 'female', label: '여성' },
                { id: 'non_binary', label: '기타' }
              ].map(g => (
                <button
                  key={g.id}
                  onClick={() => setChar({ ...char, gender: g.id as any })}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all font-serif font-bold",
                    char.gender === g.id
                      ? "border-accent bg-accent text-white"
                      : "border-accent/10 bg-white hover:border-accent/40"
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <label className="text-sm font-medium flex items-center gap-2">
              <History size={16} /> 어느 시대로 떠나시겠습니까?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(Object.keys(ERA_DATA) as Era[]).map(eraKey => (
                <button
                  key={eraKey}
                  onClick={() => setChar({ ...char, era: eraKey, role: '', traits: [] })}
                  className={cn(
                    "p-6 text-left rounded-xl border-2 transition-all group",
                    char.era === eraKey
                      ? "border-accent bg-accent/5 shadow-md"
                      : "border-accent/10 hover:border-accent/40 bg-white"
                  )}
                >
                  <h3 className="text-xl font-serif font-bold group-hover:text-accent transition-colors">
                    {ERA_DATA[eraKey].label}
                  </h3>
                  <p className="text-sm text-ink/60 mt-1">{ERA_DATA[eraKey].description}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <label className="text-sm font-medium flex items-center gap-2">
              <Scroll size={16} /> 당신의 역할은 무엇입니까?
            </label>
            <div className="flex flex-wrap gap-3">
              {ERA_DATA[char.era as Era].defaultRoles.map(role => (
                <button
                  key={role}
                  onClick={() => setChar({ ...char, role })}
                  className={cn(
                    "px-6 py-3 rounded-full border-2 transition-all",
                    char.role === role
                      ? "bg-accent text-white border-accent"
                      : "bg-white border-accent/20 hover:border-accent/50"
                  )}
                >
                  {role}
                </button>
              ))}
              <input
                type="text"
                value={char.role && !ERA_DATA[char.era as Era].defaultRoles.includes(char.role) ? char.role : ''}
                onChange={e => setChar({ ...char, role: e.target.value })}
                placeholder="직접 입력..."
                className="px-6 py-3 rounded-full border-2 border-dashed border-accent/30 bg-transparent outline-none focus:border-accent"
              />
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <label className="text-sm font-medium flex items-center gap-2">
              <User size={16} /> 당신의 성격이나 특징을 선택해주세요.
            </label>
            <div className="flex flex-wrap gap-3">
              {ERA_DATA[char.era as Era].traits.map(trait => (
                <button
                  key={trait}
                  onClick={() => toggleTrait(trait)}
                  className={cn(
                    "px-6 py-3 rounded-full border-2 transition-all",
                    char.traits?.includes(trait)
                      ? "bg-accent text-white border-accent"
                      : "bg-white border-accent/20 hover:border-accent/50"
                  )}
                >
                  {trait}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 6 && (
          <motion.div
            key="step6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin size={16} /> 당신에 대해 더 자세히 알려주세요 (선택)
            </label>
            <textarea
              value={char.description}
              onChange={e => setChar({ ...char, description: e.target.value })}
              placeholder="예: 몰락한 귀족의 자제로서 복수를 꿈꾸고 있습니다..."
              className="w-full p-4 bg-parchment/30 border-2 border-accent/10 rounded-xl focus:border-accent outline-none transition-colors h-32 resize-none"
            />
            <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
              <h4 className="font-serif font-bold text-accent mb-2">설정 요약</h4>
              <p className="text-sm">
                <strong>{ERA_DATA[char.era as Era].label}</strong>의 <strong>{char.traits?.join(', ')} {char.gender === 'male' ? '남성' : char.gender === 'female' ? '여성' : '기타'} {char.role}</strong>, 
                <span className="text-lg font-serif ml-1">"{char.name}"</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-12 flex justify-between">
        {step > 1 && !isGeneratingImage ? (
          <button
            onClick={handleBack}
            className="px-6 py-2 text-accent font-medium hover:underline"
          >
            이전으로
          </button>
        ) : <div />}
        
        <button
          disabled={!isStepValid() || isGeneratingImage}
          onClick={step === 6 ? handleStart : handleNext}
          className={cn(
            "px-8 py-3 bg-accent text-white rounded-xl font-bold flex items-center gap-2 transition-all",
            (!isStepValid() || isGeneratingImage) ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95 shadow-lg"
          )}
        >
          {isGeneratingImage ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              초상화 그리는 중...
            </>
          ) : step === 6 ? (
            <>
              모험 시작하기
              <ChevronRight size={18} />
            </>
          ) : (
            <>
              다음으로
              <ChevronRight size={18} />
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {isGeneratingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-parchment/80 backdrop-blur-md flex flex-col items-center justify-center z-50 rounded-2xl"
          >
            <div className="relative">
              <div className="w-24 h-24 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
              <ImageIcon className="absolute inset-0 m-auto text-accent" size={32} />
            </div>
            <h3 className="mt-6 text-2xl font-serif font-bold text-accent">초상화를 그리고 있습니다</h3>
            <p className="mt-2 text-ink/60 italic">역사 속 당신의 모습을 화폭에 담는 중입니다...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

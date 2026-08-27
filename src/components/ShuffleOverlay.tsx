import React, { useEffect, useState } from 'react';
import { soundManager } from '../utils/soundEffects';

interface ShuffleOverlayProps {
  isOpen: boolean;
  countdownSeconds: number;
  useSound: boolean;
  onFinish: () => void;
}

const SUSPENSE_MESSAGES = [
  '두근두근…!',
  '설레는 자리는 어디일까요?',
  '새로운 짝꿍 만날 준비 완료!',
  '과연 내 자리는?!',
  '자리 배치 완성 중…!',
];

export const ShuffleOverlay: React.FC<ShuffleOverlayProps> = ({
  isOpen,
  countdownSeconds,
  useSound,
  onFinish,
}) => {
  const [count, setCount] = useState(countdownSeconds);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setCount(countdownSeconds);
    setMessage(SUSPENSE_MESSAGES[Math.floor(Math.random() * SUSPENSE_MESSAGES.length)]);

    if (useSound) {
      soundManager.playTick();
    }

    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => {
            onFinish();
          }, 350);
          return 0;
        }
        if (useSound) {
          soundManager.playTick();
        }
        return prev - 1;
      });
    }, 900);

    return () => clearInterval(interval);
  }, [isOpen, countdownSeconds, useSound, onFinish]);

  if (!isOpen) return null;

  return (
    <div
      id="shuffle-countdown-overlay"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/92 backdrop-blur-md select-none animate-fade-in"
    >
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Glowing countdown circle */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-10 bg-gradient-to-tr from-pink-200 via-purple-200 to-indigo-200 rounded-full blur-2xl opacity-60 animate-pulse" />
          <span
            key={count}
            className="relative font-extrabold text-[12rem] sm:text-[16rem] text-pink-500 leading-none drop-shadow-[0_12px_24px_rgba(244,114,182,0.35)] animate-scale-up tracking-tighter"
          >
            {count > 0 ? count : '✨'}
          </span>
        </div>

        <div className="text-2xl sm:text-3xl font-extrabold text-purple-800 drop-shadow-xs animate-bounce tracking-tight">
          {count > 0 ? message : '자리 바꾸기 완료! 🎉'}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { Sparkles, KeyRound } from 'lucide-react';

interface TeacherDeskProps {
  onOpenSecretModal: () => void;
  isSpacebarPressed: boolean;
  classNameTitle?: string;
  isSecretModeReady?: boolean;
}

export const TeacherDesk: React.FC<TeacherDeskProps> = ({
  onOpenSecretModal,
  isSpacebarPressed,
  classNameTitle = '🍎 교탁',
  isSecretModeReady = false,
}) => {
  const [clickCount, setClickCount] = useState(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDeskClick = () => {
    setClickCount((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        onOpenSecretModal();
        return 0;
      }
      return next;
    });

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      setClickCount(0);
    }, 700);
  };

  return (
    <div id="teacher-desk-section" className="flex flex-col items-center justify-center w-full mb-3 select-none">
      <div className="relative group">
        {/* Subtle glow when spacebar is engaged */}
        {isSpacebarPressed && (
          <div className="absolute -inset-1.5 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 rounded-2xl blur-xs opacity-70 transition-all duration-300 animate-pulse pointer-events-none" />
        )}

        <button
          id="teacher-podium-btn"
          type="button"
          onClick={handleDeskClick}
          title="칠판 / 교탁 방향 (선생님 시선)"
          className={`relative px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-white shadow-md transition-all duration-200 transform active:scale-95 ${
            isSpacebarPressed
              ? 'bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500 ring-2 ring-pink-300 shadow-pink-200'
              : 'bg-gradient-to-r from-rose-400 via-pink-400 to-rose-400 border-2 border-pink-300 shadow-pink-100 hover:shadow-lg'
          }`}
          style={{ width: '300px', height: '64px' }}
        >
          <span className="text-2xl filter drop-shadow-xs transition-transform duration-300 group-hover:rotate-12">
            🍎
          </span>
          <span className="tracking-tight text-xl sm:text-2xl font-bold drop-shadow-xs">{classNameTitle}</span>

          {/* Discreet Teacher Indicator (Spacebar Ready or Triple-click Hint) */}
          <div className="absolute right-3 top-2.5 flex items-center gap-1">
            {isSpacebarPressed ? (
              <span
                title="스페이스바 비밀 모드 활성화됨"
                className="w-2.5 h-2.5 rounded-full bg-emerald-300 ring-2 ring-white animate-ping"
              />
            ) : isSecretModeReady ? (
              <span
                title="선생님 비밀 세팅 탑재됨"
                className="w-2 h-2 rounded-full bg-pink-200 opacity-60"
              />
            ) : null}
          </div>
        </button>

        {/* Direction marker */}
        <div className="text-center mt-1">
          <span className="text-[11px] font-medium text-pink-700/60 bg-pink-100/50 px-2 py-0.5 rounded-full">
            ▲ 교탁 (앞쪽) ▲
          </span>
        </div>
      </div>
    </div>
  );
};

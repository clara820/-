import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Seat,
  Student,
  NearRule,
  AvoidRule,
  SecretSettings,
  ClassroomConfig,
} from './types';
import {
  INITIAL_SEATS,
  INITIAL_STUDENTS,
  INITIAL_NEAR_RULES,
  INITIAL_AVOID_RULES,
  INITIAL_SECRET_SETTINGS,
  INITIAL_CONFIG,
} from './data/defaultData';
import { solveSeatingArrangement } from './utils/seatingSolver';
import { soundManager, fireClassroomConfetti } from './utils/soundEffects';
import { TeacherDesk } from './components/TeacherDesk';
import { ClassroomGrid } from './components/ClassroomGrid';
import { OfficialSettingsModal } from './components/OfficialSettingsModal';
import { SecretTeacherModal } from './components/SecretTeacherModal';
import { ShuffleOverlay } from './components/ShuffleOverlay';
import { PrintModal } from './components/PrintModal';
import {
  Sparkles,
  RefreshCw,
  Save,
  Printer,
  Settings,
  Plus,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
} from 'lucide-react';

const STORAGE_KEYS = {
  SEATS: 'classroom_seats_v6',
  STUDENTS: 'classroom_students_v6',
  NEAR_RULES: 'classroom_near_rules_v6',
  AVOID_RULES: 'classroom_avoid_rules_v6',
  SECRET_SETTINGS: 'classroom_secret_settings_v6',
  CONFIG: 'classroom_config_v6',
};

export default function App() {
  // --- Core States ---
  const [seats, setSeats] = useState<Seat[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SEATS);
      return saved ? JSON.parse(saved) : INITIAL_SEATS;
    } catch {
      return INITIAL_SEATS;
    }
  });

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [nearRules, setNearRules] = useState<NearRule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NEAR_RULES);
      return saved ? JSON.parse(saved) : INITIAL_NEAR_RULES;
    } catch {
      return INITIAL_NEAR_RULES;
    }
  });

  const [avoidRules, setAvoidRules] = useState<AvoidRule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AVOID_RULES);
      return saved ? JSON.parse(saved) : INITIAL_AVOID_RULES;
    } catch {
      return INITIAL_AVOID_RULES;
    }
  });

  const [secretSettings, setSecretSettings] = useState<SecretSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SECRET_SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_SECRET_SETTINGS;
    } catch {
      return INITIAL_SECRET_SETTINGS;
    }
  });

  const [config, setConfig] = useState<ClassroomConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      return saved ? JSON.parse(saved) : INITIAL_CONFIG;
    } catch {
      return INITIAL_CONFIG;
    }
  });

  // UI Modes & Modals
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isShufflingAnimation, setIsShufflingAnimation] = useState(false);
  const [highlightedSeatIds, setHighlightedSeatIds] = useState<number[]>([]);

  // Spacebar secret tracker
  const [isSpacebarPressed, setIsSpacebarPressed] = useState(false);
  const spacebarRef = useRef(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warn' | 'info' } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'warn' | 'info' = 'info', duration = 3000) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, duration);
  }, []);

  // Save to LocalStorage
  const saveStateToStorage = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(seats));
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      localStorage.setItem(STORAGE_KEYS.NEAR_RULES, JSON.stringify(nearRules));
      localStorage.setItem(STORAGE_KEYS.AVOID_RULES, JSON.stringify(avoidRules));
      localStorage.setItem(STORAGE_KEYS.SECRET_SETTINGS, JSON.stringify(secretSettings));
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Storage save error:', e);
    }
  }, [seats, students, nearRules, avoidRules, secretSettings, config]);

  useEffect(() => {
    saveStateToStorage();
  }, [saveStateToStorage]);

  // --- Keyboard Event Listeners for Spacebar Secret Rigging & Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid capturing spacebar when user is typing in an input
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      if (e.code === 'Space' && !isInput) {
        // Spacebar held down
        setIsSpacebarPressed(true);
        spacebarRef.current = true;
      }

      // Teacher secret shortcut: Ctrl+Alt+S or Shift+Alt+S
      if ((e.ctrlKey || e.shiftKey) && e.altKey && (e.key === 's' || e.key === 'S' || e.key === 'ㄴ')) {
        e.preventDefault();
        setIsSecretModalOpen(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacebarPressed(false);
        spacebarRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // --- Core Shuffle Action ---
  const executeShuffle = (forceSecret = false) => {
    const isSecretTriggered = forceSecret || spacebarRef.current || isSpacebarPressed;

    // Available student names (active students, filtered or padded)
    const activeStudentNames = students
      .filter((s) => s.status === 'active')
      .map((s) => s.name.trim())
      .filter((n) => n !== '');

    // Also include frequent absent or others if seats exceed active students
    const otherStudents = students
      .filter((s) => s.status !== 'active')
      .map((s) => s.name.trim())
      .filter((n) => n !== '');

    const candidatePool = [...activeStudentNames, ...otherStudents];

    const result = solveSeatingArrangement(
      seats,
      candidatePool,
      nearRules,
      avoidRules,
      secretSettings,
      isSecretTriggered
    );

    // Apply new assignments to seats
    const updatedSeats = seats.map((seat) => {
      const assignedName = result.assignments[seat.id] ?? '';
      return {
        ...seat,
        name: assignedName,
        status: (assignedName.trim() === '' ? 'empty' : 'active') as 'empty' | 'active',
      };
    });

    setSeats(updatedSeats);

    // Highlight all placed seats
    const newPlacedIds = updatedSeats.filter((s) => s.name.trim() !== '').map((s) => s.id);
    setHighlightedSeatIds(newPlacedIds);
    setTimeout(() => {
      setHighlightedSeatIds([]);
    }, 1500);

    // Sound & Confetti
    if (config.useSound) {
      soundManager.playFanfare();
    }
    if (config.useEffects) {
      fireClassroomConfetti();
    }

    if (result.conflicts.length > 0) {
      showToast('⚠️ 자리 배치가 완료되었습니다. (일부 까다로운 조건이 있어 최적의 배치로 구성되었습니다)', 'warn', 4000);
    } else {
      showToast('🎉 두근두근! 새로운 자리 배치가 완료되었습니다!', 'success');
    }
  };

  const handleStartShuffle = () => {
    if (isEditMode) return;

    if (config.useEffects) {
      setIsShufflingAnimation(true);
    } else {
      executeShuffle();
    }
  };

  // --- Seat Manipulation Handlers ---
  const handleUpdateSeat = (updated: Seat) => {
    setSeats((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDeleteSeat = (seatId: number) => {
    setSeats((prev) => prev.filter((s) => s.id !== seatId));
  };

  const handleSwapSeats = (sourceId: number, targetId: number) => {
    setSeats((prev) => {
      const src = prev.find((s) => s.id === sourceId);
      const tgt = prev.find((s) => s.id === targetId);
      if (!src || !tgt) return prev;

      return prev.map((s) => {
        if (s.id === sourceId) return { ...s, name: tgt.name, locked: tgt.locked };
        if (s.id === targetId) return { ...s, name: src.name, locked: src.locked };
        return s;
      });
    });
    if (config.useSound) soundManager.playClick();
  };

  const handleMoveSeatPosition = (seatId: number, targetR: number, targetC: number) => {
    setSeats((prev) =>
      prev.map((s) => (s.id === seatId ? { ...s, r: targetR, c: targetC } : s))
    );
  };

  const handleAddSeat = () => {
    for (let r = 0; r < config.maxRows; r++) {
      for (let c = 0; c < config.maxCols; c++) {
        if (!seats.some((s) => s.r === r && s.c === c)) {
          const maxId = seats.length > 0 ? Math.max(...seats.map((s) => s.id)) + 1 : 0;
          const newSeat: Seat = {
            id: maxId,
            r,
            c,
            name: '',
            locked: false,
            status: 'empty',
          };
          setSeats([...seats, newSeat]);
          showToast(`좌석 [${r + 1}열 ${c + 1}행]이 추가되었습니다.`, 'success');
          return;
        }
      }
    }
    showToast('더 이상 빈 공간이 없습니다.', 'warn');
  };

  const handleManualSave = () => {
    saveStateToStorage();
    if (config.useSound) soundManager.playClick();
    showToast('💾 현재 자리 배치가 안전하게 저장되었습니다!', 'success');
  };

  return (
    <div
      id="classroom-app-root"
      className="min-h-screen w-full flex flex-col justify-between p-2 sm:p-4 md:p-6 overflow-x-hidden selection:bg-pink-200"
    >
      {/* Top Teacher Desk Section */}
      <header className="no-print">
        <TeacherDesk
          onOpenSecretModal={() => setIsSecretModalOpen(true)}
          isSpacebarPressed={isSpacebarPressed}
          classNameTitle={config.className}
          isSecretModeReady={secretSettings.enabled && Object.keys(secretSettings.presetLayout || {}).length > 0}
        />
      </header>

      {/* Center Classroom Grid */}
      <main className="flex-1 flex items-center justify-center my-1 sm:my-2 w-full">
        <ClassroomGrid
          seats={seats}
          students={students}
          isEditMode={isEditMode}
          onUpdateSeat={handleUpdateSeat}
          onDeleteSeat={handleDeleteSeat}
          onSwapSeats={handleSwapSeats}
          onMoveSeatPosition={handleMoveSeatPosition}
          maxRows={config.maxRows}
          maxCols={config.maxCols}
          highlightedSeatIds={highlightedSeatIds}
        />
      </main>

      {/* Bottom Controls Bar */}
      <footer className="w-full max-w-[1240px] mx-auto mt-2 no-print">
        {isEditMode ? (
          /* Edit Mode Controls */
          <div
            id="edit-controls-bar"
            className="w-full p-3 bg-purple-500/90 backdrop-blur-md rounded-2xl border-2 border-purple-300 shadow-xl flex flex-wrap items-center justify-between gap-3 text-white animate-fade-in"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🛠️</span>
              <span className="font-bold text-sm sm:text-base">
                자리 배열 수정 모드 (원하는 위치로 책상을 드래그하세요)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddSeat}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>+ 좌석 추가</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className="px-5 py-2 bg-white text-purple-800 hover:bg-purple-50 rounded-xl text-xs sm:text-sm font-extrabold shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>배열 저장 및 완료</span>
              </button>
            </div>
          </div>
        ) : (
          /* Normal Controls */
          <div
            id="normal-controls-bar"
            className="w-full flex flex-wrap items-center justify-between gap-2 sm:gap-3"
          >
            {/* Left group: Effects & Sound */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                id="toggle-effect-btn"
                onClick={() => setConfig((prev) => ({ ...prev, useEffects: !prev.useEffects }))}
                title={config.useEffects ? '화려한 연출 효과 켜짐' : '효과 끄기'}
                className={`px-3.5 sm:px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border-2 transition-all duration-150 active:scale-95 shadow-sm ${
                  config.useEffects
                    ? 'bg-pink-100/90 text-pink-700 border-pink-300 shadow-pink-100'
                    : 'bg-white/90 text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Sparkles className={`w-4 h-4 ${config.useEffects ? 'text-pink-500 animate-spin-slow' : 'text-gray-400'}`} />
                <span className="hidden sm:inline">효과넣기</span>
              </button>

              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, useSound: !prev.useSound }))}
                title={config.useSound ? '효과음 켜짐' : '효과음 꺼짐'}
                className="p-3 rounded-2xl bg-white/90 border-2 border-gray-200 text-gray-600 hover:text-purple-600 hover:border-purple-200 transition-all shadow-sm active:scale-95"
              >
                {config.useSound ? <Volume2 className="w-4 h-4 text-purple-600" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
              </button>
            </div>

            {/* Main Center Button: Shuffle */}
            <button
              type="button"
              id="main-shuffle-btn"
              onClick={handleStartShuffle}
              className="flex-1 max-w-sm sm:max-w-md py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 hover:from-pink-500 hover:via-purple-500 hover:to-indigo-500 text-white font-gaegu text-2xl sm:text-3xl font-bold tracking-wider shadow-lg shadow-pink-200 hover:shadow-xl hover:shadow-purple-200 border-2 border-pink-200 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-6 h-6 animate-pulse" />
              <span>🔄 자리 바꾸기</span>
            </button>

            {/* Right group: Save, Print, Settings */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                id="save-seats-btn"
                onClick={handleManualSave}
                title="현재 자리 저장"
                className="px-3.5 sm:px-4 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm shadow-emerald-100 transition-all active:scale-95"
              >
                <Save className="w-4 h-4 text-emerald-600" />
                <span className="hidden md:inline">자리 저장</span>
              </button>

              <button
                type="button"
                id="print-seats-btn"
                onClick={() => setIsPrintModalOpen(true)}
                title="자리 배치표 출력"
                className="px-3.5 sm:px-4 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border-2 border-amber-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm shadow-amber-100 transition-all active:scale-95"
              >
                <Printer className="w-4 h-4 text-amber-600" />
                <span className="hidden md:inline">출력</span>
              </button>

              <button
                type="button"
                id="open-settings-btn"
                onClick={() => setIsSettingsOpen(true)}
                title="환경 설정 (짝꿍/따로앉기/명단)"
                className="p-3 rounded-2xl bg-white/90 hover:bg-purple-50 text-gray-700 hover:text-purple-700 border-2 border-gray-200 hover:border-purple-300 transition-all shadow-sm active:scale-95"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </footer>

      {/* Floating Toast Notification */}
      {toast && (
        <div
          id="toast-notification"
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full text-sm font-bold shadow-2xl flex items-center gap-2 select-none animate-bounce-short transition-all ${
            toast.type === 'success'
              ? 'bg-slate-900 text-emerald-300 border border-emerald-500/40'
              : toast.type === 'warn'
              ? 'bg-slate-900 text-amber-300 border border-amber-500/40'
              : 'bg-slate-900 text-white border border-purple-500/40'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Modals & Overlays */}
      <OfficialSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        nearRules={nearRules}
        onSaveNearRules={setNearRules}
        avoidRules={avoidRules}
        onSaveAvoidRules={setAvoidRules}
        students={students}
        onUpdateStudents={setStudents}
        config={config}
        onUpdateConfig={setConfig}
        onEnterEditMode={() => setIsEditMode(true)}
        onOpenSecretRoom={() => {
          setIsSettingsOpen(false);
          setIsSecretModalOpen(true);
        }}
      />

      <SecretTeacherModal
        isOpen={isSecretModalOpen}
        onClose={() => setIsSecretModalOpen(false)}
        secretSettings={secretSettings}
        onSaveSecretSettings={(updated) => {
          setSecretSettings(updated);
          showToast('🔒 선생님 비밀 설정이 성공적으로 저장되었습니다!', 'success');
        }}
        currentSeats={seats}
        students={students}
        onApplyPresetNow={() => {
          executeShuffle(true);
        }}
      />

      <ShuffleOverlay
        isOpen={isShufflingAnimation}
        countdownSeconds={config.countdownSeconds}
        useSound={config.useSound}
        onFinish={() => {
          setIsShufflingAnimation(false);
          executeShuffle();
        }}
      />

      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        seats={seats}
        config={config}
      />
    </div>
  );
}

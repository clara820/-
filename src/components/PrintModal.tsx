import React, { useState } from 'react';
import { Seat, ClassroomConfig } from '../types';
import { Printer, RotateCw, Check, X } from 'lucide-react';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  seats: Seat[];
  config: ClassroomConfig;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  seats,
  config,
}) => {
  const [orientation, setOrientation] = useState<'teacher' | 'student'>('teacher');
  const [showNotes, setShowNotes] = useState(true);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      id="print-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none no-print"
    >
      <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-amber-500 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Printer className="w-5 h-5" />
            <h2 className="text-lg font-bold">🖨️ 자리 배치표 출력 및 인쇄 미리보기</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xs font-bold text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Options Toolbar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700">시선 방향:</span>
            <button
              type="button"
              onClick={() => setOrientation('teacher')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                orientation === 'teacher'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              선생님 시선 (교탁 위쪽)
            </button>
            <button
              type="button"
              onClick={() => setOrientation('student')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                orientation === 'student'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <RotateCw className="w-3 h-3" />
              <span>학생 시선 (교탁 아래쪽 / 180° 회전)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-200 flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>지금 인쇄하기 (A4 가로)</span>
          </button>
        </div>

        {/* Print Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex items-center justify-center">
          <div
            id="print-area"
            className="w-full max-w-2xl bg-white p-6 rounded-2xl shadow-md border border-gray-300 flex flex-col items-center"
          >
            {/* Header info */}
            <div className="w-full text-center border-b-2 border-gray-800 pb-3 mb-4">
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {config.className || '우리반 자리 배치표'}
              </h1>
              <p className="text-xs text-gray-500 mt-1">배치 일자: {todayStr}</p>
            </div>

            {/* Top Podium if teacher view */}
            {orientation === 'teacher' && (
              <div className="w-48 py-2 mb-4 bg-gray-100 border-2 border-gray-400 rounded-xl text-center font-bold text-sm">
                🍎 교탁 (칠판)
              </div>
            )}

            {/* Grid Representation */}
            <div
              className={`grid gap-2 w-full max-w-xl transition-transform duration-300 ${
                orientation === 'student' ? 'rotate-180' : ''
              }`}
              style={{
                gridTemplateColumns: `repeat(${config.maxCols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${config.maxRows}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: config.maxRows }).map((_, r) =>
                Array.from({ length: config.maxCols }).map((_, c) => {
                  const seat = seats.find((s) => s.r === r && s.c === c);
                  if (!seat) return <div key={`print-cell-${r}-${c}`} className="h-10" />;

                  return (
                    <div
                      key={`print-seat-${seat.id}`}
                      className={`h-11 border-2 border-gray-400 rounded-lg flex items-center justify-center font-bold text-base p-1 text-center ${
                        orientation === 'student' ? 'rotate-180' : ''
                      } ${seat.name ? 'bg-gray-50 text-gray-900' : 'bg-transparent text-gray-300'}`}
                    >
                      {seat.name || ''}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Podium if student view */}
            {orientation === 'student' && (
              <div className="w-48 py-2 mt-4 bg-gray-100 border-2 border-gray-400 rounded-xl text-center font-bold text-sm">
                🍎 교탁 (칠판)
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Seat, Student } from '../types';
import { Lock, Unlock, Trash2, Plus, GripVertical } from 'lucide-react';

interface ClassroomGridProps {
  seats: Seat[];
  students?: Student[];
  isEditMode: boolean;
  onUpdateSeat: (updatedSeat: Seat) => void;
  onDeleteSeat: (seatId: number) => void;
  onSwapSeats: (sourceSeatId: number, targetSeatId: number) => void;
  onMoveSeatPosition: (seatId: number, targetR: number, targetC: number) => void;
  maxRows: number;
  maxCols: number;
  highlightedSeatIds?: number[];
}

export const ClassroomGrid: React.FC<ClassroomGridProps> = ({
  seats,
  students = [],
  isEditMode,
  onUpdateSeat,
  onDeleteSeat,
  onSwapSeats,
  onMoveSeatPosition,
  maxRows,
  maxCols,
  highlightedSeatIds = [],
}) => {
  const [draggedSeatId, setDraggedSeatId] = useState<number | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ r: number; c: number } | null>(null);

  const handleDragStart = (e: React.DragEvent, seatId: number) => {
    setDraggedSeatId(seatId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', seatId.toString());
  };

  const handleDragOver = (e: React.DragEvent, r: number, c: number) => {
    e.preventDefault();
    setDragOverCell({ r, c });
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, targetR: number, targetC: number) => {
    e.preventDefault();
    setDragOverCell(null);
    if (draggedSeatId === null) return;

    const sourceSeat = seats.find((s) => s.id === draggedSeatId);
    const targetSeat = seats.find((s) => s.r === targetR && s.c === targetC);

    if (!sourceSeat) {
      setDraggedSeatId(null);
      return;
    }

    if (isEditMode) {
      if (targetSeat && targetSeat.id !== sourceSeat.id) {
        // Swap positions in edit mode
        onMoveSeatPosition(sourceSeat.id, targetR, targetC);
        onMoveSeatPosition(targetSeat.id, sourceSeat.r, sourceSeat.c);
      } else {
        onMoveSeatPosition(sourceSeat.id, targetR, targetC);
      }
    } else {
      // In normal mode: swap names & lock status between the two desks
      if (targetSeat && targetSeat.id !== sourceSeat.id) {
        onSwapSeats(sourceSeat.id, targetSeat.id);
      }
    }

    setDraggedSeatId(null);
  };

  const getDynamicFontSize = (name: string) => {
    if (!name) return 'text-sm sm:text-base md:text-lg font-medium';
    const len = name.trim().length;
    if (len >= 5) return 'text-xs sm:text-sm md:text-base font-bold tracking-tight';
    if (len === 4) return 'text-sm sm:text-base md:text-lg font-bold tracking-tight';
    if (len === 3) return 'text-base sm:text-lg md:text-xl font-bold tracking-tight';
    return 'text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight';
  };

  return (
    <div
      id="classroom-grid-wrapper"
      className="w-full max-w-[1320px] mx-auto min-h-[460px] h-[64vh] max-h-[680px] p-3 sm:p-4 rounded-3xl bg-white/75 backdrop-blur-md border-2 border-purple-100/80 shadow-xl shadow-purple-900/5 flex flex-col justify-center select-none"
    >
      <div
        className="grid w-full h-full gap-2 sm:gap-3"
        style={{
          gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${maxRows}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: maxRows }).map((_, r) =>
          Array.from({ length: maxCols }).map((_, c) => {
            const seat = seats.find((s) => s.r === r && s.c === c);
            const isHovered = dragOverCell?.r === r && dragOverCell?.c === c;
            const isHighlighted = seat && highlightedSeatIds.includes(seat.id);

            return (
              <div
                key={`cell-${r}-${c}`}
                id={`grid-cell-${r}-${c}`}
                onDragOver={(e) => handleDragOver(e, r, c)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, r, c)}
                className={`relative rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  isEditMode
                    ? isHovered
                      ? 'border-2 border-purple-400 bg-purple-100/60 shadow-inner'
                      : 'border border-dashed border-purple-200/90 bg-white/40 hover:bg-purple-50/40'
                    : isHovered
                    ? 'bg-purple-50/50 rounded-2xl'
                    : ''
                }`}
              >
                {seat ? (
                  <div
                    id={`seat-desk-${seat.id}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, seat.id)}
                    className={`group absolute inset-0.5 sm:inset-1 rounded-2xl flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-all duration-200 select-none ${
                      isHighlighted ? 'desk-pop ring-4 ring-pink-400/80 ring-offset-2' : ''
                    } ${
                      seat.locked
                        ? 'bg-gradient-to-br from-pink-100 to-rose-100 border-2 border-rose-300 shadow-md shadow-pink-100'
                        : seat.name.trim() === ''
                        ? 'bg-purple-50/50 border-2 border-dashed border-purple-200 hover:border-purple-300 shadow-xs'
                        : 'bg-gradient-to-br from-purple-50 via-white to-indigo-50 border-2 border-purple-200 hover:border-purple-300 shadow-md hover:shadow-lg shadow-purple-100'
                    }`}
                  >
                    {/* Delete button (only in edit mode) */}
                    {isEditMode && (
                      <button
                        id={`delete-seat-${seat.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSeat(seat.id);
                        }}
                        title="좌석 삭제"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md text-xs font-bold z-20 transition-transform active:scale-90"
                      >
                        ✕
                      </button>
                    )}

                    {/* Desk Header / Index Indicator */}
                    <div className="w-full flex items-center justify-between px-2 pt-1 absolute top-0.5 pointer-events-none">
                      <span className="text-[10px] font-semibold text-purple-400/50 font-mono">
                        {seat.r + 1}-{seat.c + 1}
                      </span>
                    </div>

                    {/* Student Name Input Container */}
                    <div className="w-full h-full flex items-center justify-center px-2 py-1 overflow-hidden z-1">
                      <input
                        id={`seat-name-input-${seat.id}`}
                        type="text"
                        list="classroom-grid-students"
                        value={seat.name}
                        disabled={isEditMode}
                        placeholder={isEditMode ? '자리' : '빈자리'}
                        onChange={(e) => {
                          onUpdateSeat({
                            ...seat,
                            name: e.target.value,
                            status: e.target.value.trim() === '' ? 'empty' : 'active',
                          });
                        }}
                        className={`w-full h-auto text-center bg-transparent border-0 outline-none p-0 m-0 cursor-pointer tracking-tight transition-all duration-150 leading-tight select-all ${getDynamicFontSize(
                          seat.name
                        )} ${
                          seat.locked
                            ? 'text-rose-900 font-extrabold'
                            : seat.name.trim() === ''
                            ? 'text-purple-300 placeholder:text-purple-300/60 font-medium'
                            : 'text-slate-800'
                        }`}
                      />
                    </div>

                    {/* Lock Button (in normal mode) */}
                    {!isEditMode && (
                      <button
                        id={`toggle-lock-${seat.id}`}
                        type="button"
                        title={seat.locked ? '자리 고정 해제 (현재 잠김)' : '이 자리 고정하기'}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateSeat({ ...seat, locked: !seat.locked });
                        }}
                        className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md border transition-all duration-150 active:scale-90 z-10 ${
                          seat.locked
                            ? 'bg-rose-500 text-white border-rose-400 shadow-rose-200'
                            : 'bg-white/90 text-gray-400 hover:text-gray-700 border-gray-200 opacity-60 group-hover:opacity-100'
                        }`}
                      >
                        {seat.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    )}

                    {/* Edit mode drag indicator */}
                    {isEditMode && (
                      <div className="absolute bottom-1 text-purple-300/70">
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* Classroom students datalist */}
      {students.length > 0 && (
        <datalist id="classroom-grid-students">
          {students.map((stu) => (
            <option key={`grid-opt-${stu.id}`} value={stu.name} />
          ))}
        </datalist>
      )}
    </div>
  );
};

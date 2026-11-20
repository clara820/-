import React, { useState, useMemo } from 'react';
import { Seat, ClassroomConfig } from '../types';
import { Printer, RotateCw, ImageDown, FileText } from 'lucide-react';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  seats: Seat[];
  config: ClassroomConfig;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  seats,
  config,
}) => {
  // 교사 시선(교탁 아래쪽)이 기본값
  const [orientation, setOrientation] = useState<'teacher' | 'student'>('teacher');
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  const todayStr = useMemo(
    () =>
      new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    []
  );

  const fileDateStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // 실제 책상이 배치된 최소~최대 행/열 범위만 계산해 빈 외곽 여백을 제거하고 칸 너비를 확보
  const gridMeta = useMemo(() => {
    if (seats.length === 0) {
      const rows = Array.from({ length: config.maxRows }, (_, i) => i);
      const cols = Array.from({ length: config.maxCols }, (_, i) => i);
      return {
        rows,
        cols,
        occupiedCols: new Set<number>(cols),
      };
    }

    let minR = Infinity;
    let maxR = -Infinity;
    let minC = Infinity;
    let maxC = -Infinity;
    const occupiedCols = new Set<number>();

    seats.forEach((s) => {
      if (s.r < minR) minR = s.r;
      if (s.r > maxR) maxR = s.r;
      if (s.c < minC) minC = s.c;
      if (s.c > maxC) maxC = s.c;
      occupiedCols.add(s.c);
    });

    const rows: number[] = [];
    for (let r = minR; r <= maxR; r++) rows.push(r);

    const cols: number[] = [];
    for (let c = minC; c <= maxC; c++) cols.push(c);

    return { rows, cols, occupiedCols };
  }, [seats, config.maxRows, config.maxCols]);

  if (!isOpen) return null;

  const titleText = config.className || '우리반 자리 배치표';
  const orientationLabel =
    orientation === 'teacher'
      ? '교사 시선 (교탁 아래쪽)'
      : '학생 시선 (교탁 위쪽)';
  const orientationFileTag = orientation === 'teacher' ? '교사시선' : '학생시선';

  // 교사 시선(교탁 맨 아래): 교탁에 서서 학생들을 바라보는 실제 180도 반전 좌표
  // 학생 시선(교탁 맨 위): 교실 뒤에서 칠판을 바라보는 정방향 좌표
  const orderedRows =
    orientation === 'teacher' ? [...gridMeta.rows].reverse() : gridMeta.rows;
  const orderedCols =
    orientation === 'teacher' ? [...gridMeta.cols].reverse() : gridMeta.cols;

  // 책상 열은 넓게(1fr), 분단 사이 통로 열은 좁게(0.32fr) 구성해 이름이 한 줄에 여유 있게 들어가도록 함
  const gridTemplateColumns = orderedCols
    .map((c) =>
      gridMeta.occupiedCols.has(c) ? 'minmax(0, 1fr)' : 'minmax(10px, 0.32fr)'
    )
    .join(' ');

  const triggerDownloadFeedback = (msg: string) => {
    setDownloadFeedback(msg);
    setTimeout(() => setDownloadFeedback(null), 3000);
  };

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  // --- 1. 고해상도 PNG 이미지 저장 (A4 가로 비율) ---
  const handleDownloadPNG = () => {
    const W = 1754;
    const H = 1240;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fontStack =
      '"Pretendard Variable", Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

    // White paper background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Header
    ctx.fillStyle = '#111827';
    ctx.font = `800 46px ${fontStack}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(titleText, W / 2, 102);

    ctx.fillStyle = '#6b7280';
    ctx.font = `500 22px ${fontStack}`;
    ctx.fillText(`배치 일자: ${todayStr} · ${orientationLabel}`, W / 2, 150);

    // Header divider line
    const padX = 96;
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(padX, 182);
    ctx.lineTo(W - padX, 182);
    ctx.stroke();

    // Podium dimensions & vertical layout regions
    const podiumW = 420;
    const podiumH = 68;
    const podiumX = (W - podiumW) / 2;
    const podiumY = orientation === 'student' ? 216 : H - 146;

    const drawPodium = () => {
      drawRoundedRect(ctx, podiumX, podiumY, podiumW, podiumH, 16);
      ctx.fillStyle = '#f3f4f6';
      ctx.fill();
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#1f2937';
      ctx.font = `700 28px ${fontStack}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🍎 교탁 (칠판)', W / 2, podiumY + podiumH / 2 + 1);
    };

    drawPodium();

    // Grid region
    const gridTop = orientation === 'student' ? 320 : 220;
    const gridBottom = orientation === 'student' ? H - 84 : podiumY - 40;
    const gridAvailW = W - padX * 2;
    const gridAvailH = gridBottom - gridTop;

    const colGap = 20;
    const rowGap = 22;

    const colWeights = orderedCols.map((c) =>
      gridMeta.occupiedCols.has(c) ? 1 : 0.32
    );
    const totalWeight = colWeights.reduce((acc, w) => acc + w, 0);
    const totalColGap = colGap * Math.max(0, orderedCols.length - 1);
    const unitW = (gridAvailW - totalColGap) / Math.max(totalWeight, 1);

    const colWidths = colWeights.map((w) => w * unitW);
    const colXs: number[] = [];
    let curX = padX;
    for (let i = 0; i < colWidths.length; i++) {
      colXs.push(curX);
      curX += colWidths[i] + colGap;
    }

    const rowCount = Math.max(orderedRows.length, 1);
    const maxCardH = Math.min(
      140,
      (gridAvailH - rowGap * Math.max(0, rowCount - 1)) / rowCount
    );
    const totalGridH = maxCardH * rowCount + rowGap * Math.max(0, rowCount - 1);
    const startY = gridTop + (gridAvailH - totalGridH) / 2;

    orderedRows.forEach((r, rIdx) => {
      const y = startY + rIdx * (maxCardH + rowGap);
      orderedCols.forEach((c, cIdx) => {
        const seat = seats.find((s) => s.r === r && s.c === c);
        if (!seat) return;

        const x = colXs[cIdx];
        const w = colWidths[cIdx];
        const h = maxCardH;
        const name = seat.name.trim();

        drawRoundedRect(ctx, x, y, w, h, 16);
        ctx.fillStyle = name ? '#f9fafb' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#4b5563';
        ctx.lineWidth = 3;
        ctx.stroke();

        if (name) {
          // 한 줄에 무조건 들어가도록 폰트 크기 자동 맞춤
          let fontSize = 38;
          ctx.fillStyle = '#111827';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          while (fontSize > 16) {
            ctx.font = `800 ${fontSize}px ${fontStack}`;
            if (ctx.measureText(name).width <= w - 24) break;
            fontSize -= 2;
          }
          ctx.fillText(name, x + w / 2, y + h / 2 + 1);
        }
      });
    });

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${titleText}_${orientationFileTag}_${fileDateStr}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    triggerDownloadFeedback('🖼️ 고화질 PNG 이미지로 저장되었습니다!');
  };

  // --- 2. 인쇄용 HTML 파일 저장 (더블클릭 후 바로 프린터 인쇄 가능) ---
  const handleDownloadPrintableHTML = () => {
    const cellsHtml = orderedRows
      .map((r) =>
        orderedCols
          .map((c) => {
            const seat = seats.find((s) => s.r === r && s.c === c);
            if (!seat) return `<div class="cell-empty"></div>`;
            const trimmed = seat.name.trim();
            const len = trimmed.length;
            const sizeClass =
              len >= 5 ? 'name-sm' : len === 4 ? 'name-md' : 'name-lg';
            return `<div class="seat ${trimmed ? 'filled' : 'blank'}"><span class="seat-name ${sizeClass}">${escapeHtml(
              trimmed
            )}</span></div>`;
          })
          .join('')
      )
      .join('\n');

    const podiumHtml = `<div class="podium">🍎 교탁 (칠판)</div>`;

    const htmlDoc = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(titleText)} - ${escapeHtml(orientationLabel)}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: "Pretendard Variable", Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
      background: #f1f5f9;
      color: #111827;
      display: flex;
      flex-direction: column;
      align-items: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .toolbar {
      width: 100%;
      max-width: 1040px;
      margin-bottom: 16px;
      padding: 12px 18px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
    }
    .toolbar-info {
      font-size: 13px;
      color: #475569;
    }
    .print-btn {
      padding: 10px 20px;
      background: #f59e0b;
      color: #ffffff;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
    }
    .print-btn:hover { background: #d97706; }
    .sheet {
      width: 100%;
      max-width: 1040px;
      background: #ffffff;
      padding: 28px 32px;
      border-radius: 16px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .header {
      width: 100%;
      text-align: center;
      border-bottom: 2px solid #1f2937;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .header p {
      margin: 6px 0 0;
      font-size: 13px;
      color: #6b7280;
    }
    .podium {
      width: 260px;
      padding: 10px 0;
      background: #f3f4f6;
      border: 2px solid #4b5563;
      border-radius: 12px;
      text-align: center;
      font-weight: 700;
      font-size: 16px;
      color: #1f2937;
      white-space: nowrap;
    }
    .podium-top { margin-bottom: 24px; }
    .podium-bottom { margin-top: 24px; }
    .grid {
      width: 100%;
      display: grid;
      gap: 12px;
      grid-template-columns: ${gridTemplateColumns};
    }
    .cell-empty {
      height: 68px;
    }
    .seat {
      height: 68px;
      padding: 0 8px;
      border: 2px solid #4b5563;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .seat.filled { background: #f9fafb; color: #111827; }
    .seat.blank { background: #ffffff; color: #d1d5db; }
    .seat-name {
      display: block;
      width: 100%;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1;
      letter-spacing: -0.02em;
    }
    .name-lg { font-size: 22px; font-weight: 800; }
    .name-md { font-size: 18px; font-weight: 700; }
    .name-sm { font-size: 15px; font-weight: 700; }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .toolbar { display: none !important; }
      .sheet {
        max-width: none;
        border: none;
        box-shadow: none;
        padding: 8px 12px;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="toolbar-info">
      <strong>${escapeHtml(titleText)}</strong> · ${escapeHtml(orientationLabel)} (A4 가로 인쇄 최적화)
    </div>
    <button class="print-btn" onclick="window.print()">🖨️ 지금 프린터로 인쇄하기</button>
  </div>

  <div class="sheet">
    <div class="header">
      <h1>${escapeHtml(titleText)}</h1>
      <p>배치 일자: ${escapeHtml(todayStr)} · ${escapeHtml(orientationLabel)}</p>
    </div>
    ${orientation === 'student' ? `<div class="podium-top">${podiumHtml}</div>` : ''}
    <div class="grid">
      ${cellsHtml}
    </div>
    ${orientation === 'teacher' ? `<div class="podium-bottom">${podiumHtml}</div>` : ''}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${titleText}_${orientationFileTag}_인쇄용_${fileDateStr}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    triggerDownloadFeedback(
      '📄 인쇄용 HTML 파일이 저장되었습니다! 파일을 더블클릭하면 바로 인쇄할 수 있습니다.'
    );
  };

  const getPrintNameFontClass = (name: string, isActualPrint: boolean) => {
    const len = name.trim().length;
    if (isActualPrint) {
      if (len >= 5) return 'text-sm font-bold';
      if (len === 4) return 'text-base font-bold';
      return 'text-xl font-extrabold';
    }
    if (len >= 5) return 'text-xs font-bold';
    if (len === 4) return 'text-sm font-bold';
    return 'text-base font-bold';
  };

  const renderPrintSheet = (isActualPrint: boolean) => (
    <div
      id={isActualPrint ? 'print-sheet-final' : 'print-area'}
      className={
        isActualPrint
          ? 'w-full bg-white px-4 py-3 flex flex-col items-center justify-between'
          : 'w-full max-w-3xl bg-white p-6 rounded-2xl shadow-md border border-gray-300 flex flex-col items-center'
      }
    >
      {/* Header info */}
      <div
        className={`w-full text-center border-b-2 border-gray-800 ${
          isActualPrint ? 'pb-3 mb-5' : 'pb-3 mb-4'
        }`}
      >
        <h1
          className={`${
            isActualPrint ? 'text-3xl' : 'text-2xl'
          } font-extrabold text-gray-900 tracking-tight`}
        >
          {titleText}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          배치 일자: {todayStr} · {orientationLabel}
        </p>
      </div>

      {/* 학생 시선: 교탁이 맨 위쪽 */}
      {orientation === 'student' && (
        <div
          className={`${
            isActualPrint ? 'w-64 py-2.5 mb-6 text-base' : 'w-52 py-2 mb-4 text-sm'
          } bg-gray-100 border-2 border-gray-500 rounded-xl text-center font-bold text-gray-800 whitespace-nowrap`}
        >
          🍎 교탁 (칠판)
        </div>
      )}

      {/* Classroom Seat Grid (직접 좌표 반전 렌더링으로 텍스트 정방향 + 한 줄 고정) */}
      <div
        className={`grid w-full ${isActualPrint ? 'gap-3' : 'gap-2'}`}
        style={{
          gridTemplateColumns,
        }}
      >
        {orderedRows.map((r) =>
          orderedCols.map((c) => {
            const seat = seats.find((s) => s.r === r && s.c === c);
            if (!seat) {
              return (
                <div
                  key={`${isActualPrint ? 'p' : 'v'}-empty-${r}-${c}`}
                  className={isActualPrint ? 'h-16' : 'h-12'}
                />
              );
            }

            return (
              <div
                key={`${isActualPrint ? 'p' : 'v'}-seat-${seat.id}`}
                className={`${
                  isActualPrint ? 'h-16 px-2' : 'h-12 px-1.5'
                } border-2 border-gray-500 rounded-xl flex items-center justify-center text-center overflow-hidden ${
                  seat.name.trim()
                    ? 'bg-gray-50 text-gray-900'
                    : 'bg-white text-gray-300'
                }`}
              >
                <span
                  className={`block w-full text-center whitespace-nowrap overflow-hidden text-ellipsis leading-none tracking-tight ${getPrintNameFontClass(
                    seat.name,
                    isActualPrint
                  )}`}
                >
                  {seat.name || ''}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* 교사 시선: 교탁이 맨 아래쪽 */}
      {orientation === 'teacher' && (
        <div
          className={`${
            isActualPrint ? 'w-64 py-2.5 mt-6 text-base' : 'w-52 py-2 mt-4 text-sm'
          } bg-gray-100 border-2 border-gray-500 rounded-xl text-center font-bold text-gray-800 whitespace-nowrap`}
        >
          🍎 교탁 (칠판)
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Screen Preview Modal (hidden during actual printing) */}
      <div
        id="print-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none no-print"
      >
        <div className="w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Modal Header */}
          <div className="bg-amber-500 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Printer className="w-5 h-5" />
              <h2 className="text-lg font-bold">🖨️ 자리 배치표 출력 및 파일 저장</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xs font-bold text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Options Toolbar */}
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-700">시선 방향:</span>
              <button
                type="button"
                onClick={() => setOrientation('teacher')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  orientation === 'teacher'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <RotateCw className="w-3 h-3" />
                <span>교사 시선 (교탁 아래쪽)</span>
              </button>
              <button
                type="button"
                onClick={() => setOrientation('student')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  orientation === 'student'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                학생 시선 (교탁 위쪽)
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPNG}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <ImageDown className="w-4 h-4 text-emerald-600" />
                <span>이미지(PNG) 저장</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPrintableHTML}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>인쇄용 HTML 저장</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-200 flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>지금 인쇄하기 (A4 가로)</span>
              </button>
            </div>
          </div>

          {downloadFeedback && (
            <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-bold text-center">
              {downloadFeedback}
            </div>
          )}

          {/* Print Preview Canvas */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex items-center justify-center">
            {renderPrintSheet(false)}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-gray-500">
              미리보기 화면에서 프린트 창이 열리지 않을 경우 <strong>[인쇄용 HTML 저장]</strong>(더블클릭 후 인쇄) 또는 <strong>[이미지(PNG) 저장]</strong>을 이용하세요.
            </span>
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

      {/* Dedicated Clean Print Output Sheet (only visible to browser print dialog / printer) */}
      <div
        id="print-output-sheet"
        className="hidden print:flex print:w-full print:flex-col print:items-center print:justify-center print:bg-white"
      >
        {renderPrintSheet(true)}
      </div>
    </>
  );
};

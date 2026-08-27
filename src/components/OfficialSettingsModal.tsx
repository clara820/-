import React, { useState } from 'react';
import { NearRule, AvoidRule, Student, ClassroomConfig } from '../types';
import { Settings, Users, HeartHandshake, UserX, Sparkles, Plus, Trash2, Check, LayoutGrid } from 'lucide-react';

interface OfficialSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  nearRules: NearRule[];
  onSaveNearRules: (rules: NearRule[]) => void;
  avoidRules: AvoidRule[];
  onSaveAvoidRules: (rules: AvoidRule[]) => void;
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  config: ClassroomConfig;
  onUpdateConfig: (config: ClassroomConfig) => void;
  onEnterEditMode: () => void;
  onOpenSecretRoom: () => void;
}

export const OfficialSettingsModal: React.FC<OfficialSettingsModalProps> = ({
  isOpen,
  onClose,
  nearRules,
  onSaveNearRules,
  avoidRules,
  onSaveAvoidRules,
  students,
  onUpdateStudents,
  config,
  onUpdateConfig,
  onEnterEditMode,
  onOpenSecretRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'near' | 'avoid' | 'students' | 'display'>('near');

  // Local states for rules
  const [localNear, setLocalNear] = useState<NearRule[]>(nearRules);
  const [nearProximityTab, setNearProximityTab] = useState<number>(0);

  const [localAvoid, setLocalAvoid] = useState<AvoidRule[]>(avoidRules);
  const [avoidRadiusTab, setAvoidRadiusTab] = useState<number>(0);

  const [localStudents, setLocalStudents] = useState<Student[]>(students);
  const [singleStudentInput, setSingleStudentInput] = useState('');
  const [batchNamesText, setBatchNamesText] = useState('');
  const [showBatchInput, setShowBatchInput] = useState(false);

  if (!isOpen) return null;

  const handleSaveAll = () => {
    onSaveNearRules(localNear);
    onSaveAvoidRules(localAvoid);
    onUpdateStudents(localStudents);
    onClose();
  };

  const handleAddDirectStudent = (input: string) => {
    if (!input.trim()) return;
    const rawNames = input
      .split(/[\n,\s]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (rawNames.length === 0) return;

    const newEntries: Student[] = rawNames.map((name, index) => ({
      id: `stu-${Date.now()}-${Math.random()}-${index}`,
      name,
      status: 'active',
    }));

    setLocalStudents((prev) => [...prev, ...newEntries]);
    setSingleStudentInput('');
  };

  const handleUpdateStudentName = (id: string, newName: string) => {
    setLocalStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newName } : s))
    );
  };

  const handleDeleteStudent = (id: string) => {
    setLocalStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const addNearRule = () => {
    setLocalNear([
      ...localNear,
      {
        id: `near-${Date.now()}`,
        n1: '',
        n2: '',
        proximity: nearProximityTab,
        label: nearProximityTab === 0 ? '짝꿍 쿠폰' : '가까이 앉기',
      },
    ]);
  };

  const updateNearRule = (id: string, field: 'n1' | 'n2', value: string) => {
    setLocalNear(
      localNear.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const deleteNearRule = (id: string) => {
    setLocalNear(localNear.filter((r) => r.id !== id));
  };

  const addAvoidRule = () => {
    setLocalAvoid([
      ...localAvoid,
      {
        id: `avoid-${Date.now()}`,
        n1: '',
        n2: '',
        radius: avoidRadiusTab,
        label: '따로 앉히기',
      },
    ]);
  };

  const updateAvoidRule = (id: string, field: 'n1' | 'n2', value: string) => {
    setLocalAvoid(
      localAvoid.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const deleteAvoidRule = (id: string) => {
    setLocalAvoid(localAvoid.filter((r) => r.id !== id));
  };

  const handleBatchStudentAdd = () => {
    const rawNames = batchNamesText
      .split(/[\n,\s]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (rawNames.length === 0) return;

    const newStudentList: Student[] = rawNames.map((name, index) => ({
      id: `stu-${Date.now()}-${index}`,
      name,
      status: 'active',
    }));

    setLocalStudents(newStudentList);
    setShowBatchInput(false);
    setBatchNamesText('');
  };

  const toggleStudentStatus = (id: string) => {
    setLocalStudents(
      localStudents.map((s) => {
        if (s.id !== id) return s;
        const nextStatus =
          s.status === 'active'
            ? 'long_term_absent'
            : s.status === 'long_term_absent'
            ? 'frequent_absent'
            : 'active';
        return { ...s, status: nextStatus };
      })
    );
  };

  const NEAR_MODE_DESCS = [
    '두 학생은 무조건 바로 옆 짝꿍(좌우 1칸)으로 배치됩니다.',
    '상하좌우 및 대각선 1칸 이내 가까운 자리에 배치됩니다.',
    '2칸 이내의 가까운 영역에 배치됩니다.',
  ];

  const AVOID_MODE_DESCS = [
    '바로 옆 짝꿍(1칸)이 되지 않도록 분리합니다.',
    '상하좌우 및 대각선 1칸 이내에 앉지 않도록 분리합니다.',
    '2칸 이내(완전 분리)에 앉지 않도록 멀리 떨어뜨립니다.',
  ];

  return (
    <div
      id="official-settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none animate-fade-in"
    >
      <div
        id="official-settings-container"
        className="w-full max-w-xl max-h-[88vh] bg-white rounded-3xl shadow-2xl border border-purple-100 flex flex-col overflow-hidden animate-scale-up"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-gaegu tracking-wide">⚙️ 자리바꾸기 환경 설정</h2>
              <p className="text-[11px] text-purple-100 font-sans">짝꿍 지정, 따로 앉히기, 학생 명단 관리</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-xs font-bold text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Action shortcut banner for Edit Layout Mode */}
        <div className="bg-purple-50/70 border-b border-purple-100 px-5 py-2.5 flex items-center justify-between">
          <span className="text-xs text-purple-800 font-bold flex items-center gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5 text-purple-600" />
            교실 책상 배열(모양/분단)을 직접 수정하고 싶으신가요?
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEnterEditMode();
            }}
            className="px-3 py-1 bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold shadow-2xs transition-colors"
          >
            🪑 자리 배열 수정 모드
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 px-4 pt-2 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('near')}
            className={`px-3.5 py-2 rounded-t-xl font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'near'
                ? 'bg-white text-purple-700 border-t-2 border-x border-purple-300 shadow-2xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 text-purple-600" />
            <span>🤝 짝꿍/가까이 지정 ({localNear.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('avoid')}
            className={`px-3.5 py-2 rounded-t-xl font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'avoid'
                ? 'bg-white text-rose-700 border-t-2 border-x border-rose-300 shadow-2xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <UserX className="w-3.5 h-3.5 text-rose-500" />
            <span>💔 따로 앉히기 ({localAvoid.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`px-3.5 py-2 rounded-t-xl font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'students'
                ? 'bg-white text-indigo-700 border-t-2 border-x border-indigo-300 shadow-2xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>👥 학생 명단 ({localStudents.length}명)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('display')}
            className={`px-3.5 py-2 rounded-t-xl font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'display'
                ? 'bg-white text-pink-700 border-t-2 border-x border-pink-300 shadow-2xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            <span>✨ 효과 & 연출</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: NEAR RULES */}
          {activeTab === 'near' && (
            <div className="space-y-3">
              <div className="flex rounded-xl bg-purple-50 p-1 border border-purple-200">
                {['🤝 꼭 짝꿍으로', '💛 바로 옆 1칸', '🌸 근처 2칸 이내'].map((label, idx) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setNearProximityTab(idx)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      nearProximityTab === idx
                        ? 'bg-white text-purple-800 shadow-xs'
                        : 'text-purple-600/70 hover:text-purple-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <p className="text-xs text-purple-700 font-medium px-1">
                {NEAR_MODE_DESCS[nearProximityTab]}
              </p>

              {/* List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {localNear
                  .filter((r) => r.proximity === nearProximityTab)
                  .map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-2xl border border-gray-200"
                    >
                      <input
                        type="text"
                        list="official-students-datalist"
                        value={rule.n1}
                        placeholder="학생 1"
                        onChange={(e) => updateNearRule(rule.id, 'n1', e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-center text-sm font-gaegu font-bold focus:border-purple-400 outline-none"
                      />
                      <span className="text-purple-500 font-bold text-xs">↔</span>
                      <input
                        type="text"
                        list="official-students-datalist"
                        value={rule.n2}
                        placeholder="학생 2"
                        onChange={(e) => updateNearRule(rule.id, 'n2', e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-center text-sm font-gaegu font-bold focus:border-purple-400 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => deleteNearRule(rule.id)}
                        className="p-1 text-gray-400 hover:text-rose-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>

              <button
                type="button"
                onClick={addNearRule}
                className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-dashed border-purple-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ 짝꿍 학생 추가하기</span>
              </button>
            </div>
          )}

          {/* TAB 2: AVOID RULES */}
          {activeTab === 'avoid' && (
            <div className="space-y-3">
              <div className="flex rounded-xl bg-rose-50 p-1 border border-rose-200">
                {['🪑 짝꿍만 안됨', '📏 바로 옆 1칸 안됨', '🚧 2칸 이내 안됨'].map((label, idx) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setAvoidRadiusTab(idx)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      avoidRadiusTab === idx
                        ? 'bg-white text-rose-800 shadow-xs'
                        : 'text-rose-600/70 hover:text-rose-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <p className="text-xs text-rose-700 font-medium px-1">
                {AVOID_MODE_DESCS[avoidRadiusTab]}
              </p>

              {/* List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {localAvoid
                  .filter((r) => r.radius === avoidRadiusTab)
                  .map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-2xl border border-gray-200"
                    >
                      <input
                        type="text"
                        list="official-students-datalist"
                        value={rule.n1}
                        placeholder="학생 1"
                        onChange={(e) => updateAvoidRule(rule.id, 'n1', e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-center text-sm font-gaegu font-bold focus:border-rose-400 outline-none"
                      />
                      <span className="text-rose-400 font-bold text-xs">≠</span>
                      <input
                        type="text"
                        list="official-students-datalist"
                        value={rule.n2}
                        placeholder="학생 2"
                        onChange={(e) => updateAvoidRule(rule.id, 'n2', e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-center text-sm font-gaegu font-bold focus:border-rose-400 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => deleteAvoidRule(rule.id)}
                        className="p-1 text-gray-400 hover:text-rose-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>

              <button
                type="button"
                onClick={addAvoidRule}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-dashed border-rose-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ 따로 앉힐 학생 추가하기</span>
              </button>
            </div>
          )}

          {/* TAB 3: STUDENT ROSTER */}
          {activeTab === 'students' && (
            <div className="space-y-3">
              {/* Direct Name Input */}
              <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-200 space-y-2">
                <label className="block text-xs font-bold text-indigo-900 flex items-center justify-between">
                  <span>✍️ 학생 이름 직접 써서 추가</span>
                  <span className="text-[11px] text-indigo-600 font-normal">여러 명 입력 시 띄어쓰기 또는 쉼표로 구분</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={singleStudentInput}
                    onChange={(e) => setSingleStudentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDirectStudent(singleStudentInput);
                      }
                    }}
                    placeholder="학생 이름 입력 (예: 김철수, 이영희, 박민수)"
                    className="flex-1 px-3.5 py-2 bg-white border border-indigo-200 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddDirectStudent(singleStudentInput)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>추가</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-600 font-bold">
                  등록된 학생 명단 (총 {localStudents.length}명)
                </span>
                <button
                  type="button"
                  onClick={() => setShowBatchInput(!showBatchInput)}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors"
                >
                  {showBatchInput ? '명단 입력기 닫기' : '📋 대량 일괄 붙여넣기'}
                </button>
              </div>

              {showBatchInput && (
                <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-2">
                  <textarea
                    rows={4}
                    value={batchNamesText}
                    onChange={(e) => setBatchNamesText(e.target.value)}
                    placeholder="학생 이름을 줄바꿈이나 띄어쓰기로 구분하여 붙여넣으세요. (예: 김철수 이영희 박민수)"
                    className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-xs font-sans outline-none focus:border-indigo-400"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleBatchStudentAdd}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      전체 덮어쓰기 적용
                    </button>
                  </div>
                </div>
              )}

              {/* Student chips with inline edit, delete, and attendance toggle */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                {localStudents.map((s, idx) => (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs shadow-2xs transition-colors ${
                      s.status === 'long_term_absent'
                        ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                        : s.status === 'frequent_absent'
                        ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                        : 'bg-white border-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-1">
                      <span className="text-[10px] text-gray-400">{idx + 1}.</span>
                      <input
                        type="text"
                        value={s.name}
                        onChange={(e) => handleUpdateStudentName(s.id, e.target.value)}
                        className="text-sm font-bold bg-transparent border-b border-transparent hover:border-indigo-200 focus:border-indigo-500 outline-none w-full truncate"
                        title="이름을 클릭하여 수정할 수 있습니다"
                      />
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleStudentStatus(s.id)}
                        title="클릭하여 결석 상태 전환 (정상 등교 ↔ 장기 결석 ↔ 잦은 결석)"
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold transition-colors ${
                          s.status === 'long_term_absent'
                            ? 'bg-amber-200 text-amber-900'
                            : s.status === 'frequent_absent'
                            ? 'bg-rose-200 text-rose-900'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {s.status === 'long_term_absent'
                          ? '장기결석'
                          : s.status === 'frequent_absent'
                          ? '잦은결석'
                          : '등교'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStudent(s.id)}
                        className="text-gray-300 hover:text-rose-500 p-0.5 rounded-sm transition-colors"
                        title="학생 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-gray-500">
                * 이름을 직접 클릭하여 수정하거나 ✕를 눌러 삭제할 수 있습니다.
              </p>
            </div>
          )}

          {/* TAB 4: EFFECTS & STYLING */}
          {activeTab === 'display' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-600">학급 타이틀</label>
                <input
                  type="text"
                  value={config.className}
                  onChange={(e) => onUpdateConfig({ ...config, className: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-gaegu font-bold focus:border-pink-400 outline-none"
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-xs font-bold text-gray-700">🎉 카운트다운 & 꽃가루 효과 사용</span>
                  <input
                    type="checkbox"
                    checked={config.useEffects}
                    onChange={(e) => onUpdateConfig({ ...config, useEffects: e.target.checked })}
                    className="w-4 h-4 text-pink-600 rounded-sm focus:ring-pink-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-xs font-bold text-gray-700">🔊 두근두근 효과음 및 팡파레 사운드</span>
                  <input
                    type="checkbox"
                    checked={config.useSound}
                    onChange={(e) => onUpdateConfig({ ...config, useSound: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded-sm focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global Datalist for autocomplete */}
        <datalist id="official-students-datalist">
          {localStudents.map((stu) => (
            <option key={`opt-${stu.id}`} value={stu.name} />
          ))}
        </datalist>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onOpenSecretRoom}
            className="text-[11px] text-gray-400 hover:text-pink-600 transition-colors flex items-center gap-1"
          >
            <span>🔒 선생님 맞춤 고급 설정</span>
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-colors"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>설정 저장</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

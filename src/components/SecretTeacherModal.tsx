import React, { useState } from 'react';
import { SecretSettings, Seat, Student } from '../types';
import { ShieldAlert, Sparkles, Users, ArrowUpDown, Key, Check, Plus, Trash2, Eye, EyeOff, Info, Copy } from 'lucide-react';

interface SecretTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  secretSettings: SecretSettings;
  onSaveSecretSettings: (updated: SecretSettings) => void;
  currentSeats: Seat[];
  students: Student[];
  onApplyPresetNow: () => void;
}

export const SecretTeacherModal: React.FC<SecretTeacherModalProps> = ({
  isOpen,
  onClose,
  secretSettings,
  onSaveSecretSettings,
  currentSeats,
  students,
  onApplyPresetNow,
}) => {
  const [settings, setSettings] = useState<SecretSettings>(secretSettings);
  const [activeTab, setActiveTab] = useState<'spacebar' | 'island' | 'vertical' | 'avoid'>('spacebar');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [quickSeatStudentName, setQuickSeatStudentName] = useState('');
  const [newAvoidMemberInput, setNewAvoidMemberInput] = useState('');

  if (!isOpen) return null;

  const handleCaptureCurrentLayout = () => {
    const newPreset: Record<number, string> = {};
    currentSeats.forEach((s) => {
      newPreset[s.id] = s.name;
    });
    setSettings((prev) => ({
      ...prev,
      presetLayout: newPreset,
    }));
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handleSave = () => {
    onSaveSecretSettings(settings);
    onClose();
  };

  const updateIslandPair = (pairIndex: number, studentIndex: 0 | 1, value: string) => {
    const newPairs = [...settings.islandGroup.pairs] as [string, string][];
    if (!newPairs[pairIndex]) {
      newPairs[pairIndex] = ['', ''];
    }
    newPairs[pairIndex][studentIndex] = value;
    setSettings({
      ...settings,
      islandGroup: {
        ...settings.islandGroup,
        pairs: newPairs,
      },
    });
  };

  const addIslandPair = () => {
    setSettings({
      ...settings,
      islandGroup: {
        ...settings.islandGroup,
        pairs: [...settings.islandGroup.pairs, ['', '']],
      },
    });
  };

  const removeIslandPair = (index: number) => {
    const newPairs = settings.islandGroup.pairs.filter((_, i) => i !== index);
    setSettings({
      ...settings,
      islandGroup: {
        ...settings.islandGroup,
        pairs: newPairs,
      },
    });
  };

  const addVerticalFriend = (friendName: string) => {
    if (!friendName.trim()) return;
    if (settings.verticalAffinity.preferredFrontBackStudents.includes(friendName.trim())) return;
    setSettings({
      ...settings,
      verticalAffinity: {
        ...settings.verticalAffinity,
        preferredFrontBackStudents: [...settings.verticalAffinity.preferredFrontBackStudents, friendName.trim()],
      },
    });
  };

  const removeVerticalFriend = (friendName: string) => {
    setSettings({
      ...settings,
      verticalAffinity: {
        ...settings.verticalAffinity,
        preferredFrontBackStudents: settings.verticalAffinity.preferredFrontBackStudents.filter((f) => f !== friendName),
      },
    });
  };

  const addAvoidMember = (memberName: string) => {
    if (!memberName.trim()) return;
    const trimmed = memberName.trim();
    if (settings.avoidSpecificGroup.avoidMembers.includes(trimmed)) return;
    setSettings({
      ...settings,
      avoidSpecificGroup: {
        ...settings.avoidSpecificGroup,
        avoidMembers: [...settings.avoidSpecificGroup.avoidMembers, trimmed],
      },
    });
    setNewAvoidMemberInput('');
  };

  const removeAvoidMember = (memberName: string) => {
    setSettings({
      ...settings,
      avoidSpecificGroup: {
        ...settings.avoidSpecificGroup,
        avoidMembers: settings.avoidSpecificGroup.avoidMembers.filter((m) => m !== memberName),
      },
    });
  };

  const assignNameToNextEmptySeat = (name: string) => {
    if (!name.trim()) return;
    const trimmed = name.trim();
    // Find first seat in currentSeats that has empty presetLayout or empty name
    const emptySeat = currentSeats.find((s) => {
      const val = settings.presetLayout?.[s.id] ?? s.name;
      return !val || val.trim() === '';
    });

    if (emptySeat) {
      setSettings((prev) => ({
        ...prev,
        presetLayout: {
          ...prev.presetLayout,
          [emptySeat.id]: trimmed,
        },
      }));
    } else if (currentSeats.length > 0) {
      // If all filled, fill first seat
      setSettings((prev) => ({
        ...prev,
        presetLayout: {
          ...prev.presetLayout,
          [currentSeats[0].id]: trimmed,
        },
      }));
    }
    setQuickSeatStudentName('');
  };

  return (
    <div
      id="secret-teacher-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in select-none"
    >
      <div
        id="secret-teacher-modal-container"
        className="w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border-2 border-pink-200 flex flex-col overflow-hidden animate-scale-up"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-gaegu tracking-wide flex items-center gap-2">
                🔒 선생님 비밀 관제실 (Secret Room)
              </h2>
              <p className="text-xs text-pink-100 font-sans">
                아이들에게는 절대 노출되지 않는 비밀 조건 및 스페이스바 연출 세팅
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-sm font-bold text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 bg-pink-50/40 px-4 pt-3 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('spacebar')}
            className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'spacebar'
                ? 'bg-white text-pink-600 border-t-2 border-x border-pink-300 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Key className="w-4 h-4 text-pink-500" />
            <span>스페이스바 비밀 프리셋</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('island')}
            className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'island'
                ? 'bg-white text-pink-600 border-t-2 border-x border-pink-300 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Users className="w-4 h-4 text-purple-500" />
            <span>2인 3팀 섬(Island) 분산</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vertical')}
            className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'vertical'
                ? 'bg-white text-pink-600 border-t-2 border-x border-pink-300 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <ArrowUpDown className="w-4 h-4 text-indigo-500" />
            <span>앞뒤(전후) 우호 지정</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('avoid')}
            className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'avoid'
                ? 'bg-white text-pink-600 border-t-2 border-x border-pink-300 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span>기피 그룹 거리두기</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* TAB 1: SPACEBAR SECRET PRESET */}
          {activeTab === 'spacebar' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border border-pink-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⌨️</span>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">스페이스바(Spacebar) 비밀 발동 원리</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      아이들이 보는 화면에서 <strong className="text-pink-600">스페이스바를 누른 채로 [자리 바꾸기] 버튼을 클릭</strong>하면,
                      3-2-1 카운트다운과 효과음이 동일하게 나와 아이들은 완벽한 랜덤으로 믿지만, 실제로는 아래 설정된 <strong className="text-purple-700">선생님 지정 완벽 배치표</strong>로 자연스럽게 배치됩니다!
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enable-spacebar-trigger"
                    checked={settings.spacebarTriggerEnabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        spacebarTriggerEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-pink-600 rounded-sm focus:ring-pink-500"
                  />
                  <label htmlFor="enable-spacebar-trigger" className="text-sm font-bold text-gray-700 cursor-pointer">
                    스페이스바 비밀 발동 기능 켜기
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleCaptureCurrentLayout}
                  className="px-3.5 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>현재 교실 배치를 비밀 프리셋으로 캡처</span>
                </button>
              </div>

              {copiedNotification && (
                <div className="p-2.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl text-center animate-fade-in">
                  ✨ 현재 화면의 자리 배치가 비밀 프리셋으로 완벽하게 저장되었습니다!
                </div>
              )}

              {/* Direct Name Input for Preset Seats */}
              <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-200">
                <label className="block text-xs font-bold text-purple-900 mb-1.5 flex items-center justify-between">
                  <span>✍️ 학생 이름을 직접 써서 비밀 좌석표에 추가</span>
                  <span className="text-[11px] text-purple-600 font-normal">엔터를 치면 빈 좌석에 순서대로 배정됩니다</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    list="secret-students-datalist"
                    value={quickSeatStudentName}
                    onChange={(e) => setQuickSeatStudentName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        assignNameToNextEmptySeat(quickSeatStudentName);
                      }
                    }}
                    placeholder="학생 이름 입력 (예: 홍길동)"
                    className="flex-1 px-3.5 py-2 bg-white border border-purple-200 rounded-xl text-sm font-bold focus:border-purple-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => assignNameToNextEmptySeat(quickSeatStudentName)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>좌석에 추가</span>
                  </button>
                </div>
              </div>

              {/* Preset Preview Table */}
              <div className="border border-gray-200 rounded-2xl p-3.5 bg-gray-50/60">
                <h4 className="text-xs font-bold text-gray-600 mb-2 flex items-center justify-between">
                  <span>현재 등록된 비밀 배치표 미리보기 & 직접 이름 수정</span>
                  <span className="text-[11px] text-pink-600 font-normal">
                    총 {Object.keys(settings.presetLayout || {}).length}개 좌석 매핑
                  </span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {currentSeats.map((seat) => {
                    const currentName = settings.presetLayout?.[seat.id] ?? seat.name;
                    return (
                      <div
                        key={`preset-seat-${seat.id}`}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-gray-200 text-xs shadow-2xs hover:border-pink-300 transition-colors"
                      >
                        <span className="text-gray-400 font-mono text-[10px]">
                          [{seat.r + 1}열 {seat.c + 1}행]
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            list="secret-students-datalist"
                            value={currentName}
                            placeholder="빈자리"
                            onChange={(e) => {
                              setSettings({
                                ...settings,
                                presetLayout: {
                                  ...settings.presetLayout,
                                  [seat.id]: e.target.value,
                                },
                              });
                            }}
                            className="w-20 text-right text-sm font-bold text-purple-900 bg-transparent border-b border-purple-200 focus:border-pink-500 outline-none"
                          />
                          {currentName && currentName.trim() !== '' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSettings({
                                  ...settings,
                                  presetLayout: {
                                    ...settings.presetLayout,
                                    [seat.id]: '',
                                  },
                                });
                              }}
                              className="text-gray-300 hover:text-rose-500 text-[10px] font-bold p-0.5"
                              title="이름 지우기"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onApplyPresetNow();
                    onClose();
                  }}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-colors"
                >
                  지금 즉시 이 프리셋 교실에 반영하기
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ISLAND 3-TEAM SEPARATION */}
          {activeTab === 'island' && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🏝️</span>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">여학생 6인 (2인 3팀) 섬(Island) 분산 배치</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      쿠폰으로 짝꿍을 맺은 6명의 여학생(2명씩 3쌍)을 각자 짝꿍끼리는 앉히되,
                      <strong className="text-purple-700"> 3팀이 서로 앞뒤/상하좌우로 절대 닿지 않도록 고립된 3개의 섬 형태로 분산 배치</strong>합니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enable-island-rule"
                    checked={settings.islandGroup.enabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        islandGroup: {
                          ...settings.islandGroup,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-purple-600 rounded-sm focus:ring-purple-500"
                  />
                  <label htmlFor="enable-island-rule" className="text-sm font-bold text-gray-700 cursor-pointer">
                    2인 3팀 섬(Island) 분산 규칙 활성화
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enforce-island-dist"
                    checked={settings.islandGroup.enforceIslandSeparation}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        islandGroup: {
                          ...settings.islandGroup,
                          enforceIslandSeparation: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-purple-600 rounded-sm focus:ring-purple-500"
                  />
                  <label htmlFor="enforce-island-dist" className="text-xs text-gray-600 cursor-pointer">
                    앞뒤/상하좌우 완전 분리 강제
                  </label>
                </div>
              </div>

              {/* Pairs List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-gray-600">지정된 2인 팀 목록 (총 {settings.islandGroup.pairs.length}팀)</h4>
                {settings.islandGroup.pairs.map((pair, idx) => (
                  <div
                    key={`island-pair-${idx}`}
                    className="flex items-center gap-2 p-2.5 bg-white border border-purple-100 rounded-2xl shadow-xs"
                  >
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      list="secret-students-datalist"
                      value={pair[0]}
                      placeholder="학생 1"
                      onChange={(e) => updateIslandPair(idx, 0, e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl text-center text-sm font-gaegu font-bold focus:border-purple-400 outline-none"
                    />
                    <span className="text-purple-400 font-bold text-xs">↔ 짝꿍 ↔</span>
                    <input
                      type="text"
                      list="secret-students-datalist"
                      value={pair[1]}
                      placeholder="학생 2"
                      onChange={(e) => updateIslandPair(idx, 1, e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl text-center text-sm font-gaegu font-bold focus:border-purple-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeIslandPair(idx)}
                      className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addIslandPair}
                  className="w-full py-2 bg-gray-50 hover:bg-purple-50 text-purple-700 border border-dashed border-purple-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>2인 팀 추가하기</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: VERTICAL FRIEND AFFINITY */}
          {activeTab === 'vertical' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⬆️⬇️</span>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">앞뒤(전후) 우호 멤버 밀착 배치</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      특정 학생(예: 남학생 김도윤)의 <strong className="text-indigo-700">바로 앞자리 또는 뒷자리에 성향이 잘 맞고 우호적인 친구를 우선적으로 배치</strong>하여 심리적 안정감을 줍니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enable-vert-rule"
                    checked={settings.verticalAffinity.enabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        verticalAffinity: {
                          ...settings.verticalAffinity,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500"
                  />
                  <label htmlFor="enable-vert-rule" className="text-sm font-bold text-gray-700 cursor-pointer">
                    앞뒤 우호 멤버 밀착 배치 활성화
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">대상 학생 이름 (보호 및 지원 필요 학생)</label>
                  <input
                    type="text"
                    list="secret-students-datalist"
                    value={settings.verticalAffinity.targetStudent}
                    placeholder="예: 김도윤"
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        verticalAffinity: {
                          ...settings.verticalAffinity,
                          targetStudent: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-gaegu font-bold focus:border-indigo-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">
                    앞자리 또는 뒷자리에 붙여줄 우호 친구 목록
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {settings.verticalAffinity.preferredFrontBackStudents.map((friend) => (
                      <span
                        key={friend}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold"
                      >
                        <span>{friend}</span>
                        <button
                          type="button"
                          onClick={() => removeVerticalFriend(friend)}
                          className="hover:text-rose-600 text-indigo-400 font-bold"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add friend selector */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      list="secret-students-datalist"
                      id="new-vert-friend-input"
                      placeholder="친구 이름 직접 입력 후 추가"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value;
                          addVerticalFriend(val);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-400 font-gaegu"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('new-vert-friend-input') as HTMLInputElement;
                        if (el && el.value) {
                          addVerticalFriend(el.value);
                          el.value = '';
                        }
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      추가
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AVOID SPECIFIC GROUP */}
          {activeTab === 'avoid' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🚫</span>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">특정 학생 ↔ 그룹 간 완전 거리두기</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      특정 학생(남학생)과 갈등 또는 부담이 있는 그룹 간 <strong className="text-rose-700">상하좌우 및 대각선 1칸 이내 배치를 절대 방지</strong>합니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enable-avoid-group"
                    checked={settings.avoidSpecificGroup.enabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        avoidSpecificGroup: {
                          ...settings.avoidSpecificGroup,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-500"
                  />
                  <label htmlFor="enable-avoid-group" className="text-sm font-bold text-gray-700 cursor-pointer">
                    그룹 거리두기 규칙 활성화
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">거리둘 학생 (예: 남학생)</label>
                  <input
                    type="text"
                    list="secret-students-datalist"
                    value={settings.avoidSpecificGroup.student}
                    placeholder="거리둘 학생 이름 입력"
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        avoidSpecificGroup: {
                          ...settings.avoidSpecificGroup,
                          student: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-gaegu font-bold focus:border-rose-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">인접 금지 대상 그룹 멤버 (총 {settings.avoidSpecificGroup.avoidMembers.length}명)</label>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-xl border border-gray-200 mb-2">
                    {settings.avoidSpecificGroup.avoidMembers.map((mem) => (
                      <span
                        key={mem}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg text-xs font-bold"
                      >
                        <span>{mem}</span>
                        <button
                          type="button"
                          onClick={() => removeAvoidMember(mem)}
                          className="hover:text-rose-900 text-rose-400 font-bold"
                          title="멤버 삭제"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                    {settings.avoidSpecificGroup.avoidMembers.length === 0 && (
                      <span className="text-xs text-gray-400">등록된 멤버가 없습니다.</span>
                    )}
                  </div>

                  {/* Add avoid member input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      list="secret-students-datalist"
                      value={newAvoidMemberInput}
                      onChange={(e) => setNewAvoidMemberInput(e.target.value)}
                      placeholder="그룹 멤버 이름 직접 입력 후 추가"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addAvoidMember(newAvoidMemberInput);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-rose-400 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => addAvoidMember(newAvoidMemberInput)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      추가
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global Datalist for autocomplete */}
        <datalist id="secret-students-datalist">
          {students.map((stu) => (
            <option key={`stu-opt-${stu.id}`} value={stu.name} />
          ))}
        </datalist>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Info className="w-3.5 h-3.5 text-pink-500" />
            <span>아이들 화면에는 아무런 표시가 남지 않습니다.</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-200 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>선생님 비밀 세팅 저장</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

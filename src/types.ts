export interface Seat {
  id: number;
  r: number;
  c: number;
  name: string;
  locked: boolean;
  isSpecial?: boolean;
  status?: 'active' | 'empty' | 'absent';
}

export type StudentStatus = 'active' | 'long_term_absent' | 'frequent_absent';

export interface Student {
  id: string;
  name: string;
  gender?: 'M' | 'F' | 'none';
  status: StudentStatus;
  notes?: string;
}

export interface NearRule {
  id: string;
  n1: string;
  n2: string;
  // 0: 꼭 짝꿍(좌우 1칸), 1: 1칸 이내(8방향), 2: 2칸 이내
  proximity: number;
  label?: string;
}

export interface AvoidRule {
  id: string;
  n1: string;
  n2: string;
  // 0: 짝꿍만 안됨, 1: 1칸 이내(8방향) 안됨, 2: 2칸 반경 안됨
  radius: number;
  label?: string;
}

export interface VerticalRule {
  id: string;
  targetStudent: string; // 대상 학생 (예: 남학생)
  preferredFrontBackStudents: string[]; // 앞이나 뒤에 앉으면 좋은 우호 친구들
  enabled: boolean;
}

export interface IslandGroupRule {
  id: string;
  name: string;
  // 3 pairs of students: [ [s1, s2], [s3, s4], [s5, s6] ]
  pairs: [string, string][];
  enabled: boolean;
  // Prevent any pair from being adjacent (vertically, horizontally, or diagonally) to other pairs
  enforceIslandSeparation: boolean;
}

export interface SecretSettings {
  enabled: boolean;
  // If active, pressing spacebar or holding spacebar while clicking shuffle applies this secret preset
  spacebarTriggerEnabled: boolean;
  // Pre-configured layout seat mapping: { [seatId: number]: studentName }
  presetLayout: Record<number, string>;
  presetName: string;
  // 6 girls island rule
  islandGroup: IslandGroupRule;
  // Male student front/back preferred friends rule
  verticalAffinity: VerticalRule;
  // Distance between specific student and island group
  avoidSpecificGroup: {
    student: string;
    avoidMembers: string[];
    enabled: boolean;
  };
}

export interface ClassroomConfig {
  maxRows: number;
  maxCols: number;
  useEffects: boolean;
  useSound: boolean;
  revealStyle: 'all_at_once' | 'sequential' | 'slot_roll';
  countdownSeconds: number;
  teacherDeskPosition: 'top' | 'bottom';
  className: string;
}

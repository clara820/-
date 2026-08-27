import { Student, Seat, SecretSettings, NearRule, AvoidRule, ClassroomConfig } from '../types';

export const INITIAL_STUDENTS: Student[] = [
  // 6 female students (3 coupon pairs)
  { id: 's1', name: '이서연', gender: 'F', status: 'active', notes: '여학생 6인 그룹 1' },
  { id: 's2', name: '박지민', gender: 'F', status: 'active', notes: '여학생 6인 그룹 1' },
  { id: 's3', name: '정수아', gender: 'F', status: 'active', notes: '여학생 6인 그룹 2' },
  { id: 's4', name: '최유나', gender: 'F', status: 'active', notes: '여학생 6인 그룹 2' },
  { id: 's5', name: '한채원', gender: 'F', status: 'active', notes: '여학생 6인 그룹 3' },
  { id: 's6', name: '오다은', gender: 'F', status: 'active', notes: '여학생 6인 그룹 3' },

  // 1 male student who needs friendly neighbors front/back
  { id: 's7', name: '김도윤', gender: 'M', status: 'active', notes: '앞뒤 우호 친구 필요' },

  // Friendly male/female classmates for front/back support
  { id: 's8', name: '이민준', gender: 'M', status: 'active', notes: '차분한 성격' },
  { id: 's9', name: '강태호', gender: 'M', status: 'active', notes: '친절한 성격' },
  { id: 's10', name: '서재현', gender: 'M', status: 'active', notes: '도윤이와 친함' },
  { id: 's11', name: '황지호', gender: 'M', status: 'active', notes: '성실한 성격' },
  { id: 's12', name: '김하율', gender: 'F', status: 'active', notes: '조용한 성격' },
  { id: 's13', name: '송예은', gender: 'F', status: 'active', notes: '성실한 성격' },
  { id: 's14', name: '안소율', gender: 'F', status: 'active', notes: '조용한 성격' },

  // 1 frequent absent student
  { id: 's15', name: '배현우', gender: 'M', status: 'frequent_absent', notes: '거의 등교하지 않음' },

  // 2 long-term absent students
  { id: 's16', name: '조승우', gender: 'M', status: 'long_term_absent', notes: '장기 결석 예정 1' },
  { id: 's17', name: '윤하은', gender: 'F', status: 'long_term_absent', notes: '장기 결석 예정 2' },
];

export const INITIAL_SEATS: Seat[] = [
  // 1분단 (좌측 2인석 3줄)
  { id: 0, r: 1, c: 1, name: '이서연', locked: false, status: 'active' },
  { id: 1, r: 1, c: 2, name: '박지민', locked: false, status: 'active' },
  { id: 2, r: 2, c: 1, name: '이민준', locked: false, status: 'active' },
  { id: 3, r: 2, c: 2, name: '김도윤', locked: false, status: 'active' },
  { id: 4, r: 3, c: 1, name: '강태호', locked: false, status: 'active' },
  { id: 5, r: 3, c: 2, name: '서재현', locked: false, status: 'active' },

  // 2분단 (중앙 2인석 3줄)
  { id: 6, r: 1, c: 4, name: '황지호', locked: false, status: 'active' },
  { id: 7, r: 1, c: 5, name: '김하율', locked: false, status: 'active' },
  { id: 8, r: 2, c: 4, name: '한채원', locked: false, status: 'active' },
  { id: 9, r: 2, c: 5, name: '오다은', locked: false, status: 'active' },
  { id: 10, r: 3, c: 4, name: '송예은', locked: false, status: 'active' },
  { id: 11, r: 3, c: 5, name: '안소율', locked: false, status: 'active' },

  // 3분단 (우측 2인석 2줄 + 1인석)
  { id: 12, r: 1, c: 7, name: '정수아', locked: false, status: 'active' },
  { id: 13, r: 1, c: 8, name: '최유나', locked: false, status: 'active' },
  { id: 14, r: 2, c: 7, name: '배현우', locked: false, status: 'active' },
  { id: 15, r: 2, c: 8, name: '', locked: false, status: 'empty' },
  { id: 16, r: 3, c: 7, name: '', locked: false, status: 'empty' },
];

export const INITIAL_NEAR_RULES: NearRule[] = [
  // 공식 등록된 짝꿍 쿠폰 3쌍
  { id: 'near-1', n1: '이서연', n2: '박지민', proximity: 0, label: '짝꿍 쿠폰 1' },
  { id: 'near-2', n1: '정수아', n2: '최유나', proximity: 0, label: '짝꿍 쿠폰 2' },
  { id: 'near-3', n1: '한채원', n2: '오다은', proximity: 0, label: '짝꿍 쿠폰 3' },
];

export const INITIAL_AVOID_RULES: AvoidRule[] = [
  // 공식적으로 공개된 분리 규칙 (예: 서로 다른 모둠 등)
];

export const INITIAL_SECRET_SETTINGS: SecretSettings = {
  enabled: true,
  spacebarTriggerEnabled: true,
  presetName: '선생님 맞춤형 완벽 배치',
  presetLayout: {
    0: '이서연',
    1: '박지민',
    2: '이민준',
    3: '황지호',
    4: '김도윤',
    5: '서재현',
    6: '송예은',
    7: '안소율',
    8: '정수아',
    9: '최유나',
    10: '강태호',
    11: '김하율',
    12: '한채원',
    13: '오다은',
    14: '배현우',
    15: '',
    16: '',
  },
  islandGroup: {
    id: 'girls-6-group',
    name: '여학생 6인 3쌍 분산 섬 배치',
    pairs: [
      ['이서연', '박지민'],
      ['정수아', '최유나'],
      ['한채원', '오다은'],
    ],
    enabled: true,
    enforceIslandSeparation: true,
  },
  verticalAffinity: {
    id: 'vert-doyun',
    targetStudent: '김도윤',
    preferredFrontBackStudents: ['이민준', '강태호', '서재현', '황지호'],
    enabled: true,
  },
  avoidSpecificGroup: {
    student: '김도윤',
    avoidMembers: ['이서연', '박지민', '정수아', '최유나', '한채원', '오다은'],
    enabled: true,
  },
};

export const INITIAL_CONFIG: ClassroomConfig = {
  maxRows: 6,
  maxCols: 10,
  useEffects: true,
  useSound: true,
  revealStyle: 'all_at_once',
  countdownSeconds: 3,
  teacherDeskPosition: 'top',
  className: '우리반 자리바꾸기',
};

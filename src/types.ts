export type MemberName =
  | '새길'
  | '유옥'
  | '현정'
  | '민규'
  | '혜선'
  | '윤배'
  | '현하'
  | '유진'
  | '다온'
  | '선경'
  | '권웅'
  | '소연'
  | '신혜'
  | '승아';

export interface MemberInfo {
  id: MemberName;
  name: MemberName;
  role?: string;
  avatarBg: string;
  badgeBg: string;
  textColor: string;
}

export const WORKSHOP_MEMBERS: MemberInfo[] = [
  { id: '새길', name: '새길', avatarBg: 'bg-indigo-500', badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-700', textColor: 'text-indigo-600' },
  { id: '유옥', name: '유옥', avatarBg: 'bg-violet-500', badgeBg: 'bg-violet-50 border-violet-200 text-violet-700', textColor: 'text-violet-600' },
  { id: '현정', name: '현정', avatarBg: 'bg-rose-500', badgeBg: 'bg-rose-50 border-rose-200 text-rose-700', textColor: 'text-rose-600' },
  { id: '민규', name: '민규', avatarBg: 'bg-blue-500', badgeBg: 'bg-blue-50 border-blue-200 text-blue-700', textColor: 'text-blue-600' },
  { id: '혜선', name: '혜선', avatarBg: 'bg-pink-500', badgeBg: 'bg-pink-50 border-pink-200 text-pink-700', textColor: 'text-pink-600' },
  { id: '윤배', name: '윤배', avatarBg: 'bg-cyan-500', badgeBg: 'bg-cyan-50 border-cyan-200 text-cyan-700', textColor: 'text-cyan-600' },
  { id: '현하', name: '현하', avatarBg: 'bg-amber-500', badgeBg: 'bg-amber-50 border-amber-200 text-amber-700', textColor: 'text-amber-600' },
  { id: '유진', name: '유진', avatarBg: 'bg-fuchsia-500', badgeBg: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700', textColor: 'text-fuchsia-600' },
  { id: '다온', name: '다온', avatarBg: 'bg-purple-500', badgeBg: 'bg-purple-50 border-purple-200 text-purple-700', textColor: 'text-purple-600' },
  { id: '선경', name: '선경', avatarBg: 'bg-teal-500', badgeBg: 'bg-teal-50 border-teal-200 text-teal-700', textColor: 'text-teal-600' },
  { id: '권웅', name: '권웅', avatarBg: 'bg-orange-500', badgeBg: 'bg-orange-50 border-orange-200 text-orange-700', textColor: 'text-orange-600' },
  { id: '소연', name: '소연', avatarBg: 'bg-red-500', badgeBg: 'bg-red-50 border-red-200 text-red-700', textColor: 'text-red-600' },
  { id: '신혜', name: '신혜', avatarBg: 'bg-emerald-500', badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700', textColor: 'text-emerald-600' },
  { id: '승아', name: '승아', avatarBg: 'bg-sky-500', badgeBg: 'bg-sky-50 border-sky-200 text-sky-700', textColor: 'text-sky-600' },
];

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  category: string;
  assignee: MemberName | '미정' | string;
  status: TaskStatus;
  notes?: string;
  order: number;
  createdAt?: string;
}

export interface ScheduleItem {
  id: string;
  day: 'Day 1' | 'Day 2';
  time: string;
  title: string;
  description?: string;
  location?: string;
  category: '이동' | '식사' | '세션' | '팀빌딩' | '휴식' | '기타';
  order: number;
}

export interface IdeaItem {
  id: string;
  title: string;
  content: string;
  author: MemberName | string;
  category: '팀빌딩 활동' | '저녁 프로그램' | '준비물/참고' | '기타 아이디어';
  votes: string[]; // List of member names who voted
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'purple';
  createdAt: string;
}

export interface PlaceItem {
  id: string;
  name: string;
  category: '맛집' | '카페' | '가볼만한 곳' | '숙소';
  region?: '강릉' | '동해' | '삼척' | '기타' | string;
  recommendedBy: MemberName | string;
  address?: string;
  lat?: number;
  lng?: number;
  mapUrl?: string;
  notes?: string;
  votes: string[]; // member names
  rating?: number;
  createdAt: string;
}

export interface GroupItem {
  id: string;
  type: 'car' | 'activity';
  groupName: string;
  driver?: string; // For cars
  capacity?: number;
  members: string[]; // Member names
  notes?: string;
}

export type BudgetType = 'planned' | 'actual';

export interface BudgetItem {
  id: string;
  type?: BudgetType; // 'planned' = 예산안, 'actual' = 실제 지출 (기본값: 'planned')
  item: string; // 항목
  amount: number; // 금액
  payer: MemberName | string; // 지출자 / 담당자
  category: '숙소' | '식비' | '교통' | '레크레이션' | '간식' | '기타';
  date?: string;
  notes?: string;
  order?: number;
  createdAt?: string;
}

export type ActiveTab = 'checklist' | 'schedule' | 'ideas' | 'places' | 'teams' | 'budget';

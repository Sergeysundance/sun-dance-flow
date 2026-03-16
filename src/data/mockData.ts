// Mock data for Sun Dance School CRM

export interface Direction {
  id: string;
  name: string;
  description: string;
  color: string;
  order: number;
  active: boolean;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  area: number;
  color: string;
  active: boolean;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  bio: string;
  directionIds: string[];
  telegramId: string;
  active: boolean;
}

export interface SubscriptionType {
  id: string;
  name: string;
  description: string;
  classCount: number | null; // null = unlimited
  durationDays: number;
  classDuration: number; // minutes
  price: number;
  oldPrice: number | null;
  type: 'group' | 'individual_solo' | 'individual_duo' | 'trial' | 'single';
  active: boolean;
}

export type SubscriptionStatus = 'active' | 'expired' | 'frozen' | 'exhausted';

export interface Subscription {
  id: string;
  clientId: string;
  subscriptionTypeId: string;
  purchaseDate: string;
  expiresDate: string;
  usedClasses: number;
  status: SubscriptionStatus;
  paymentMethod: 'cash' | 'card' | 'transfer';
  notes: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  birthDate: string;
  source: 'site' | 'instagram' | 'vk' | 'telegram' | 'referral' | 'other';
  notes: string;
  createdAt: string;
}

export interface ScheduleClass {
  id: string;
  directionId: string;
  teacherId: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  maxSpots: number;
  enrolledClientIds: string[];
  cancelled: boolean;
}

export type TrialRequestStatus = 'new' | 'contacted' | 'enrolled' | 'declined';

export interface TrialRequest {
  id: string;
  name: string;
  phone: string;
  directionId: string;
  comment: string;
  status: TrialRequestStatus;
  createdAt: string;
}

export interface CheckInRecord {
  clientId: string;
  classId: string;
  status: 'attended' | 'noshow' | 'pending';
}

// ===================== DATA =====================

export const directions: Direction[] = [
  { id: 'd1', name: 'Бачата', description: 'Самый чувственный социальный танец', color: '#EF4444', order: 1, active: true },
  { id: 'd2', name: 'Йога', description: 'Баланс тела и разума', color: '#8B5CF6', order: 2, active: true },
  { id: 'd3', name: 'Восточные танцы', description: 'Пластика, грация и женская энергия', color: '#F59E0B', order: 3, active: true },
  { id: 'd4', name: 'Латина', description: 'Страсть латиноамериканских ритмов', color: '#EC4899', order: 4, active: true },
  { id: 'd5', name: 'Contemporary', description: 'Свобода самовыражения', color: '#06B6D4', order: 5, active: true },
  { id: 'd6', name: 'Стретчинг', description: 'Гибкость и расслабление', color: '#10B981', order: 6, active: true },
];

export const rooms: Room[] = [
  { id: 'r1', name: 'Зал 1 (основной)', capacity: 20, area: 60, color: '#3B82F6', active: true },
  { id: 'r2', name: 'Зал 2 (малый)', capacity: 10, area: 30, color: '#10B981', active: true },
];

export const teachers: Teacher[] = [
  { id: 't1', firstName: 'Алексей', lastName: 'Солнцев', phone: '+7 (921) 100-00-01', email: 'alexey@sundance.ru', bio: 'Основатель студии. Преподает бачату более 5 лет.', directionIds: ['d1', 'd4'], telegramId: '@alexey_sun', active: true },
  { id: 't2', firstName: 'Марина', lastName: 'Волкова', phone: '+7 (921) 100-00-02', email: 'marina@sundance.ru', bio: 'Сертифицированный инструктор йоги. Мягкий подход к каждому ученику.', directionIds: ['d2', 'd6'], telegramId: '@marina_v', active: true },
  { id: 't3', firstName: 'Диана', lastName: 'Огнева', phone: '+7 (921) 100-00-03', email: 'diana@sundance.ru', bio: 'Хореограф с международным опытом. Раскрывает пластику и женственность.', directionIds: ['d3', 'd5'], telegramId: '@diana_o', active: true },
];

export const subscriptionTypes: SubscriptionType[] = [
  { id: 'st1', name: 'Пробное групповое', description: 'Одно групповое занятие на любое направление', classCount: 1, durationDays: 30, classDuration: 60, price: 550, oldPrice: 1100, type: 'trial', active: true },
  { id: 'st2', name: 'Пробное индивидуальное (бачата)', description: 'Индивидуальное занятие по бачате', classCount: 1, durationDays: 30, classDuration: 60, price: 2400, oldPrice: 6000, type: 'trial', active: true },
  { id: 'st3', name: '4 занятия', description: '4 групповых занятия', classCount: 4, durationDays: 30, classDuration: 60, price: 3200, oldPrice: null, type: 'group', active: true },
  { id: 'st4', name: '8 занятий', description: '8 групповых занятий', classCount: 8, durationDays: 30, classDuration: 60, price: 5800, oldPrice: null, type: 'group', active: true },
  { id: 'st5', name: 'Безлимит', description: 'Безлимитное посещение всех направлений', classCount: null, durationDays: 45, classDuration: 60, price: 24464, oldPrice: null, type: 'group', active: true },
];

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const daysAgo = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };
const daysFromNow = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); };

export const clients: Client[] = [
  { id: 'c1', firstName: 'Анна', lastName: 'Петрова', phone: '+7 (921) 111-11-11', email: 'anna@mail.ru', birthDate: '1996-05-14', source: 'site', notes: '', createdAt: daysAgo(60) },
  { id: 'c2', firstName: 'Мария', lastName: 'Иванова', phone: '+7 (911) 222-22-22', email: 'maria@mail.ru', birthDate: '1994-11-22', source: 'instagram', notes: '', createdAt: daysAgo(45) },
  { id: 'c3', firstName: 'Дмитрий', lastName: 'Козлов', phone: '+7 (999) 333-33-33', email: 'dmitry@mail.ru', birthDate: '1990-03-08', source: 'vk', notes: 'Занимался сальсой раньше', createdAt: daysAgo(30) },
  { id: 'c4', firstName: 'Елена', lastName: 'Смирнова', phone: '+7 (921) 444-44-44', email: 'elena@mail.ru', birthDate: '1998-07-19', source: 'telegram', notes: '', createdAt: daysAgo(25) },
  { id: 'c5', firstName: 'Ольга', lastName: 'Кузнецова', phone: '+7 (911) 555-55-55', email: 'olga@mail.ru', birthDate: '1992-01-30', source: 'referral', notes: 'Подруга Анны', createdAt: daysAgo(10) },
  { id: 'c6', firstName: 'Игорь', lastName: 'Новиков', phone: '+7 (999) 666-66-66', email: 'igor@mail.ru', birthDate: '1988-09-05', source: 'site', notes: '', createdAt: daysAgo(5) },
  { id: 'c7', firstName: 'Наталья', lastName: 'Морозова', phone: '+7 (921) 777-77-77', email: 'natasha@mail.ru', birthDate: '1995-12-01', source: 'vk', notes: '', createdAt: daysAgo(40) },
  { id: 'c8', firstName: 'Светлана', lastName: 'Волкова', phone: '+7 (911) 888-88-88', email: 'sveta@mail.ru', birthDate: '1991-04-17', source: 'instagram', notes: '', createdAt: daysAgo(35) },
  { id: 'c9', firstName: 'Алексей', lastName: 'Попов', phone: '+7 (999) 999-99-99', email: 'alex@mail.ru', birthDate: '1993-06-25', source: 'other', notes: '', createdAt: daysAgo(3) },
  { id: 'c10', firstName: 'Виктория', lastName: 'Лебедева', phone: '+7 (921) 000-00-00', email: 'vika@mail.ru', birthDate: '1997-08-11', source: 'site', notes: '', createdAt: daysAgo(7) },
];

export const subscriptions: Subscription[] = [
  { id: 's1', clientId: 'c1', subscriptionTypeId: 'st4', purchaseDate: daysAgo(20), expiresDate: daysFromNow(10), usedClasses: 3, status: 'active', paymentMethod: 'card', notes: '' },
  { id: 's2', clientId: 'c2', subscriptionTypeId: 'st3', purchaseDate: daysAgo(28), expiresDate: daysFromNow(2), usedClasses: 4, status: 'exhausted', paymentMethod: 'cash', notes: '' },
  { id: 's3', clientId: 'c3', subscriptionTypeId: 'st5', purchaseDate: daysAgo(15), expiresDate: daysFromNow(30), usedClasses: 8, status: 'active', paymentMethod: 'transfer', notes: '' },
  { id: 's4', clientId: 'c4', subscriptionTypeId: 'st4', purchaseDate: daysAgo(25), expiresDate: daysFromNow(3), usedClasses: 6, status: 'active', paymentMethod: 'card', notes: '' },
  { id: 's5', clientId: 'c6', subscriptionTypeId: 'st1', purchaseDate: daysAgo(5), expiresDate: daysFromNow(25), usedClasses: 0, status: 'active', paymentMethod: 'card', notes: '' },
  { id: 's6', clientId: 'c7', subscriptionTypeId: 'st3', purchaseDate: daysAgo(20), expiresDate: daysFromNow(10), usedClasses: 2, status: 'frozen', paymentMethod: 'cash', notes: 'Заморозка по болезни' },
  { id: 's7', clientId: 'c8', subscriptionTypeId: 'st5', purchaseDate: daysAgo(10), expiresDate: daysFromNow(35), usedClasses: 5, status: 'active', paymentMethod: 'card', notes: '' },
  { id: 's8', clientId: 'c10', subscriptionTypeId: 'st1', purchaseDate: daysAgo(7), expiresDate: daysFromNow(23), usedClasses: 1, status: 'exhausted', paymentMethod: 'cash', notes: '' },
];

// Generate schedule for current week
function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

const monday = getMonday(new Date());
const weekDay = (offset: number) => {
  const d = new Date(monday);
  d.setDate(d.getDate() + offset);
  return fmt(d);
};

export const scheduleClasses: ScheduleClass[] = [
  { id: 'sc1', directionId: 'd1', teacherId: 't1', roomId: 'r1', date: weekDay(0), startTime: '18:00', endTime: '19:30', maxSpots: 20, enrolledClientIds: ['c1', 'c3', 'c4', 'c6', 'c8', 'c9', 'c10', 'c2'], cancelled: false },
  { id: 'sc2', directionId: 'd6', teacherId: 't2', roomId: 'r2', date: weekDay(0), startTime: '19:30', endTime: '20:30', maxSpots: 10, enrolledClientIds: ['c1', 'c4', 'c5', 'c7', 'c8', 'c10'], cancelled: false },
  { id: 'sc3', directionId: 'd2', teacherId: 't2', roomId: 'r1', date: weekDay(1), startTime: '18:00', endTime: '19:00', maxSpots: 20, enrolledClientIds: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c1', 'c2'], cancelled: false },
  { id: 'sc4', directionId: 'd3', teacherId: 't3', roomId: 'r1', date: weekDay(1), startTime: '19:30', endTime: '21:00', maxSpots: 20, enrolledClientIds: ['c1', 'c2', 'c4', 'c5', 'c7', 'c8', 'c10', 'c9', 'c3'], cancelled: false },
  { id: 'sc5', directionId: 'd1', teacherId: 't1', roomId: 'r1', date: weekDay(2), startTime: '18:00', endTime: '19:30', maxSpots: 20, enrolledClientIds: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c1'], cancelled: false },
  { id: 'sc6', directionId: 'd5', teacherId: 't3', roomId: 'r2', date: weekDay(2), startTime: '19:30', endTime: '20:30', maxSpots: 10, enrolledClientIds: ['c1', 'c3', 'c5', 'c8', 'c10'], cancelled: false },
  { id: 'sc7', directionId: 'd4', teacherId: 't1', roomId: 'r1', date: weekDay(3), startTime: '18:00', endTime: '19:00', maxSpots: 20, enrolledClientIds: ['c1', 'c2', 'c3', 'c4', 'c6', 'c8', 'c9'], cancelled: false },
  { id: 'sc8', directionId: 'd2', teacherId: 't2', roomId: 'r2', date: weekDay(3), startTime: '19:30', endTime: '20:30', maxSpots: 10, enrolledClientIds: ['c1', 'c2', 'c3', 'c4', 'c5', 'c7', 'c8', 'c10'], cancelled: false },
  { id: 'sc9', directionId: 'd1', teacherId: 't1', roomId: 'r1', date: weekDay(4), startTime: '18:00', endTime: '19:30', maxSpots: 20, enrolledClientIds: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c1', 'c2', 'c3', 'c4'], cancelled: false },
  { id: 'sc10', directionId: 'd6', teacherId: 't2', roomId: 'r1', date: weekDay(5), startTime: '12:00', endTime: '13:00', maxSpots: 20, enrolledClientIds: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10'], cancelled: false },
  { id: 'sc11', directionId: 'd3', teacherId: 't3', roomId: 'r1', date: weekDay(5), startTime: '13:30', endTime: '15:00', maxSpots: 20, enrolledClientIds: ['c1', 'c3', 'c5', 'c7', 'c9', 'c10'], cancelled: false },
  { id: 'sc12', directionId: 'd1', teacherId: 't1', roomId: 'r1', date: weekDay(6), startTime: '11:00', endTime: '12:30', maxSpots: 20, enrolledClientIds: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c8', 'c9', 'c10'], cancelled: false },
];

export const trialRequests: TrialRequest[] = [
  { id: 'tr1', name: 'Ирина Белова', phone: '+7 (921) 123-45-67', directionId: 'd1', comment: 'Хочу попробовать с подругой', status: 'new', createdAt: fmt(today) },
  { id: 'tr2', name: 'Максим Соколов', phone: '+7 (911) 234-56-78', directionId: 'd2', comment: '', status: 'new', createdAt: daysAgo(1) },
  { id: 'tr3', name: 'Юлия Орлова', phone: '+7 (999) 345-67-89', directionId: 'd3', comment: 'Занималась раньше, хочу вернуться', status: 'contacted', createdAt: daysAgo(3) },
  { id: 'tr4', name: 'Екатерина Морозова', phone: '+7 (921) 456-78-90', directionId: 'd1', comment: '', status: 'enrolled', createdAt: daysAgo(5) },
  { id: 'tr5', name: 'Андрей Волков', phone: '+7 (911) 567-89-01', directionId: 'd4', comment: '', status: 'declined', createdAt: daysAgo(7) },
];

export const checkInRecords: CheckInRecord[] = [];

// Helper functions
export function getDirection(id: string) { return directions.find(d => d.id === id); }
export function getRoom(id: string) { return rooms.find(r => r.id === id); }
export function getTeacher(id: string) { return teachers.find(t => t.id === id); }
export function getClient(id: string) { return clients.find(c => c.id === id); }
export function getSubscriptionType(id: string) { return subscriptionTypes.find(s => s.id === id); }
export function getClientSubscriptions(clientId: string) { return subscriptions.filter(s => s.clientId === clientId); }
export function getClientActiveSubscription(clientId: string) { return subscriptions.find(s => s.clientId === clientId && s.status === 'active'); }

export function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU') + ' ₽';
}

export function getSubscriptionTypeLabel(type: SubscriptionType['type']): string {
  const map: Record<string, string> = { group: 'Групповой', individual_solo: 'Индивидуальный', individual_duo: 'Инд. дуэт', trial: 'Пробный', single: 'Разовый' };
  return map[type] || type;
}

export function getSubscriptionStatusLabel(status: SubscriptionStatus): string {
  const map: Record<string, string> = { active: 'Активен', expired: 'Истёк', frozen: 'Заморожен', exhausted: 'Исчерпан' };
  return map[status] || status;
}

export function getTrialStatusLabel(status: TrialRequestStatus): string {
  const map: Record<string, string> = { new: 'Новая', contacted: 'Связались', enrolled: 'Записан', declined: 'Отклонена' };
  return map[status] || status;
}

export function getSourceLabel(source: Client['source']): string {
  const map: Record<string, string> = { site: 'Сайт', instagram: 'Instagram', vk: 'VK', telegram: 'Telegram', referral: 'Рекомендация', other: 'Другое' };
  return map[source] || source;
}

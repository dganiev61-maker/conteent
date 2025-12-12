export enum Platform {
  Instagram = 'Instagram',
  Telegram = 'Telegram',
  YouTube = 'YouTube',
  VK = 'VK',
  TikTok = 'TikTok',
}

export enum Status {
  Idea = 'Идея',
  InProgress = 'В работе',
  Ready = 'Готово',
  Published = 'Опубликовано',
}

export type Language = 'ru' | 'en' | 'uz';

export interface ContentItem {
  id: string;
  date: string; // ISO string format 'YYYY-MM-DD'
  platform: Platform;
  topic: string;
  status: Status;
  link?: string;
  rubricId?: string; // Optional link to a rubric
  postingTimeId?: string; // Optional link to a posting time
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    createdAt: {
        seconds: number;
        nanoseconds: number;
    };
}

export interface Rubric {
    id: string;
    name: string;
    color: string;
}

export interface PostingTime {
    id: string;
    time: string; // HH:MM format
    label?: string; // e.g. "Morning", "Prime Time"
}

export interface StatsRecord {
    id: string;
    date: string; // YYYY-MM-DD
    subscribers: number;
    reach: number;
}
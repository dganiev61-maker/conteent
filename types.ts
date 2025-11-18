
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

export interface ContentItem {
  id: string;
  date: string; // ISO string format 'YYYY-MM-DD'
  platform: Platform;
  topic: string;
  status: Status;
  link?: string;
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

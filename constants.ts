import { Status } from './types';

export const STATUS_COLORS: { [key in Status]: string } = {
  [Status.Idea]: 'bg-blue-900/50 text-blue-300 border-blue-700',
  [Status.InProgress]: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  [Status.Ready]: 'bg-green-900/50 text-green-300 border-green-700',
  [Status.Published]: 'bg-gray-700/60 text-gray-400 border-gray-600',
};

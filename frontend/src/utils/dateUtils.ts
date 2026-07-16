export function timeAgo(timestamp: any): string {
  if (!timestamp) return 'Just now';
  
  // Handle Firestore Timestamp or standard Date
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' mins ago';
  return 'Just now';
}

// Timezone-safe date utilities
const getStartOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const startOfToday = (): Date => getStartOfDay(new Date());

export const startOfYesterday = (): Date => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getStartOfDay(yesterday);
};

export const startOfThisWeek = (): Date => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day;
  const result = new Date(d.setDate(diff));
  return getStartOfDay(result);
};

export const categorizeMessageDate = (timestamp: any): string => {
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const today = startOfToday();
  const yesterday = startOfYesterday();
  const thisWeek = startOfThisWeek();
  const messageStart = getStartOfDay(date);

  if (messageStart.getTime() === today.getTime()) {
    return 'Today';
  }
  if (messageStart.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }
  if (messageStart >= thisWeek) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatMessageTime = (timestamp: any): string => {
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

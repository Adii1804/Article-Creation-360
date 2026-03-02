export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type NotificationItem = {
  id: string;
  title: string;
  description?: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
};

const getCurrentUserId = (): number | null => {
  const user = localStorage.getItem('user');
  if (!user) return null;
  try {
    const parsed = JSON.parse(user);
    return typeof parsed.id === 'number' ? parsed.id : null;
  } catch {
    return null;
  }
};

const getStorageKey = (userId: number) => `notifications:${userId}`;

export const getNotifications = (userId: number): NotificationItem[] => {
  const raw = localStorage.getItem(getStorageKey(userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveNotifications = (userId: number, items: NotificationItem[]) => {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('notifications:updated'));
};

export const addNotification = (payload: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const items = getNotifications(userId);
  const next: NotificationItem = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    read: false,
    ...payload,
  };

  saveNotifications(userId, [next, ...items].slice(0, 50));
};

export const markAllRead = () => {
  const userId = getCurrentUserId();
  if (!userId) return;
  const items = getNotifications(userId).map((n) => ({ ...n, read: true }));
  saveNotifications(userId, items);
};

export const markRead = (id: string) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  const items = getNotifications(userId).map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(userId, items);
};

export const clearNotifications = () => {
  const userId = getCurrentUserId();
  if (!userId) return;
  saveNotifications(userId, []);
};

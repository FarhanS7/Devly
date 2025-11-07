export const ROUTES = {
  AUTH: {
    BASE: '/auth',
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
  },

  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    UPDATE: '/users/update',
  },

  POSTS: {
    BASE: '/posts',
    CREATE: '/posts/create',
    FEED: '/posts/feed',
    LIKE: '/posts/like',
    COMMENT: '/posts/comment',
  },

  NOTIFICATIONS: {
    BASE: '/notifications',
    GET_ALL: '/notifications',
    MARK_READ: '/notifications/mark-read',
  },

  CHAT: {
    BASE: '/chat',
    START: '/chat/start',
    SEND: '/chat/send',
    HISTORY: '/chat/history',
  },

  ADMIN: {
    BASE: '/admin',
    USERS: '/admin/users',
    STATS: '/admin/stats',
  },
};

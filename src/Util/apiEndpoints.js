const apiOrigin = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const baseURL = `${apiOrigin.replace(/\/$/, "")}/api/`;

export const apiEndpoints = {
    LOGIN: "auth/login",
    ADMIN_ME: "admin/me",
    ADMIN_OVERVIEW: "admin/overview",
    ADMIN_READERS: "admin/readers",
    ADMIN_BOOKS: "admin/books",
    ADMIN_INVITES: "admin/invites",
    ADMIN_INVITE: "admin/invite",
    ADMIN_ACCEPT_INVITE: "admin/invite/accept",
    REGISTER: "auth/register",
    REFRESH_TOKEN: "auth/refresh",
    LOGOUT: "auth/logout",
    GOOGLE_AUTH: "auth/google",
    FORGOT_PASSWORD: "auth/forget-password",
    PASSWORD_TOKEN_VERIFICATION: "auth/password-token-verification",
    RESET_PASSWORD: "auth/reset-password",
    USER_PROFILE: "/profile/",
    DELETE_PROFILE: "/profile/delete",
    UPDATE_PROFILE: "/profile/update",
    CLOUDINARY_SIGNATURE: "/cloudinary-signature/image",
    NOTES: "notes",
    NOTES_BY_ID: "notes/:id",
    USER_STATS: "stats",
    BOOK_STATS: "book/stats",
    BOOK_START_READING: "book/start",
    BOOK_END_READING: "book/end",
    BOOK_GOAL: "book/goal",
    BOOKS: "book",
    BOOK_BY_ID: "book",

    // Reading groups. Any reader can create one; joining is done by presenting
    // a code, which is what makes being visible to a group a choice.
    GROUPS: "groups",
    GROUPS_JOIN: "groups/join",

    // Sharing a book to Explore, and taking a copy of somebody else's.
    // The book id goes in the path, so these are built rather than constant.
    DISCOVER_TRENDING: "discover/trending",
    DISCOVER_RECOMMENDED: "discover/recommended",
    discoverAdd: (bookId) => `discover/${bookId}/add`,
    discoverVisibility: (bookId) => `discover/${bookId}/visibility`,

    // Groups. The id and the sub-resource go in the path.
    groupById: (groupId) => `groups/${groupId}`,
    groupLeave: (groupId) => `groups/${groupId}/members/me`,
    groupVisibility: (groupId) => `groups/${groupId}/visibility`,
    groupBooks: (groupId) => `groups/${groupId}/books`,
    groupBook: (groupId, bookId) => `groups/${groupId}/books/${bookId}`,
    groupSchedule: (groupId) => `groups/${groupId}/schedule`,
    groupProgress: (groupId) => `groups/${groupId}/progress`,
    groupMessages: (groupId) => `groups/${groupId}/messages`,
    groupMessage: (groupId, messageId) => `groups/${groupId}/messages/${messageId}`,

    BOOK_CONTENT: "book/:bookId/content",
};

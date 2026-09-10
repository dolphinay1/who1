const ROLE_KEYS = {
    ADMIN: 'ADMIN',
    FINANCE: 'FINANCE',
    SUPPORT: 'SUPPORT'
};

const ROLE_LABELS = {
    [ROLE_KEYS.ADMIN]: 'Admin',
    [ROLE_KEYS.FINANCE]: 'Finans',
    [ROLE_KEYS.SUPPORT]: 'Canlı Destek'
};

const PERMISSIONS = {
    DASHBOARD_VIEW: 'dashboard:view',
    DASHBOARD_FINANCIAL: 'dashboard:financial',
    CRM_READ: 'crm:read',
    NOTES_WRITE: 'notes:write',
    TRANSACTIONS_READ: 'transactions:read',
    TRANSACTIONS_MANAGE: 'transactions:manage',
    TICKETS_READ: 'tickets:read',
    SEARCH_GLOBAL: 'search:global',
    ADMINS_MANAGE: 'admins:manage'
};

const ROLE_PERMISSIONS = {
    [ROLE_KEYS.ADMIN]: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.DASHBOARD_FINANCIAL,
        PERMISSIONS.CRM_READ,
        PERMISSIONS.NOTES_WRITE,
        PERMISSIONS.TRANSACTIONS_READ,
        PERMISSIONS.TRANSACTIONS_MANAGE,
        PERMISSIONS.TICKETS_READ,
        PERMISSIONS.SEARCH_GLOBAL,
        PERMISSIONS.ADMINS_MANAGE
    ],
    [ROLE_KEYS.FINANCE]: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.DASHBOARD_FINANCIAL,
        PERMISSIONS.CRM_READ,
        PERMISSIONS.TRANSACTIONS_READ,
        PERMISSIONS.TRANSACTIONS_MANAGE,
        PERMISSIONS.TICKETS_READ,
        PERMISSIONS.SEARCH_GLOBAL
    ],
    [ROLE_KEYS.SUPPORT]: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.CRM_READ,
        PERMISSIONS.NOTES_WRITE,
        PERMISSIONS.TICKETS_READ,
        PERMISSIONS.SEARCH_GLOBAL
    ]
};

const normalizePermissions = (permissions = []) => {
    if (!Array.isArray(permissions)) return [];
    return [...new Set(permissions.filter(Boolean))];
};

const hasPermission = (actor, permission) => {
    const permissions = normalizePermissions(actor?.permissions);
    return permissions.includes(permission);
};

module.exports = {
    ROLE_KEYS,
    ROLE_LABELS,
    ROLE_PERMISSIONS,
    PERMISSIONS,
    normalizePermissions,
    hasPermission
};

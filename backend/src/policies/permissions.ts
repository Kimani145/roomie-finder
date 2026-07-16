export type Permission = 
  | 'CREATE_ADMIN'
  | 'DISABLE_ADMIN'
  | 'PROMOTE_ADMIN'
  | 'VIEW_AUDIT_LOGS'
  | 'REVIEW_REPORTS'
  | 'SUSPEND_USERS'
  | 'RESTORE_USERS'
  | 'MANAGE_SETTINGS'
  | 'SEND_COMMUNICATIONS'

export const RolePermissions: Record<string, Permission[]> = {
  'SUPER_ADMIN': [
    'CREATE_ADMIN',
    'DISABLE_ADMIN',
    'PROMOTE_ADMIN',
    'VIEW_AUDIT_LOGS',
    'REVIEW_REPORTS',
    'SUSPEND_USERS',
    'RESTORE_USERS',
    'MANAGE_SETTINGS',
    'SEND_COMMUNICATIONS',
  ],
  'ADMIN': [
    'REVIEW_REPORTS',
    'SUSPEND_USERS',
    'RESTORE_USERS',
    'SEND_COMMUNICATIONS',
  ],
  // Default STUDENT has no admin permissions
  'STUDENT': [],
}

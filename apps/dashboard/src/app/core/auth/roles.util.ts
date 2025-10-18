export function hasAnyRole(userRoles: string[] | undefined, roles: string[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  if (userRoles.includes('Owner')) return true;
  return roles.some(r => userRoles.includes(r));
}

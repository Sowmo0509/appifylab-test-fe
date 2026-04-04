export type NameAvatarUser = {
  id: string;
  firstName: string;
  lastName: string;
};

export function userInitials(user: Pick<NameAvatarUser, 'firstName' | 'lastName'>): string {
  const a = (user.firstName?.[0] ?? '').toUpperCase();
  const b = (user.lastName?.[0] ?? '').toUpperCase();
  return (a + b) || '?';
}

export function avatarBgForUserId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h} 42% 46%)`;
}

'use client';

import { avatarBgForUserId, userInitials, type NameAvatarUser } from '@/lib/name-avatar';
import { cn } from '@/lib/utils';

export interface NameAvatarProps {
  user: NameAvatarUser;
  size?: number;
  className?: string;
  title?: string;
}

export function NameAvatar({ user, size = 40, className, title }: NameAvatarProps) {
  const label = title ?? `${user.firstName} ${user.lastName}`.trim();
  return (
    <div
      className={cn(className)}
      title={label || undefined}
      aria-hidden={!label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        minWidth: size,
        borderRadius: '50%',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontSize: Math.max(10, Math.round(size * 0.36)),
        fontWeight: 600,
        color: '#fff',
        flexShrink: 0,
        background: avatarBgForUserId(user.id),
      }}
    >
      {userInitials(user)}
    </div>
  );
}

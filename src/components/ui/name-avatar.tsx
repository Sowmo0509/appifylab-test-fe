'use client';

import { avatarBgForUserId, userInitials, type NameAvatarUser } from '@/lib/name-avatar';
import { cn } from '@/lib/utils';

export interface NameAvatarProps {
  user: NameAvatarUser;
  size?: number;
  /** `md` = rounded rectangle (e.g. story cards); default `full` = circle */
  rounded?: 'full' | 'md';
  /** Stretch to fill a sized parent (e.g. square story card with `aspect-ratio`) */
  fill?: boolean;
  className?: string;
  title?: string;
}

export function NameAvatar({ user, size = 40, rounded = 'full', fill = false, className, title }: NameAvatarProps) {
  const label = title ?? `${user.firstName} ${user.lastName}`.trim();
  const borderRadius = rounded === 'md' ? 6 : '50%';
  const fontSize = Math.max(10, Math.round(size * 0.36));
  return (
    <div
      className={cn(className)}
      title={label || undefined}
      aria-hidden={!label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(fill
          ? {
              position: 'absolute',
              inset: 0,
              width: 'auto',
              height: 'auto',
              minWidth: 0,
              minHeight: 0,
            }
          : {
              width: size,
              height: size,
              minWidth: size,
            }),
        borderRadius,
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontSize,
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

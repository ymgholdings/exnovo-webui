import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'default' | 'solid' | 'ghost'; }

export function Button({ variant = 'default', className, type = 'button', ...rest }: ButtonProps) {
  const cls = ['ex-btn', variant !== 'default' && `ex-btn--${variant}`, className].filter(Boolean).join(' ');
  return <button type={type} className={cls} {...rest} />;
}

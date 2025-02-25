import cn from 'classnames';
import Link from 'next/link';
import { FC, forwardRef, JSXElementConstructor, ReactNode } from 'react';

import LoadingDots from './LoadingDots';

export type ButtonVariant =
  | 'cta'
  | 'glow'
  | 'danger'
  | 'ghost'
  | 'plain'
  | 'bordered'
  | 'fuchsia'
  | 'borderedWhite'
  | 'borderedFuchsia';

export const ButtonOrLinkWrapper = forwardRef(
  (
    { href, className, children, Component = 'button', ...props }: ButtonProps,
    forwardedRef,
  ) => {
    const Comp: any = href ? 'a' : Component;

    return (
      <Comp
        ref={forwardedRef}
        className={className}
        {...props}
        {...(href ? { href } : {})}
      >
        {children}
      </Comp>
    );
  },
);

ButtonOrLinkWrapper.displayName = 'ButtonOrLinkWrapper';

export type ButtonProps = {
  buttonSize?: 'xs' | 'sm' | 'base' | 'md' | 'lg';
  variant?: ButtonVariant;
  light?: boolean;
  href?: string;
  children?: ReactNode;
  target?: string;
  rel?: string;
  className?: string;
  asLink?: boolean;
  disabled?: boolean;
  loading?: boolean;
  loadingMessage?: string;
  noStyle?: boolean;
  Icon?: JSXElementConstructor<any> | string;
  Component?: JSXElementConstructor<any> | string;
} & React.HTMLProps<HTMLButtonElement>;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      buttonSize,
      variant,
      light,
      href,
      children,
      Icon,
      className,
      asLink,
      disabled,
      loading,
      loadingMessage,
      noStyle,
      Component = 'button',
      ...props
    },
    ref,
  ) => {
    const Comp: any = asLink ? Link : href ? 'a' : Component;

    const size = buttonSize ?? 'base';
    return (
      <Comp
        {...(!asLink ? { ref } : {})}
        {...(!asLink ? { disabled } : {})}
        {...props}
        disabled={disabled || loading}
        className={
          !noStyle &&
          cn(
            className,
            'button-ring relative flex select-none flex-row items-center justify-center whitespace-nowrap rounded-md border disabled:cursor-not-allowed',
            {
              'border-transparent bg-white text-neutral-900 hover:bg-neutral-300 disabled:bg-neutral-900 disabled:text-neutral-500 hover:disabled:bg-neutral-900':
                variant === 'cta',
              'button-glow-color border-transparent bg-fuchsia-600 text-white hover:bg-fuchsia-700':
                variant === 'glow',
              'border-transparent bg-fuchsia-600 text-white hover:bg-fuchsia-700 disabled:bg-neutral-900 disabled:text-neutral-500 hover:disabled:bg-neutral-900':
                variant === 'fuchsia',
              'border-transparent bg-rose-800 text-white hover:bg-rose-900':
                variant === 'danger',
              'border-neutral-800 bg-neutral-900 text-neutral-100 hover:bg-neutral-1000 disabled:border-transparent disabled:text-neutral-500 hover:disabled:bg-opacity-100':
                variant === 'plain',
              'border-neutral-800 text-neutral-100 hover:bg-neutral-1000 disabled:border-transparent disabled:text-neutral-500 hover:disabled:bg-opacity-100':
                variant === 'bordered',
              'button-ring-light border-neutral-900/10 text-neutral-900 hover:bg-neutral-100 disabled:opacity-50':
                variant === 'borderedWhite',
              'border-transparent text-neutral-100 hover:bg-neutral-1000 disabled:text-neutral-500 hover:disabled:bg-opacity-100':
                variant === 'ghost',
              'border-fuchsia-400/20 text-fuchsia-400 hover:bg-fuchsia-900/20 hover:text-fuchsia-100 disabled:border-transparent disabled:text-fuchsia-500 hover:disabled:bg-opacity-100':
                variant === 'borderedFuchsia',
              'px-4 py-2 text-sm': size === 'base',
              'px-2 py-1.5 text-xs': size === 'xs',
              'px-4 py-1.5 text-sm': size === 'sm',
              'px-4 py-2.5 text-sm sm:px-5 sm:py-3 sm:text-base': size === 'lg',
              'font-semibold': !light,
            },
          )
        }
        {...(href ? { href } : {})}
      >
        {Icon && <Icon className="-ml-0.5 mr-2 h-4 w-4" />}
        <span
          className={cn('absolute inset-0 flex items-center justify-center', {
            'pointer-events-none opacity-0': !loading,
            'animate-pulse opacity-100': loading && loadingMessage,
          })}
        >
          {loadingMessage}
        </span>
        {loading && !loadingMessage && (
          <i className="absolute left-0 right-0 top-0 bottom-0 flex justify-center">
            <LoadingDots
              className={cn({
                'bg-neutral-500': variant === 'cta',
                'bg-white/70': variant !== 'cta',
              })}
            />
          </i>
        )}
        <div
          className={cn('truncate', {
            'opacity-0': loading,
            'opacity-100': !loading,
          })}
        >
          {children}
        </div>
      </Comp>
    );
  },
);

Button.displayName = 'Button';

export default Button;

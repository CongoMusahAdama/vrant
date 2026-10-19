import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  /** Show "Dark mode" / "Light mode" next to the icon */
  withLabel?: boolean;
}

/** Light ↔ dark switch. Defaults to the visitor's system setting until they choose. */
const ThemeToggle = ({ className, withLabel = false }: ThemeToggleProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // The theme is only known on the client; avoid rendering the wrong icon first
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';
  const label = isDark ? 'Light mode' : 'Dark mode';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={`Switch to ${label.toLowerCase()}`}
      title={label}
      className={cn('inline-flex items-center gap-2', className)}
    >
      {isDark ? <Sun className="w-4 h-4" strokeWidth={2} /> : <Moon className="w-4 h-4" strokeWidth={2} />}
      {withLabel && <span>{label}</span>}
    </button>
  );
};

export default ThemeToggle;

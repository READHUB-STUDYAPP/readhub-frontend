import { FiMonitor, FiMoon, FiSun } from 'react-icons/fi';

import { useTheme } from '../Context/ThemeContext';

/**
 * Appearance, as three choices rather than a switch.
 *
 * A switch can only say light or dark, and picking either one pins the app to
 * it -- leaving no way back to following the machine. Three buttons say what
 * the current state actually is, including "follow the system", which is what
 * most readers want most of the time.
 */
const OPTIONS = [
  { value: 'system', label: 'System', Icon: FiMonitor },
  { value: 'light', label: 'Light', Icon: FiSun },
  { value: 'dark', label: 'Dark', Icon: FiMoon },
];

export default function ThemeToggle({ className = '' }) {
  const { mode, setMode } = useTheme();

  return (
    <div
      className={`flex gap-1 rounded-md bg-surface-variant p-1 ${className}`}
      role="radiogroup"
      aria-label="Appearance"
    >
      {OPTIONS.map((option) => {
        const { value, label, Icon } = option;
        const selected = mode === value;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setMode(value)}
            title={label}
            className={[
              'flex flex-1 items-center justify-center gap-1 rounded-sm px-2 py-1.5',
              'text-label_Medium transition-colors',
              selected
                ? 'bg-surface text-ink shadow-card font-semibold'
                : 'text-ink-faint hover:text-ink',
            ].join(' ')}
          >
            <Icon size={14} aria-hidden="true" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

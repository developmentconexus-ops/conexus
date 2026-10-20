import { Radio } from '@base-ui/react/radio'
import { RadioGroup } from '@base-ui/react/radio-group'
import type { ThemeChoice as Choice } from '../platform/theme.ts'
import { useTheme } from '../platform/theme.ts'

/** The three choices, in the account menu's and Aparência's order (design V9). */
export const THEMES: readonly { value: Choice; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Como o sistema' },
]

export function isThemeChoice(value: unknown): value is Choice {
  return THEMES.some((theme) => theme.value === value)
}

/** The theme as a radio group, after shadcn's base-nova `radio-group`, for Aparência. */
export function ThemeChoice() {
  const { choice, choose } = useTheme()
  return (
    <RadioGroup
      aria-label="Tema"
      value={choice}
      onValueChange={(value: unknown) => {
        if (isThemeChoice(value)) choose(value)
      }}
      className="flex flex-col gap-sm"
    >
      {THEMES.map((theme) => (
        // biome-ignore lint/a11y/noLabelWithoutControl: Base UI's Radio renders the button the label wraps
        <label key={theme.value} className="flex items-center gap-sm text-body">
          <Radio.Root
            value={theme.value}
            className="flex size-4 items-center justify-center rounded-pill border border-line-strong bg-surface data-checked:border-ink"
          >
            <Radio.Indicator className="size-2 rounded-pill bg-ink" />
          </Radio.Root>
          {theme.label}
        </label>
      ))}
    </RadioGroup>
  )
}

import { Radio } from '@base-ui/react/radio'
import { RadioGroup } from '@base-ui/react/radio-group'
import { ThemeChoice as Choice, THEME_LABELS, useTheme } from '../platform/theme.ts'

/** The theme as a radio group, after shadcn's base-nova `radio-group`, for Aparência. */
export function ThemeChoice() {
  const { choice, choose } = useTheme()
  return (
    <RadioGroup
      aria-label="Tema"
      value={choice}
      onValueChange={(value: unknown) => choose(Choice.parse(value))}
      className="flex flex-col gap-sm"
    >
      {Choice.options.map((value) => (
        // biome-ignore lint/a11y/noLabelWithoutControl: Base UI's Radio renders the button the label wraps
        <label key={value} className="flex items-center gap-sm text-body">
          <Radio.Root
            value={value}
            className="flex size-4 items-center justify-center rounded-pill border border-line-strong bg-surface data-checked:border-ink"
          >
            <Radio.Indicator className="size-2 rounded-pill bg-ink" />
          </Radio.Root>
          {THEME_LABELS[value]}
        </label>
      ))}
    </RadioGroup>
  )
}

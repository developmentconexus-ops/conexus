import { Questionnaire as QuestionnairePrimitive } from '@shadcn/react/questionnaire'
import type { ComponentProps } from 'react'
import { buttonVariants } from './button.tsx'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `questionnaire` over `@shadcn/react` 0.3.1, painted with brand
// tokens. A choice keeps its native radio or checkbox in sight, so the page's one focus outline
// shows on it (design V28); Progress, Skip, the shortcuts and the choice descriptions are left out.

export function Questionnaire({
  className,
  ...props
}: ComponentProps<typeof QuestionnairePrimitive.Root>) {
  return (
    <QuestionnairePrimitive.Root
      data-slot="questionnaire"
      className={cn('flex w-full min-w-0 flex-col gap-md', className)}
      {...props}
    />
  )
}

export function QuestionnaireItem({
  className,
  ...props
}: ComponentProps<typeof QuestionnairePrimitive.Item>) {
  return (
    <QuestionnairePrimitive.Item
      data-slot="questionnaire-item"
      className={cn('flex min-w-0 flex-col gap-sm border-0 p-0', className)}
      {...props}
    />
  )
}

export function QuestionnaireTitle({
  className,
  ...props
}: ComponentProps<typeof QuestionnairePrimitive.Title>) {
  return (
    <QuestionnairePrimitive.Title
      data-slot="questionnaire-title"
      className={cn('mb-sm font-semibold text-pretty text-text', className)}
      {...props}
    />
  )
}

export function QuestionnaireChoices({
  className,
  ...props
}: ComponentProps<typeof QuestionnairePrimitive.Choices>) {
  return (
    <QuestionnairePrimitive.Choices
      data-slot="questionnaire-choices"
      className={cn('grid min-w-0 gap-sm', className)}
      {...props}
    />
  )
}

export function QuestionnaireChoice({
  children,
  className,
  ...props
}: ComponentProps<typeof QuestionnairePrimitive.Choice>) {
  return (
    <QuestionnairePrimitive.Choice
      data-slot="questionnaire-choice"
      className={cn(
        'flex min-h-11 cursor-pointer items-start gap-sm rounded-control border border-line bg-surface px-md py-sm text-text hover:bg-surface-3 data-checked:border-line-strong data-checked:bg-surface-3 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-invalid:border-danger',
        className,
      )}
      {...props}
    >
      <QuestionnairePrimitive.ChoiceInput
        data-slot="questionnaire-choice-input"
        className="mt-1 size-4 shrink-0 accent-ink"
      />
      <QuestionnairePrimitive.ChoiceLabel
        data-slot="questionnaire-choice-label"
        className="flex min-w-0 flex-1 flex-col gap-xs wrap-break-word"
      >
        {children}
      </QuestionnairePrimitive.ChoiceLabel>
    </QuestionnairePrimitive.Choice>
  )
}

export function QuestionnaireInput({
  className,
  ...props
}: ComponentProps<typeof QuestionnairePrimitive.Input>) {
  return (
    <QuestionnairePrimitive.Input
      data-slot="questionnaire-input"
      className={cn(
        'h-9 w-full min-w-0 rounded-control border border-line bg-surface px-md text-base text-text placeholder:text-text-2 focus-visible:outline-transparent focus-visible:focus-field md:text-body aria-invalid:border-danger',
        className,
      )}
      {...props}
    />
  )
}

export function QuestionnaireError({
  className,
  ...props
}: ComponentProps<typeof QuestionnairePrimitive.Error>) {
  return (
    <QuestionnairePrimitive.Error
      data-slot="questionnaire-error"
      className={cn('text-danger text-fact', className)}
      {...props}
    />
  )
}

/** The actions under the item: back on the left, then forward or send on the right. */
export function QuestionnaireActions({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="questionnaire-actions"
      className={cn('flex flex-wrap items-center justify-end gap-sm', className)}
      {...props}
    />
  )
}

const ACTION = 'data-hidden:hidden'

export function QuestionnairePrevious({
  className,
  ...props
}: ComponentProps<typeof QuestionnairePrimitive.Previous>) {
  return (
    <QuestionnairePrimitive.Previous
      data-slot="questionnaire-previous"
      className={cn(buttonVariants({ variant: 'ghost' }), ACTION, 'me-auto', className)}
      {...props}
    />
  )
}

export function QuestionnaireNext({
  className,
  ...props
}: ComponentProps<typeof QuestionnairePrimitive.Next>) {
  return (
    <QuestionnairePrimitive.Next
      data-slot="questionnaire-next"
      className={cn(buttonVariants({ variant: 'primary' }), ACTION, className)}
      {...props}
    />
  )
}

export function QuestionnaireSubmit({
  className,
  ...props
}: ComponentProps<typeof QuestionnairePrimitive.Submit>) {
  return (
    <QuestionnairePrimitive.Submit
      data-slot="questionnaire-submit"
      className={cn(buttonVariants({ variant: 'primary' }), ACTION, className)}
      {...props}
    />
  )
}

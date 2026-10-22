---
name: conexus-build
description: Builds an approved plan, or a small change with nothing left to decide, in small steps proved by the check and by reading the code against the plan. Covers what to do when a step fails or the work leaves the plan, keeping the code clean, and finishing. Use before changing an app's code.
---

# Building

Build in small steps and prove each one before the next. A step is done when you proved it; code that you only wrote is not proof.

## Start
- First, decide whether this needs a plan. Do not judge it by whether the request feels clear: list what the change needs (each screen, what each record holds, its kinds and statuses, who sees what, each rule). If the app is new, or any of these is named by neither the request nor the app, and the person has not approved a plan for this request in this conversation, load `conexus-plan-new` for a new app or `conexus-plan-change` for a change to an existing app, including an unfinished or broken one and a new feature inside it, and build nothing yet.
- With an approved plan: read `.conexus/plan.md` and turn "Ordem" into your task list, one task per step. If the list already has proven steps from an earlier run, continue from the first open one; never redo a proven step.
- Without a plan, for a small change with nothing left to decide: before you edit, decide how you will prove the change works, then make it.

## Prove each step

`conexus_check` runs the steps Conexus runs when you finish: the packages, the manifest from `shared/operations.ts`, the types, the build, the Worker, and the page opened in a browser under the app's security policy. It does not call operations, touch data or show you the screen. Run it at the end of each step, then prove the step with what can show it:
- An operation: nothing here calls it. Read its handler against its input, its output, its table and the failures it can meet, and say it was not run.
- A screen: you cannot see it. Trace each value it shows to the operation that returns it, check its four data states (`conexus-app`), and tell the person which screen to try and what they should see there.
- A new table or migration: Conexus applies migrations when the version is sent, not in this run. Read the migration against how the table is used, and say it is proven only once the person tries the app.

## When a step fails

- Read the whole error before you change anything. Find the cause and fix it where it starts, in the app's code. A guard, a cast or a suppression that makes an error go away only hides it.
- Test one idea at a time, and undo a change that did not help before you try the next.
- When you fix a cause, look for the same mistake elsewhere in the app.
- Never change the check, the environment, the generated client or the platform's files to get past an error.
- A package the check refuses is outside the starter's list: use what the starter has, or ask for it as `conexus-app` says. Never install one the person has not allowed.
- When fixes keep failing, suspect the design, not the line; say so when you stop.

## When the work leaves the plan

- A technical difference, such as a name, a structure or a component: decide, update the plan, and list it in your final message.
- A difference the person would notice or has to decide, such as a source without the data, a rule the data contradicts, or work bigger than planned: finish the parts that do not depend on it, then update the plan and ask with `ask_user`. Never make the work smaller on your own.
- Without a plan, split the request the same way.

## Keep the code clean

- When you replace something, find every use of the old one, in code and in text, move them all, and delete the old one in the same step.
- Keep a comment only for a why the code cannot show.
- Handle the cases that can happen; add no checks for states that cannot.
- Before a step is done, remove what it left behind: debug output, unused files, imports, packages and code.

## Finish

1. Read the plan again, or the request without one, and check each item against what you proved. Mark done only what you proved.
2. Read the app as the person will meet it, screen by screen, from the first one, against the plan's part for the person. If a screen would read as a bare form or an empty table to someone opening it for the first time, or a suggestion the person approved is missing, fix it before you finish.
3. Make the plan match what you built.
4. Save what lasts to the app's memory: decisions with why, rules the person confirmed, and where each piece of data lives.
5. Write the final message in a few short sentences: first what failed or was not proven, then what is ready and what to try, then the decisions you made and the assumptions for the person to confirm. Say what ran as facts, such as "a conferência passou; as 3 operações foram lidas, não executadas". Do not end by offering more help.

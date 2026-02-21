# Active Program Tracking UX Design

## Overview

When a user activates a program, the Workouts page transforms into a "mission control" view. The active program session takes the hero position at the top, while workout history remains chronological below. The user's primary path: see next session → start workout → log performance.

## Design Decisions

| Question                       | Decision                                          |
| ------------------------------ | ------------------------------------------------- |
| Primary action on entry        | Review next session briefly, then start           |
| Standalone workout coexistence | Program-first; standalone creation takes backseat |
| Program activation location    | Both programs list and template editor            |
| Session preview detail level   | Minimal (session name/label + week number)        |
| Skip session access            | Available in overflow menu (not prominent)        |
| Program management location    | Dedicated program run page                        |

## Workouts Page (with Active Program)

### Mobile Layout

```
┌─────────────────────────────────┐
│  ┌───────────────────────────┐  │
│  │ PROGRAM NAME              │  │
│  │ Week 2 · Upper A      ⋮   │  │
│  │                           │  │
│  │    [ Start Workout ]      │  │
│  └───────────────────────────┘  │
│                                 │
│  ─── Recent Workouts ─────────  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Upper A · Feb 17          │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ Lower B · Feb 15          │  │
│  └───────────────────────────┘  │
│  ...                            │
│                           (+)   │  ← FAB for standalone (smaller/muted)
└─────────────────────────────────┘
```

### Desktop Layout

Hero card appears in the left 2/3 area (where empty state currently is). Workout list stays in right 1/3. Sidebar "New Workout" button remains for standalone workouts.

### Hero Card Contents

- Program name (bold, prominent)
- Next session: "Week X · [Label or Track]"
- Overflow menu (⋮): Skip session, View program, Pause program
- Large primary "Start Workout" button
- Subtle progress indicator: "Session 5 of 16" or thin progress bar

## Program Run Detail Page (`/program-run-[id]`)

### Layout

```
┌─────────────────────────────────┐
│ ← Back                          │
│                                 │
│ PROGRAM NAME                    │
│ Started Feb 1 · Week 2 of 4     │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ████████░░░░░░░░  5/16      │ │
│ └─────────────────────────────┘ │
│                                 │
│ ─── Week 1 ─────────────────── │
│  ✓ Upper A · Feb 1             │
│  ✓ Lower A · Feb 3             │
│  ✓ Upper B · Feb 5             │
│  ○ Lower B · Skipped           │
│                                 │
│ ─── Week 2 ─────────────────── │
│  ✓ Upper A · Feb 8             │
│  → Lower A · Up next           │
│  ○ Upper B                     │
│  ○ Lower B                     │
│                                 │
│ ─── Week 3 ─────────────────── │
│  ○ Upper A                     │
│  ...                           │
│                                 │
│ ┌─────────────────────────────┐ │
│ │  Pause Program   │  Cancel  │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Session States

- ✓ **Completed** — tappable, links to logged workout
- → **Up next** — highlighted with badge
- ○ **Pending** — dimmed, future session
- ⊘ **Skipped** — muted with "Skipped" label

### Actions

- Pause/Resume toggle
- Cancel (with confirmation dialog)
- Tap completed session → navigate to workout

## Activation Flow

### From Programs List (`/programs`)

- Each template card gets "Start" button (or play icon)
- Button disabled with tooltip if template has 0 workouts
- Button shows "View Active Run" if that template's run is already active
- If another program active: confirmation dialog "Starting this will replace your current program. Continue?"

### From Template Editor (`/program-template-[id]`)

- "Start Program" button in header card
- Same disabled/active-run logic as programs list
- Same confirmation if replacing active program

### After Activation

- Navigate to Workouts page (hero card now visible)
- Show brief toast: "Program started"

## No Active Program State

### Workouts Page

- No hero card shown
- Layout reverts to current behavior
- FAB/"New Workout" returns to full prominence

### Programs Page

- No special state; just the template list

### Completed Program

- Run auto-completes when all sessions done (backend handles this)
- Hero card disappears from Workouts page
- Past runs viewable from Programs tab (future enhancement)

## Summary Table

| Location          | Changes                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Workouts page     | Hero card when active; minimal session info; "Start Workout"; overflow menu; workout list unchanged |
| Program run page  | New `/program-run-[id]}` route; progress bar; week-by-week sessions; states; pause/cancel           |
| Programs list     | "Start" button; disabled if 0 workouts; "View Active Run" if running; replace confirmation          |
| Template editor   | "Start Program" button; same logic as programs list                                                 |
| No active program | Current behavior; hero card absent                                                                  |

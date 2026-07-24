# LiftLogic Code Commenting Guidelines

## Goal
Keep comments useful, current, and focused on intent. LiftLogic should be easy to read because the code is well named and well organized, not because every line is narrated.

## Comment When
- A business rule is not obvious from the code alone.
- A safety or workout-prescription decision could be accidentally changed later.
- A component coordinates several states or data sources.
- A workaround exists for backward compatibility, browser behavior, or older saved data.
- A helper has ranking, scoring, fallback, or precedence rules.

## Avoid Comments That
- Repeat exactly what a line of code says.
- Explain basic React, TypeScript, or CSS syntax.
- Describe old behavior without saying whether it still matters.
- Become a substitute for extracting a reusable function or component.

## Preferred Pattern
- Use short comments above the block they explain.
- Explain the "why" before the "what."
- If a comment grows past a few lines, consider extracting a helper with a clear name.
- Keep public utility helpers documented when their behavior affects multiple pages.

## Refactor Signal
When a file needs many comments to be understandable, treat that as a sign to split it. Prefer reusable components, typed helpers, and smaller modules over larger annotated files.

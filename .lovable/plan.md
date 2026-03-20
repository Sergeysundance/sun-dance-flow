

## Plan: Add Dance Directions Multi-Select to New Client Dialog

### What
Add a multi-select checkbox list of dance directions (from `directions` in mockData) to the "Новый клиент" dialog, so the admin can pick one or more preferred directions for the client.

### Changes — `src/pages/admin/ClientsPage.tsx`

1. Import `directions` from `@/data/mockData` and `Checkbox` from UI components.

2. After the "Источник" select and before "Заметки", add a new field **"Предпочтительные направления"** with a list of checkboxes — one per active direction from `directions`. Each checkbox shows the direction name with its color dot.

3. Add state `selectedDirections: string[]` to track chosen direction IDs, with a `toggleDirection` helper.

4. Make the dialog body scrollable (`max-h-[60vh] overflow-y-auto`) since the form is now longer.

5. Reset `selectedDirections` to `[]` when dialog closes.


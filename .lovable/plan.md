

## Plan: Add Edit Teacher Dialog

### What
Wire the "Редактировать" dropdown menu item to open the same dialog form, pre-filled with the selected teacher's data, allowing edits.

### Changes — `src/pages/admin/TeachersPage.tsx`

1. Add state for the teacher being edited: `const [editTeacher, setEditTeacher] = useState<Teacher | null>(null)` and form field states (`firstName`, `lastName`, `phone`, `email`, `bio`, `telegramId`, `selectedDirections`).

2. Compute `isEditing = !!editTeacher` and derive dialog title ("Новый преподаватель" vs "Редактировать преподавателя").

3. On "Редактировать" click — set `editTeacher` to the teacher object, populate all form states from it, and open the dialog.

4. On "Новый преподаватель" click — clear `editTeacher`, reset form fields to empty, and open the dialog.

5. Reuse the same `Dialog` — bind each `Input`/`Textarea`/`Checkbox` to the form states via `value` + `onChange`.

6. On save — show appropriate toast ("сохранён" vs "обновлён") and close.


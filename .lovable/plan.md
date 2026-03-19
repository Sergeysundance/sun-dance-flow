

## Problem

The "New Teacher" dialog has too much content for the viewport (502px height). The form fields for name/surname are hidden behind the dialog header, making it hard to see where to type.

## Solution

Make the dialog body scrollable and cap its max height so all fields are accessible, with the form starting from the top visible area.

### Changes

**File: `src/pages/admin/TeachersPage.tsx`**

- Add `max-h-[80vh] overflow-y-auto` to the `DialogContent` so it scrolls within the viewport
- Alternatively, add scrolling to the inner form `div` with `max-h-[60vh] overflow-y-auto` to keep header and footer fixed

The simplest fix: change the `DialogContent` class to include `max-h-[85vh]` and wrap the form grid in a scrollable container with `max-h-[60vh] overflow-y-auto pr-1`.


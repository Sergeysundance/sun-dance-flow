

## Plan: Admin Enhancements, Password Recovery, Schedule Details, Photo Management

### 1. Show email in Clients and Teachers lists

**ClientsPage.tsx**: Add "Email" column to the table. Need to fetch email from `auth.users` — but since we can't query `auth.users` directly from the client, we'll display the email from profile data. Since profiles don't store email, we'll look up the user's email via the `teachers` table (for teachers) or add a query approach. For clients, we need to store email in profiles or fetch it differently.

Actually, the simplest approach: Supabase auth email is not accessible from client. We'll add an `email` column to the `profiles` table via migration, and populate it during registration (update `handle_new_user` trigger to also store email). For existing users, we can extract from `auth.users` via an edge function or just show it going forward.

**TeachersPage.tsx**: Teachers already have an `email` column — just add it to the table display.

### 2. "Forgot Password" button on login dialog (AuthDialog)

Add a "Забыл пароль?" link in the login mode of `AuthDialog.tsx`. When clicked, show an email input and call `supabase.auth.resetPasswordForEmail()`. Create a `/reset-password` page to handle the recovery callback.

### 3. "Forgot Password" for admin (AdminAuthGuard)

Admin uses a custom hash-based password (not Supabase Auth). Add a "Забыл пароль?" button that sends a recovery code/link to the email specified in `studio_settings` under the `contact` key (the studio's contact email). Implementation: generate a temporary code, store it in `studio_settings`, and send via edge function or use a simple approach — show the contact email and send a reset code via the existing notification system.

Simpler approach: Use an edge function to send a password reset code to the admin email (from `studio_settings` contact data).

### 4. Class detail popup on the landing page schedule

When a user clicks a class card on the main site schedule, show a Dialog with full class info: direction name, description (from `directions` table), time, teacher(s), room. Add a `description` column to `schedule_classes` table for per-class notes that admin can edit.

### 5. Admin schedule grid: drag-to-resize classes

This is complex — implementing drag-to-resize/merge cells in `WeeklyTimeGrid` for admin. The approach: allow admin to drag the bottom edge of a class card to adjust `end_time`, and update the DB. This requires significant interaction handling but is feasible with mouse/touch events on the card borders.

### 6. Admin "Photos" section for managing site images

Create a new admin page `/admin/photos` for managing hero images and gallery photos. Store image URLs in `studio_settings` (key: `site_photos`). Create a `site-photos` storage bucket. Admin can upload/replace hero images and gallery photos.

### 7. Teacher photo toggle (seen_by_admin slider for photo visibility)

In `TeacherDetailPage` and `TeachersPage`, add a Switch/toggle for `seen_by_admin` which controls whether the teacher's photo and profile appear on the public site. The `Team.tsx` component already filters by `seen_by_admin`.

---

### Technical Details

**Database migrations:**
- Add `email` column to `profiles` table
- Add `description` text column to `schedule_classes` table
- Update `handle_new_user()` trigger to store email
- Create `site-photos` storage bucket

**New files:**
- `src/pages/ResetPassword.tsx` — password reset page
- `src/pages/admin/PhotosPage.tsx` — site photo management
- `supabase/functions/admin-password-reset/index.ts` — send admin reset code

**Modified files:**
- `src/components/AuthDialog.tsx` — add forgot password flow
- `src/components/AdminAuthGuard.tsx` — add forgot password with email
- `src/pages/admin/ClientsPage.tsx` — add email column
- `src/pages/admin/TeachersPage.tsx` — add email column, add seen_by_admin toggle
- `src/pages/admin/TeacherDetailPage.tsx` — add seen_by_admin toggle
- `src/components/Schedule.tsx` — add class detail dialog on click
- `src/components/WeeklyTimeGrid.tsx` — admin drag-to-resize support
- `src/pages/admin/SchedulePage.tsx` — add description field to class editor
- `src/layouts/AdminLayout.tsx` — add Photos nav item
- `src/App.tsx` — add /reset-password and /admin/photos routes

**Storage:**
- Create `site-photos` bucket (public)


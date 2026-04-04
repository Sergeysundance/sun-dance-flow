
-- Add branch_id to rooms
ALTER TABLE public.rooms ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- Add branch_id to directions
ALTER TABLE public.directions ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- Add branch_id to schedule_classes
ALTER TABLE public.schedule_classes ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- Add branch_ids array to teachers (can work in multiple branches)
ALTER TABLE public.teachers ADD COLUMN branch_ids UUID[] NOT NULL DEFAULT '{}'::uuid[];

-- Add branch_id to trial_requests
ALTER TABLE public.trial_requests ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

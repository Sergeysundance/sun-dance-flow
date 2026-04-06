DELETE FROM schedule_classes a
USING schedule_classes b
WHERE a.direction_id = b.direction_id
  AND a.teacher_id = b.teacher_id
  AND a.room_id = b.room_id
  AND a.date = b.date
  AND a.start_time = b.start_time
  AND a.end_time = b.end_time
  AND COALESCE(a.branch_id, '00000000-0000-0000-0000-000000000000') = COALESCE(b.branch_id, '00000000-0000-0000-0000-000000000000')
  AND a.id > b.id;
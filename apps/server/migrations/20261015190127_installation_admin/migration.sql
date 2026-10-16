-- Custom SQL: Drizzle cannot generate a data change (data D5, D14). Only the installation's
-- administrator creates companies (admin plugin, user.role; security S11). An installation that
-- already has people gives the role to the earliest of them, the first person, when nobody has it.
UPDATE auth."user" SET role = 'admin'
WHERE id = (SELECT id FROM auth."user" ORDER BY created_at, id LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM auth."user" WHERE role = 'admin');

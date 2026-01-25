-- Allow public read access for business hours and special days.
create policy "Public read business hours"
on public.business_hours
for select
to anon
using (true);

create policy "Public read special days"
on public.special_days
for select
to anon
using (true);

grant select on public.business_hours to anon;
grant select on public.special_days to anon;

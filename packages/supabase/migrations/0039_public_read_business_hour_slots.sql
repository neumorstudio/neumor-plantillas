-- Allow public read of business hour slots for reservation availability.
drop policy if exists "Public read business hour slots" on public.business_hour_slots;

create policy "Public read business hour slots"
on public.business_hour_slots
for select
to anon
using (true);

grant select on public.business_hour_slots to anon;

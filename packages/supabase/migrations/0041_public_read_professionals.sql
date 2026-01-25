-- Allow public read of professionals for booking selection.
drop policy if exists "Public read professionals" on public.professionals;

create policy "Public read professionals"
on public.professionals
for select
to anon
using (true);

grant select on public.professionals to anon;

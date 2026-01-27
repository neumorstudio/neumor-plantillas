-- Enable public read for salon service catalog (categories + items)
-- Needed so the public salon template can load services via anon key

alter table public.service_categories enable row level security;
alter table public.service_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'service_categories'
      and policyname = 'Public read service categories'
  ) then
    create policy "Public read service categories"
      on public.service_categories
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'service_items'
      and policyname = 'Public read service items'
  ) then
    create policy "Public read service items"
      on public.service_items
      for select
      using (true);
  end if;
end $$;

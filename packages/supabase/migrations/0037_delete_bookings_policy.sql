-- Allow authenticated users to delete their own bookings.
drop policy if exists "Users can delete own bookings" on public.bookings;

create policy "Users can delete own bookings"
on public.bookings
for delete
to authenticated
using (
  website_id in (
    select websites.id
    from public.websites
    join public.clients on public.clients.id = public.websites.client_id
    where public.clients.auth_user_id = auth.uid()
  )
);

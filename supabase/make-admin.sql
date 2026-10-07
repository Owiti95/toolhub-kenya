-- After creating your user (Authentication > Users > Add user), run this with your email:
insert into public.admins (user_id)
select id from auth.users where email = 'approvedtoolske@gmail.com'
on conflict do nothing;

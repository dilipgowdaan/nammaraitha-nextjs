insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'nammaraitha-images',
  'nammaraitha-images',
  true,
  6291456,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.products add column if not exists category text default 'Produce';
alter table public.products add column if not exists harvest_date date;
alter table public.products add column if not exists is_featured boolean not null default false;
alter table public.products add column if not exists created_at timestamptz not null default now();

alter table public.orders add column if not exists payment_reference text;
alter table public.orders add column if not exists delivery_note text;
alter table public.orders add column if not exists delivered_timestamp timestamptz;

alter table public.reviews add column if not exists order_id bigint references public.orders(id) on delete set null;
alter table public.reviews add column if not exists created_at timestamptz not null default now();

notify pgrst, 'reload schema';

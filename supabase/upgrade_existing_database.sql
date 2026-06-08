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

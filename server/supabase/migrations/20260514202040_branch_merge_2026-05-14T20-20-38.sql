alter table public.art_products
  drop constraint if exists art_products_status_check;

alter table public.order_items
  drop constraint if exists order_items_order_id_fkey;

alter table public.order_items
  drop constraint if exists order_items_pkey;

alter table public.order_items
  drop constraint if exists order_items_product_id_fkey;

drop index if exists public.idx_order_items_order;

drop view if exists public.v_product_pricings_with_sizes;

drop trigger if exists update_photify_uploads_updated_at on public.photify_uploads;

drop trigger if exists product_pricings_updated_at on public.product_pricings;

drop table if exists public.product_pricings;

drop policy if exists "Public insert order_items" ON public.order_items;

drop policy if exists "Public read order_items" ON public.order_items;

drop policy if exists "Allow public inserts to photify_uploads" ON public.photify_uploads;

drop policy if exists "Allow public reads from photify_uploads" ON public.photify_uploads;

drop table if exists public.photify_uploads;

create extension if not exists pg_graphql with schema graphql;

alter table public.site_settings
  alter column setting_type set default 'text'::character varying;

create table if not exists public.ai_tools (
  id          uuid                     default extensions.uuid_generate_v4() not null,
  title       character varying(255)   not null,
  slug        character varying(255)   not null,
  description text                     not null,
  image       text                     not null,
  path        character varying(255)   not null,
  is_active   boolean                  default true,
  created_at  timestamp with time zone default now(),
  updated_at  timestamp with time zone default now()
);

alter table public.ai_tools
  enable row level security;

do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'ai_tools_pkey' and conrelid = 'public.ai_tools'::regclass) then
    alter table public.ai_tools add constraint ai_tools_pkey primary key (id);
  end if;
end $do$;

do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'ai_tools_slug_key' and conrelid = 'public.ai_tools'::regclass) then
    alter table public.ai_tools add constraint ai_tools_slug_key unique (slug);
  end if;
end $do$;

drop policy if exists "Public read ai_tools" ON public.ai_tools;
create policy "Public read ai_tools" ON public.ai_tools
  for select
  using ((is_active = true));

alter table public.art_products
  add constraint art_products_status_check check (status::text = ANY (ARRAY['active'::character varying::text, 'inactive'::character varying::text, 'draft'::character varying::text]));

alter table public.order_items
  disable row level security;

comment on column public.orders.shipped_at is 'Timestamp when the order was marked as shipped/dispatched';

alter table public.orders
  add column if not exists discount numeric(10,2) default 0 not null;

comment on column public.orders.discount is 'Total discount amount (in GBP) applied to the order from a promo code';

alter table public.orders
  add column if not exists promo_code character varying(50);

comment on column public.orders.promo_code is 'Promo code applied to the order, if any (e.g. SAVE20)';

alter table public.orders
  add column if not exists parcel2go_order_id text;

comment on column public.orders.parcel2go_order_id is 'Parcel2Go order/booking identifier returned after booking a shipment';

alter table public.orders
  add column if not exists parcel2go_hash text;

comment on column public.orders.parcel2go_hash is 'Parcel2Go quote hash used to book the chosen service';

alter table public.orders
  add column if not exists tracking_number text;

comment on column public.orders.tracking_number is 'Carrier tracking number for the shipment';

alter table public.orders
  add column if not exists tracking_url text;

comment on column public.orders.tracking_url is 'Public carrier tracking URL';

alter table public.orders
  add column if not exists carrier_name text;

comment on column public.orders.carrier_name is 'Courier handling the shipment (e.g. Evri, DPD, Royal Mail)';

alter table public.orders
  add column if not exists service_name text;

comment on column public.orders.service_name is 'Chosen service name (e.g. Next Day, 48h)';

alter table public.orders
  add column if not exists service_id text;

comment on column public.orders.service_id is 'Parcel2Go service id chosen at booking time';

alter table public.orders
  add column if not exists label_url text;

comment on column public.orders.label_url is 'URL to the downloadable shipping label PDF';

alter table public.orders
  add column if not exists parcel_dimensions jsonb;

comment on column public.orders.parcel_dimensions is 'Snapshot of parcels used when booking (weight, length, width, height, value)';

alter table public.orders
  add column if not exists shipment_cost numeric(10,2);

comment on column public.orders.shipment_cost is 'Cost charged by Parcel2Go for this shipment (GBP)';

alter table public.orders
  add column if not exists parcel2go_orderline_id text;

alter table public.orders
  add column if not exists tracking_stage text;

alter table public.orders
  add column if not exists tracking_last_synced_at timestamp with time zone;

create index if not exists idx_orders_tracking_number on public.orders (tracking_number)
  where tracking_number is not null;

create index if not exists idx_orders_parcel2go_order_id on public.orders (parcel2go_order_id)
  where parcel2go_order_id is not null;

create index if not exists idx_orders_parcel2go_orderline_id on public.orders (parcel2go_orderline_id)
  where parcel2go_orderline_id is not null;

create index if not exists idx_orders_promo_code on public.orders (promo_code)
  where promo_code is not null;

create table if not exists public.parcel2go_webhook_events (
  id              text                     not null,
  type            text                     not null,
  received_at     timestamp with time zone default now() not null,
  event_timestamp timestamp with time zone,
  signature       text,
  payload         jsonb,
  order_number    text,
  orderline_id    text,
  processed       boolean                  default false not null,
  processed_at    timestamp with time zone,
  error           text
);

do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'parcel2go_webhook_events_pkey' and conrelid = 'public.parcel2go_webhook_events'::regclass) then
    alter table public.parcel2go_webhook_events add constraint parcel2go_webhook_events_pkey primary key (id);
  end if;
end $do$;

create index if not exists idx_parcel2go_webhook_events_type on public.parcel2go_webhook_events (type);

alter table public.products
  add column if not exists name_embedding public.vector(1536);

comment on column public.products.name_embedding is 'Vector embedding of product name for semantic search (1536 dimensions)';

alter table public.products
  add column if not exists search_text text generated always as ((((name)::text || ' '::text) || COALESCE(description, ''::text))) stored;

comment on column public.products.search_text is 'Generated full-text search field combining name and description';

create index if not exists idx_products_search_text on public.products using gin (to_tsvector('english'::regconfig, search_text));

create index if not exists idx_products_name_embedding on public.products using ivfflat (name_embedding public.vector_cosine_ops)
  with (lists='100');

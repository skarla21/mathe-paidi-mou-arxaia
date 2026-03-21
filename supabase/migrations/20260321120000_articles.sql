-- Articles, engagement, admin notification kinds

-- Articles
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  tags text[] not null default '{}',
  reading_time_minutes smallint not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists articles_published_idx on public.articles(published);
create index if not exists articles_created_at_idx on public.articles(created_at desc);

create table if not exists public.article_likes (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, article_id)
);
create index if not exists article_likes_article_id_idx on public.article_likes(article_id);
create index if not exists article_likes_user_id_idx on public.article_likes(user_id);

create table if not exists public.article_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  body text not null check (char_length(body) >= 1 and char_length(body) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, article_id)
);
create index if not exists article_comments_user_id_idx on public.article_comments(user_id);
create index if not exists article_comments_article_id_idx on public.article_comments(article_id);

alter table public.articles enable row level security;
alter table public.article_likes enable row level security;
alter table public.article_comments enable row level security;

create policy "articles_select_all" on public.articles for select using (true);
create policy "article_likes_select_all" on public.article_likes for select using (true);
create policy "article_comments_select_all" on public.article_comments for select using (true);

create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

create trigger article_comments_set_updated_at
  before update on public.article_comments
  for each row execute function public.set_updated_at();

-- Admin notification preferences: article toggles
alter table public.admin_notification_preferences
  add column if not exists notify_article_like boolean not null default true;
alter table public.admin_notification_preferences
  add column if not exists notify_article_comment boolean not null default true;

-- Expand admin_notifications.kind check
alter table public.admin_notifications drop constraint if exists admin_notifications_kind_check;
alter table public.admin_notifications add constraint admin_notifications_kind_check
  check (kind in (
    'purchase', 'download', 'rating', 'comment', 'contact',
    'article_like', 'article_comment'
  ));

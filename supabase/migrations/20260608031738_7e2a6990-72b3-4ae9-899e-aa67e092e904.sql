
-- Roles
CREATE TYPE public.app_role AS ENUM ('contributor', 'curator');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_self_read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Auto-create profile + contributor role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'contributor');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Community sources: shared registry. Anyone can read; signed-in users can add.
CREATE TABLE public.community_sources (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.community_sources TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.community_sources TO authenticated;
GRANT ALL ON public.community_sources TO service_role;
ALTER TABLE public.community_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sources_read_all" ON public.community_sources FOR SELECT USING (true);
CREATE POLICY "sources_insert_auth" ON public.community_sources FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "sources_update_owner_or_curator" ON public.community_sources FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'curator'));
CREATE POLICY "sources_delete_owner_or_curator" ON public.community_sources FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'curator'));
CREATE TRIGGER trg_sources_updated BEFORE UPDATE ON public.community_sources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Community queue: ingest queue. Auth-only.
CREATE TABLE public.community_queue (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_queue TO authenticated;
GRANT ALL ON public.community_queue TO service_role;
ALTER TABLE public.community_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "queue_read_auth" ON public.community_queue FOR SELECT TO authenticated USING (true);
CREATE POLICY "queue_write_owner" ON public.community_queue FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "queue_update_owner_or_curator" ON public.community_queue FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'curator'));
CREATE POLICY "queue_delete_owner_or_curator" ON public.community_queue FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'curator'));
CREATE TRIGGER trg_queue_updated BEFORE UPDATE ON public.community_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Community drafts: the actual imported records. Published rows are public.
CREATE TABLE public.community_drafts (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_drafts_published ON public.community_drafts (published);
GRANT SELECT ON public.community_drafts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.community_drafts TO authenticated;
GRANT ALL ON public.community_drafts TO service_role;
ALTER TABLE public.community_drafts ENABLE ROW LEVEL SECURITY;
-- Anyone can read published; signed-in users can also read their own unpublished + curators can read all.
CREATE POLICY "drafts_read_published" ON public.community_drafts FOR SELECT USING (published = true);
CREATE POLICY "drafts_read_own" ON public.community_drafts FOR SELECT TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'curator'));
CREATE POLICY "drafts_insert_owner" ON public.community_drafts FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "drafts_update_owner_or_curator" ON public.community_drafts FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'curator'));
CREATE POLICY "drafts_delete_owner_or_curator" ON public.community_drafts FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'curator'));
CREATE TRIGGER trg_drafts_updated BEFORE UPDATE ON public.community_drafts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_sources;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_drafts;

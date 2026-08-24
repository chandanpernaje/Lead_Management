
CREATE TYPE public.lead_service AS ENUM ('Website Development','Web Application','Mobile Application','E-Commerce','SEO','Digital Marketing','Other');
CREATE TYPE public.lead_source AS ENUM ('Website','WhatsApp','Referral','LinkedIn','Google','Facebook','Other');
CREATE TYPE public.lead_status AS ENUM ('New','Contacted','Proposal Sent','Negotiation','Won','Lost');
CREATE TYPE public.followup_type AS ENUM ('Call','Email','Meeting','WhatsApp','Site Visit','Other');

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_members_authenticated_all" ON public.team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT NOT NULL,
  service public.lead_service NOT NULL,
  source public.lead_source NOT NULL,
  estimated_value NUMERIC(12,2),
  assigned_to UUID NOT NULL REFERENCES public.team_members(id) ON DELETE RESTRICT,
  remarks TEXT,
  status public.lead_status NOT NULL DEFAULT 'New',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX leads_email_unique ON public.leads (lower(email));
CREATE UNIQUE INDEX leads_mobile_unique ON public.leads (mobile);
CREATE INDEX leads_status_idx ON public.leads (status);
CREATE INDEX leads_assigned_idx ON public.leads (assigned_to);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_authenticated_all" ON public.leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  follow_up_date DATE NOT NULL DEFAULT current_date,
  follow_up_type public.followup_type NOT NULL,
  remarks TEXT NOT NULL,
  next_follow_up_date DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX follow_ups_lead_idx ON public.follow_ups (lead_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_ups TO authenticated;
GRANT ALL ON public.follow_ups TO service_role;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follow_ups_authenticated_all" ON public.follow_ups FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.team_members (name) VALUES ('Arun Kumar'),('Priya Sharma'),('Rahul Verma'),('Sneha Nair');

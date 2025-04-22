--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: approval_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.approval_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_type AS ENUM (
    'endorsement',
    'level_up',
    'achievement'
);


--
-- Name: skill_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.skill_level AS ENUM (
    'beginner',
    'intermediate',
    'expert'
);


--
-- Name: tab_visibility; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tab_visibility AS ENUM (
    'visible',
    'hidden'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    name text NOT NULL,
    industry text,
    contact_name text,
    contact_email text,
    contact_phone text,
    website text,
    logo_url text,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: endorsements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.endorsements (
    id integer NOT NULL,
    skill_id integer NOT NULL,
    endorser_id integer NOT NULL,
    endorsee_id integer NOT NULL,
    comment text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: endorsements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.endorsements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: endorsements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.endorsements_id_seq OWNED BY public.endorsements.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type public.notification_type NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    related_skill_id integer,
    related_user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: pending_skill_updates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pending_skill_updates (
    id integer NOT NULL,
    user_id integer NOT NULL,
    skill_id integer,
    name text NOT NULL,
    category text NOT NULL,
    level public.skill_level NOT NULL,
    certification text,
    credly_link text,
    notes text,
    certification_date timestamp without time zone,
    expiration_date timestamp without time zone,
    status public.approval_status DEFAULT 'pending'::public.approval_status NOT NULL,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reviewed_at timestamp without time zone,
    reviewed_by integer,
    review_notes text,
    is_update boolean DEFAULT false NOT NULL
);


--
-- Name: pending_skill_updates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pending_skill_updates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pending_skill_updates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pending_skill_updates_id_seq OWNED BY public.pending_skill_updates.id;


--
-- Name: profile_histories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profile_histories (
    id integer NOT NULL,
    user_id integer NOT NULL,
    changed_field character varying(50) NOT NULL,
    previous_value text,
    new_value text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: profile_histories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.profile_histories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: profile_histories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.profile_histories_id_seq OWNED BY public.profile_histories.id;


--
-- Name: project_resource_histories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_resource_histories (
    id integer NOT NULL,
    project_id integer NOT NULL,
    user_id integer NOT NULL,
    action text NOT NULL,
    previous_role text,
    new_role text,
    previous_allocation integer,
    new_allocation integer,
    date timestamp without time zone DEFAULT now(),
    performed_by_id integer,
    note text
);


--
-- Name: project_resource_histories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_resource_histories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_resource_histories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_resource_histories_id_seq OWNED BY public.project_resource_histories.id;


--
-- Name: project_resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_resources (
    id integer NOT NULL,
    project_id integer NOT NULL,
    user_id integer NOT NULL,
    role text,
    allocation integer DEFAULT 100,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: project_resources_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_resources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_resources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_resources_id_seq OWNED BY public.project_resources.id;


--
-- Name: project_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_skills (
    id integer NOT NULL,
    project_id integer NOT NULL,
    skill_id integer NOT NULL,
    required_level text DEFAULT 'beginner'::text,
    importance text DEFAULT 'medium'::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: project_skills_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_skills_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_skills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_skills_id_seq OWNED BY public.project_skills.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    client_id integer,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    location text,
    confluence_link text,
    lead_id integer,
    delivery_lead_id integer,
    status text DEFAULT 'active'::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    hr_coordinator_email text,
    finance_team_email text
);


--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: skill_approvers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill_approvers (
    id integer NOT NULL,
    user_id integer NOT NULL,
    category_id integer,
    can_approve_all boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    subcategory_id integer,
    skill_id integer
);


--
-- Name: skill_approvers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skill_approvers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skill_approvers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skill_approvers_id_seq OWNED BY public.skill_approvers.id;


--
-- Name: skill_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill_categories (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    tab_order integer DEFAULT 0,
    visibility public.tab_visibility DEFAULT 'visible'::public.tab_visibility,
    color text DEFAULT '#3B82F6'::text,
    icon text DEFAULT 'code'::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: skill_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skill_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skill_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skill_categories_id_seq OWNED BY public.skill_categories.id;


--
-- Name: skill_histories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill_histories (
    id integer NOT NULL,
    skill_id integer NOT NULL,
    user_id integer NOT NULL,
    previous_level character varying(50),
    new_level character varying(50) NOT NULL,
    change_note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: skill_histories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skill_histories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skill_histories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skill_histories_id_seq OWNED BY public.skill_histories.id;


--
-- Name: skill_subcategories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill_subcategories (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    category_id integer NOT NULL,
    color text DEFAULT '#3B82F6'::text,
    icon text DEFAULT 'code'::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: skill_subcategories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skill_subcategories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skill_subcategories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skill_subcategories_id_seq OWNED BY public.skill_subcategories.id;


--
-- Name: skill_target_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill_target_skills (
    id integer NOT NULL,
    target_id integer NOT NULL,
    skill_id integer NOT NULL
);


--
-- Name: skill_target_skills_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skill_target_skills_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skill_target_skills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skill_target_skills_id_seq OWNED BY public.skill_target_skills.id;


--
-- Name: skill_target_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill_target_users (
    id integer NOT NULL,
    target_id integer NOT NULL,
    user_id integer NOT NULL
);


--
-- Name: skill_target_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skill_target_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skill_target_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skill_target_users_id_seq OWNED BY public.skill_target_users.id;


--
-- Name: skill_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill_targets (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    target_level public.skill_level NOT NULL,
    target_date date,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    target_number integer
);


--
-- Name: skill_targets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skill_targets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skill_targets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skill_targets_id_seq OWNED BY public.skill_targets.id;


--
-- Name: skill_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill_templates (
    id integer NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    description text,
    is_recommended boolean DEFAULT false,
    target_level public.skill_level,
    target_date date,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: skill_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skill_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skill_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skill_templates_id_seq OWNED BY public.skill_templates.id;


--
-- Name: skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skills (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(255) NOT NULL,
    level character varying(50) NOT NULL,
    certification character varying(255),
    credly_link character varying(512),
    notes text,
    endorsement_count integer DEFAULT 0,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    certification_date timestamp without time zone,
    expiration_date timestamp without time zone,
    category_id integer
);


--
-- Name: skills_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skills_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skills_id_seq OWNED BY public.skills.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    is_admin boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    first_name text DEFAULT ''::text,
    last_name text DEFAULT ''::text,
    project text DEFAULT ''::text,
    role text DEFAULT ''::text,
    location text DEFAULT ''::text
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: endorsements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.endorsements ALTER COLUMN id SET DEFAULT nextval('public.endorsements_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: pending_skill_updates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_skill_updates ALTER COLUMN id SET DEFAULT nextval('public.pending_skill_updates_id_seq'::regclass);


--
-- Name: profile_histories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_histories ALTER COLUMN id SET DEFAULT nextval('public.profile_histories_id_seq'::regclass);


--
-- Name: project_resource_histories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_resource_histories ALTER COLUMN id SET DEFAULT nextval('public.project_resource_histories_id_seq'::regclass);


--
-- Name: project_resources id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_resources ALTER COLUMN id SET DEFAULT nextval('public.project_resources_id_seq'::regclass);


--
-- Name: project_skills id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_skills ALTER COLUMN id SET DEFAULT nextval('public.project_skills_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: skill_approvers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_approvers ALTER COLUMN id SET DEFAULT nextval('public.skill_approvers_id_seq'::regclass);


--
-- Name: skill_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_categories ALTER COLUMN id SET DEFAULT nextval('public.skill_categories_id_seq'::regclass);


--
-- Name: skill_histories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_histories ALTER COLUMN id SET DEFAULT nextval('public.skill_histories_id_seq'::regclass);


--
-- Name: skill_subcategories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_subcategories ALTER COLUMN id SET DEFAULT nextval('public.skill_subcategories_id_seq'::regclass);


--
-- Name: skill_target_skills id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_target_skills ALTER COLUMN id SET DEFAULT nextval('public.skill_target_skills_id_seq'::regclass);


--
-- Name: skill_target_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_target_users ALTER COLUMN id SET DEFAULT nextval('public.skill_target_users_id_seq'::regclass);


--
-- Name: skill_targets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_targets ALTER COLUMN id SET DEFAULT nextval('public.skill_targets_id_seq'::regclass);


--
-- Name: skill_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_templates ALTER COLUMN id SET DEFAULT nextval('public.skill_templates_id_seq'::regclass);


--
-- Name: skills id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills ALTER COLUMN id SET DEFAULT nextval('public.skills_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: endorsements endorsements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.endorsements
    ADD CONSTRAINT endorsements_pkey PRIMARY KEY (id);


--
-- Name: endorsements endorsements_skill_id_endorser_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.endorsements
    ADD CONSTRAINT endorsements_skill_id_endorser_id_key UNIQUE (skill_id, endorser_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: pending_skill_updates pending_skill_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_skill_updates
    ADD CONSTRAINT pending_skill_updates_pkey PRIMARY KEY (id);


--
-- Name: profile_histories profile_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_histories
    ADD CONSTRAINT profile_histories_pkey PRIMARY KEY (id);


--
-- Name: project_resource_histories project_resource_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_resource_histories
    ADD CONSTRAINT project_resource_histories_pkey PRIMARY KEY (id);


--
-- Name: project_resources project_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_resources
    ADD CONSTRAINT project_resources_pkey PRIMARY KEY (id);


--
-- Name: project_skills project_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_skills
    ADD CONSTRAINT project_skills_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: skill_approvers skill_approvers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_approvers
    ADD CONSTRAINT skill_approvers_pkey PRIMARY KEY (id);


--
-- Name: skill_categories skill_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_categories
    ADD CONSTRAINT skill_categories_pkey PRIMARY KEY (id);


--
-- Name: skill_histories skill_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_histories
    ADD CONSTRAINT skill_histories_pkey PRIMARY KEY (id);


--
-- Name: skill_subcategories skill_subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_subcategories
    ADD CONSTRAINT skill_subcategories_pkey PRIMARY KEY (id);


--
-- Name: skill_target_skills skill_target_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_target_skills
    ADD CONSTRAINT skill_target_skills_pkey PRIMARY KEY (id);


--
-- Name: skill_target_users skill_target_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_target_users
    ADD CONSTRAINT skill_target_users_pkey PRIMARY KEY (id);


--
-- Name: skill_targets skill_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_targets
    ADD CONSTRAINT skill_targets_pkey PRIMARY KEY (id);


--
-- Name: skill_templates skill_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_templates
    ADD CONSTRAINT skill_templates_pkey PRIMARY KEY (id);


--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: idx_pending_skill_updates_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pending_skill_updates_status ON public.pending_skill_updates USING btree (status);


--
-- Name: idx_pending_skill_updates_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pending_skill_updates_user_id ON public.pending_skill_updates USING btree (user_id);


--
-- Name: endorsements endorsements_endorsee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.endorsements
    ADD CONSTRAINT endorsements_endorsee_id_fkey FOREIGN KEY (endorsee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: endorsements endorsements_endorser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.endorsements
    ADD CONSTRAINT endorsements_endorser_id_fkey FOREIGN KEY (endorser_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: endorsements endorsements_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.endorsements
    ADD CONSTRAINT endorsements_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_related_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_skill_id_fkey FOREIGN KEY (related_skill_id) REFERENCES public.skills(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_related_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_user_id_fkey FOREIGN KEY (related_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: profile_histories profile_histories_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_histories
    ADD CONSTRAINT profile_histories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: project_resource_histories project_resource_histories_performed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_resource_histories
    ADD CONSTRAINT project_resource_histories_performed_by_id_fkey FOREIGN KEY (performed_by_id) REFERENCES public.users(id);


--
-- Name: project_resource_histories project_resource_histories_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_resource_histories
    ADD CONSTRAINT project_resource_histories_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: project_resource_histories project_resource_histories_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_resource_histories
    ADD CONSTRAINT project_resource_histories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: project_resources project_resources_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_resources
    ADD CONSTRAINT project_resources_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: project_resources project_resources_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_resources
    ADD CONSTRAINT project_resources_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: project_skills project_skills_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_skills
    ADD CONSTRAINT project_skills_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: project_skills project_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_skills
    ADD CONSTRAINT project_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id);


--
-- Name: projects projects_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: projects projects_delivery_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_delivery_lead_id_fkey FOREIGN KEY (delivery_lead_id) REFERENCES public.users(id);


--
-- Name: projects projects_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.users(id);


--
-- Name: skill_approvers skill_approvers_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_approvers
    ADD CONSTRAINT skill_approvers_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.skill_categories(id);


--
-- Name: skill_approvers skill_approvers_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_approvers
    ADD CONSTRAINT skill_approvers_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id);


--
-- Name: skill_approvers skill_approvers_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_approvers
    ADD CONSTRAINT skill_approvers_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.skill_subcategories(id);


--
-- Name: skill_approvers skill_approvers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_approvers
    ADD CONSTRAINT skill_approvers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: skill_histories skill_histories_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_histories
    ADD CONSTRAINT skill_histories_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: skill_histories skill_histories_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_histories
    ADD CONSTRAINT skill_histories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: skill_subcategories skill_subcategories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_subcategories
    ADD CONSTRAINT skill_subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.skill_categories(id);


--
-- Name: skills skills_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.skill_categories(id);


--
-- Name: skills skills_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


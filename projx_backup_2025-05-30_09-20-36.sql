--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Ubuntu 14.17-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)

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
-- Name: hyperLink_schema; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA "hyperLink_schema";


ALTER SCHEMA "hyperLink_schema" OWNER TO postgres;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agency_campaign_application_from_creator; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agency_campaign_application_from_creator (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    campaign_id uuid NOT NULL,
    influencer_id uuid NOT NULL,
    application_status character varying(20),
    message text,
    applied_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.agency_campaign_application_from_creator OWNER TO postgres;

--
-- Name: agency_campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agency_campaigns (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    status character varying(20) DEFAULT 'DRAFT'::character varying,
    budget numeric(10,2),
    target_audience text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    description_tsvector tsvector,
    target_audience_tsvector tsvector,
    name_tsvector tsvector,
    campaign_media bytea,
    agency_id uuid
);


ALTER TABLE public.agency_campaigns OWNER TO postgres;

--
-- Name: agency_clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agency_clients (
    id integer NOT NULL,
    agency_id uuid,
    client_name character varying(255) NOT NULL,
    logo_url character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.agency_clients OWNER TO postgres;

--
-- Name: agency_clients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agency_clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agency_clients_id_seq OWNER TO postgres;

--
-- Name: agency_clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agency_clients_id_seq OWNED BY public.agency_clients.id;


--
-- Name: agency_packages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agency_packages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    agency_id uuid NOT NULL,
    package_type character varying(20) NOT NULL,
    price numeric(10,2) NOT NULL,
    features text NOT NULL,
    delivery_time_days integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    target_brand uuid
);


ALTER TABLE public.agency_packages OWNER TO postgres;

--
-- Name: agency_payment_info; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agency_payment_info (
    id integer NOT NULL,
    agency_id uuid,
    account_holder_name character varying(255) NOT NULL,
    account_number character varying(255) NOT NULL,
    ifsc_code character varying(200) NOT NULL,
    bank_name character varying(255) NOT NULL,
    gst_number character varying(50),
    pan_number character varying(200) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.agency_payment_info OWNER TO postgres;

--
-- Name: agency_payment_info_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agency_payment_info_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agency_payment_info_id_seq OWNER TO postgres;

--
-- Name: agency_payment_info_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agency_payment_info_id_seq OWNED BY public.agency_payment_info.id;


--
-- Name: brand_campaign_application_from_agency; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brand_campaign_application_from_agency (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    campaign_id uuid NOT NULL,
    agency_id uuid NOT NULL,
    application_status character varying(20),
    message text,
    applied_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.brand_campaign_application_from_agency OWNER TO postgres;

--
-- Name: brand_campaign_application_from_creator; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brand_campaign_application_from_creator (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    campaign_id uuid NOT NULL,
    influencer_id uuid,
    application_status character varying(20) DEFAULT 'pending'::character varying,
    message text,
    applied_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    brand_id uuid
);


ALTER TABLE public.brand_campaign_application_from_creator OWNER TO postgres;

--
-- Name: brand_campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brand_campaigns (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    status character varying(20) DEFAULT 'DRAFT'::character varying,
    budget numeric(10,2),
    target_audience text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    description_tsvector tsvector,
    target_audience_tsvector tsvector,
    name_tsvector tsvector,
    campaign_media bytea,
    brand_id uuid,
    CONSTRAINT campaigns_status_check CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'ACTIVE'::character varying, 'COMPLETED'::character varying, 'ARCHIVED'::character varying])::text[])))
);


ALTER TABLE public.brand_campaigns OWNER TO postgres;

--
-- Name: brands_auth; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brands_auth (
    brands_id uuid DEFAULT gen_random_uuid() NOT NULL,
    brands_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    country character varying(100),
    password text NOT NULL
);


ALTER TABLE public.brands_auth OWNER TO postgres;

--
-- Name: brands_information; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brands_information (
    product_categories text[],
    target_audience_age text,
    market_fit_capture text,
    turnover text,
    brands_description text,
    brands_website text,
    brands_social_media text[],
    brand_id uuid
);


ALTER TABLE public.brands_information OWNER TO postgres;

--
-- Name: campaign_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campaign_metrics (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    campaign_id uuid NOT NULL,
    impressions integer DEFAULT 0,
    clicks integer DEFAULT 0,
    conversions integer DEFAULT 0,
    spend numeric(10,2) DEFAULT 0.00,
    date_recorded date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.campaign_metrics OWNER TO postgres;

--
-- Name: creators_auth; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.creators_auth (
    full_name character varying(100) NOT NULL,
    email character varying(150),
    primaryplatform text[],
    age integer,
    gender character(1),
    country character varying(50),
    city character varying(50),
    content_lang text[],
    niches character varying(50),
    content_desc character varying(250),
    channel_links text[],
    password character varying(200) NOT NULL,
    state character varying(50),
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE public.creators_auth OWNER TO postgres;

--
-- Name: creators_channel_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.creators_channel_data (
    channel_age_youtube integer,
    avg_views_youtube integer,
    subscribers_count_youtube integer,
    content_type_youtube text,
    posts_freq_youtube text,
    live_streaming_youtube boolean,
    collab_type text,
    ig_account_name text,
    ig_account_age integer,
    ig_followers_count integer,
    avg_ig_reel_views integer,
    avg_ig_comment_count integer,
    avg_ig_likes_count integer,
    eng_rate_ig double precision,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE public.creators_channel_data OWNER TO postgres;

--
-- Name: influencer_packages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.influencer_packages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    creator_id uuid NOT NULL,
    package_type character varying(20) NOT NULL,
    price numeric(10,2) NOT NULL,
    features text NOT NULL,
    delivery_time_days integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    target_brand uuid
);


ALTER TABLE public.influencer_packages OWNER TO postgres;

--
-- Name: media_agencies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media_agencies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agency_name character varying(255),
    email character varying(255),
    password text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    phone_number character varying(20),
    website_url character varying(255),
    established_year integer,
    employee_count_range character varying(50),
    logo_url character varying(255),
    banner_url character varying(255),
    campaign_budget_min numeric(12,2),
    campaign_budget_max numeric(12,2),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.media_agencies OWNER TO postgres;

--
-- Name: media_agencies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.media_agencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.media_agencies_id_seq OWNER TO postgres;

--
-- Name: media_agencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.media_agencies_id_seq OWNED BY public.media_agencies.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_id_orderer uuid,
    agency_id_orderer uuid,
    influencer_id uuid,
    agency_id uuid,
    package_id uuid NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: portfolio_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.portfolio_media (
    id integer NOT NULL,
    project_id integer,
    media_url character varying(255) NOT NULL,
    media_type character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.portfolio_media OWNER TO postgres;

--
-- Name: portfolio_media_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.portfolio_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.portfolio_media_id_seq OWNER TO postgres;

--
-- Name: portfolio_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.portfolio_media_id_seq OWNED BY public.portfolio_media.id;


--
-- Name: portfolio_projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.portfolio_projects (
    agency_id uuid,
    campaign_name character varying(255) NOT NULL,
    client_name character varying(255),
    description text,
    results text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.portfolio_projects OWNER TO postgres;

--
-- Name: team_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.team_members (
    id integer NOT NULL,
    agency_id uuid,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    role character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.team_members OWNER TO postgres;

--
-- Name: team_members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.team_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.team_members_id_seq OWNER TO postgres;

--
-- Name: team_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.team_members_id_seq OWNED BY public.team_members.id;


--
-- Name: agency_clients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_clients ALTER COLUMN id SET DEFAULT nextval('public.agency_clients_id_seq'::regclass);


--
-- Name: agency_payment_info id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_payment_info ALTER COLUMN id SET DEFAULT nextval('public.agency_payment_info_id_seq'::regclass);


--
-- Name: portfolio_media id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portfolio_media ALTER COLUMN id SET DEFAULT nextval('public.portfolio_media_id_seq'::regclass);


--
-- Name: team_members id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members ALTER COLUMN id SET DEFAULT nextval('public.team_members_id_seq'::regclass);


--
-- Name: agency_campaign_application_from_creator agency_campaign_application_from_creator_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_campaign_application_from_creator
    ADD CONSTRAINT agency_campaign_application_from_creator_pkey PRIMARY KEY (id);


--
-- Name: agency_campaigns agency_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_campaigns
    ADD CONSTRAINT agency_campaigns_pkey PRIMARY KEY (id);


--
-- Name: agency_clients agency_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_clients
    ADD CONSTRAINT agency_clients_pkey PRIMARY KEY (id);


--
-- Name: agency_packages agency_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_packages
    ADD CONSTRAINT agency_packages_pkey PRIMARY KEY (id);


--
-- Name: agency_payment_info agency_payment_info_agency_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_payment_info
    ADD CONSTRAINT agency_payment_info_agency_id_key UNIQUE (agency_id);


--
-- Name: agency_payment_info agency_payment_info_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_payment_info
    ADD CONSTRAINT agency_payment_info_pkey PRIMARY KEY (id);


--
-- Name: brand_campaign_application_from_agency brand_campaign_application_from_agency_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_campaign_application_from_agency
    ADD CONSTRAINT brand_campaign_application_from_agency_pkey PRIMARY KEY (id);


--
-- Name: brands_auth brands_auth_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands_auth
    ADD CONSTRAINT brands_auth_email_key UNIQUE (email);


--
-- Name: brands_auth brands_auth_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands_auth
    ADD CONSTRAINT brands_auth_pkey PRIMARY KEY (brands_id);


--
-- Name: brand_campaign_application_from_creator campaign_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_campaign_application_from_creator
    ADD CONSTRAINT campaign_applications_pkey PRIMARY KEY (id);


--
-- Name: campaign_metrics campaign_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaign_metrics
    ADD CONSTRAINT campaign_metrics_pkey PRIMARY KEY (id);


--
-- Name: brand_campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: creators_auth creators_auth_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creators_auth
    ADD CONSTRAINT creators_auth_pkey PRIMARY KEY (id);


--
-- Name: creators_channel_data creators_channel_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creators_channel_data
    ADD CONSTRAINT creators_channel_data_pkey PRIMARY KEY (id);


--
-- Name: influencer_packages influencer_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.influencer_packages
    ADD CONSTRAINT influencer_packages_pkey PRIMARY KEY (id);


--
-- Name: media_agencies media_agencies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_agencies
    ADD CONSTRAINT media_agencies_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: portfolio_media portfolio_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portfolio_media
    ADD CONSTRAINT portfolio_media_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_agency_id_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_agency_id_email_key UNIQUE (agency_id, email);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: brands_information unique_brand_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands_information
    ADD CONSTRAINT unique_brand_id UNIQUE (brand_id);


--
-- Name: campaign_metrics unique_campaign_date; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaign_metrics
    ADD CONSTRAINT unique_campaign_date UNIQUE (campaign_id, date_recorded);


--
-- Name: brand_campaign_application_from_creator unique_campaign_influencer; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_campaign_application_from_creator
    ADD CONSTRAINT unique_campaign_influencer UNIQUE (campaign_id, influencer_id);


--
-- Name: idx_campaign_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_campaign_date ON public.campaign_metrics USING btree (campaign_id, date_recorded);


--
-- Name: idx_campaigns_description_tsvector; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_campaigns_description_tsvector ON public.brand_campaigns USING gin (description_tsvector);


--
-- Name: idx_campaigns_name_tsvector; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_campaigns_name_tsvector ON public.brand_campaigns USING gin (name_tsvector);


--
-- Name: idx_campaigns_target_audience_tsvector; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_campaigns_target_audience_tsvector ON public.brand_campaigns USING gin (target_audience_tsvector);


--
-- Name: idx_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dates ON public.brand_campaigns USING btree (start_date, end_date);


--
-- Name: agency_campaigns agency_campaigns_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_campaigns
    ADD CONSTRAINT agency_campaigns_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.media_agencies(id);


--
-- Name: agency_clients agency_clients_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_clients
    ADD CONSTRAINT agency_clients_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.media_agencies(id);


--
-- Name: agency_payment_info agency_payment_info_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_payment_info
    ADD CONSTRAINT agency_payment_info_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.media_agencies(id);


--
-- Name: campaign_metrics campaign_metrics_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaign_metrics
    ADD CONSTRAINT campaign_metrics_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.brand_campaigns(id);


--
-- Name: brand_campaign_application_from_creator fk_agency_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_campaign_application_from_creator
    ADD CONSTRAINT fk_agency_id FOREIGN KEY (brand_id) REFERENCES public.media_agencies(id);


--
-- Name: brand_campaign_application_from_agency fk_agency_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_campaign_application_from_agency
    ADD CONSTRAINT fk_agency_id FOREIGN KEY (agency_id) REFERENCES public.media_agencies(id);


--
-- Name: agency_packages fk_agency_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_packages
    ADD CONSTRAINT fk_agency_id FOREIGN KEY (agency_id) REFERENCES public.media_agencies(id) ON DELETE CASCADE;


--
-- Name: brands_information fk_brand; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands_information
    ADD CONSTRAINT fk_brand FOREIGN KEY (brand_id) REFERENCES public.brands_auth(brands_id) ON DELETE CASCADE;


--
-- Name: brand_campaigns fk_brand; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_campaigns
    ADD CONSTRAINT fk_brand FOREIGN KEY (brand_id) REFERENCES public.brands_auth(brands_id) ON DELETE CASCADE;


--
-- Name: brand_campaign_application_from_creator fk_campaign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_campaign_application_from_creator
    ADD CONSTRAINT fk_campaign FOREIGN KEY (campaign_id) REFERENCES public.brand_campaigns(id) ON DELETE CASCADE;


--
-- Name: brand_campaign_application_from_agency fk_campaign_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_campaign_application_from_agency
    ADD CONSTRAINT fk_campaign_id FOREIGN KEY (campaign_id) REFERENCES public.brand_campaigns(id);


--
-- Name: agency_campaign_application_from_creator fk_campaign_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_campaign_application_from_creator
    ADD CONSTRAINT fk_campaign_id FOREIGN KEY (campaign_id) REFERENCES public.agency_campaigns(id);


--
-- Name: creators_channel_data fk_creators_auth; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creators_channel_data
    ADD CONSTRAINT fk_creators_auth FOREIGN KEY (id) REFERENCES public.creators_auth(id) ON DELETE CASCADE;


--
-- Name: brand_campaign_application_from_creator fk_influencer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_campaign_application_from_creator
    ADD CONSTRAINT fk_influencer FOREIGN KEY (influencer_id) REFERENCES public.creators_auth(id) ON DELETE CASCADE;


--
-- Name: influencer_packages fk_influencer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.influencer_packages
    ADD CONSTRAINT fk_influencer FOREIGN KEY (creator_id) REFERENCES public.creators_auth(id) ON DELETE CASCADE;


--
-- Name: agency_campaign_application_from_creator fk_influencer_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_campaign_application_from_creator
    ADD CONSTRAINT fk_influencer_id FOREIGN KEY (influencer_id) REFERENCES public.creators_auth(id);


--
-- Name: orders orders_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.media_agencies(id) ON DELETE CASCADE;


--
-- Name: orders orders_agency_id_orderer_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_agency_id_orderer_fkey FOREIGN KEY (agency_id_orderer) REFERENCES public.media_agencies(id) ON DELETE SET NULL;


--
-- Name: orders orders_brand_id_orderer_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_brand_id_orderer_fkey FOREIGN KEY (brand_id_orderer) REFERENCES public.brands_auth(brands_id) ON DELETE SET NULL;


--
-- Name: orders orders_influencer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_influencer_id_fkey FOREIGN KEY (influencer_id) REFERENCES public.creators_auth(id) ON DELETE CASCADE;


--
-- Name: portfolio_projects portfolio_projects_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portfolio_projects
    ADD CONSTRAINT portfolio_projects_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.media_agencies(id);


--
-- Name: team_members team_members_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.media_agencies(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--


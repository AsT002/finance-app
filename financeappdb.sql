--
-- PostgreSQL database dump
--

-- Dumped from database version 14.12 (Homebrew)
-- Dumped by pg_dump version 14.12 (Homebrew)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

CREATE TABLE public.refreshtokens (
    id bigint NOT NULL,
    token text NOT NULL,
    created date,
    username text
);



CREATE SEQUENCE public.refreshtokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refreshtokens_id_seq OWNED BY public.refreshtokens.id;



CREATE TABLE public.users (
    user_id bigint NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    data jsonb
);


CREATE SEQUENCE public.users_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


ALTER TABLE ONLY public.refreshtokens ALTER COLUMN id SET DEFAULT nextval('public.refreshtokens_id_seq'::regclass);


ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);

COPY public.refreshtokens (id, token, created, username) FROM stdin;
\.

COPY public.users (user_id, username, password, data) FROM stdin;
\.

SELECT pg_catalog.setval('public.refreshtokens_id_seq', 1, false);

SELECT pg_catalog.setval('public.users_user_id_seq', 1, false);


ALTER TABLE ONLY public.refreshtokens
    ADD CONSTRAINT refreshtokens_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- PostgreSQL database dump complete
--


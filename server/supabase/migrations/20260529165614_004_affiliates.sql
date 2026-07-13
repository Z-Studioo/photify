-- Migration: Affiliate program (004)

CREATE OR REPLACE FUNCTION "public"."jwt_role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT COALESCE(
    NULLIF(((current_setting('request.jwt.claims', true))::json -> 'user_metadata' ->> 'role'), ''),
    NULLIF(((current_setting('request.jwt.claims', true))::json -> 'app_metadata' ->> 'role'), '')
  );
$$;

ALTER FUNCTION "public"."jwt_role"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$ SELECT public.jwt_role() = 'admin'; $$;

ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_affiliate"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$ SELECT public.jwt_role() = 'affiliate'; $$;

ALTER FUNCTION "public"."is_affiliate"() OWNER TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."jwt_role"() TO "anon", "authenticated", "service_role";
GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "anon", "authenticated", "service_role";
GRANT EXECUTE ON FUNCTION "public"."is_affiliate"() TO "anon", "authenticated", "service_role";

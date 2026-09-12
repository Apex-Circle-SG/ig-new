-- Publication is the final step of a single transaction. These guards are
-- deliberately in SQL so direct callers cannot bypass source validation.
CREATE FUNCTION public.validate_dataset_publication() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  source_version public.dataset_versions%ROWTYPE;
  distribution public.income_distributions%ROWTYPE;
  bin_count bigint;
  bin_total numeric;
  first_lower bigint;
  last_upper bigint;
  normalized_rows bigint;
BEGIN
  SELECT * INTO source_version FROM public.dataset_versions
    WHERE id = NEW.last_good_version_id AND dataset_key = NEW.dataset_key FOR UPDATE;
  IF NOT FOUND OR source_version.validation_status <> 'validated' THEN
    RAISE EXCEPTION 'Only validated dataset versions may be published' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.dataset_artifacts WHERE dataset_version_id = source_version.id) THEN
    RAISE EXCEPTION 'Published datasets require source artifact provenance' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.income_distributions WHERE source_dataset_version = source_version.id)
    AND NOT EXISTS (SELECT 1 FROM public.derived_records WHERE source_dataset_version = source_version.id) THEN
    RAISE EXCEPTION 'Published datasets require normalized records' USING ERRCODE = '23514';
  END IF;
  SELECT count(*) INTO normalized_rows FROM (
    SELECT b.ordinal FROM public.income_brackets b
      JOIN public.income_distributions d ON d.id = b.distribution_id
      WHERE d.source_dataset_version = source_version.id
    UNION ALL
    SELECT 1 FROM public.derived_records WHERE source_dataset_version = source_version.id
  ) source_rows;
  IF normalized_rows <> source_version.row_count THEN
    RAISE EXCEPTION 'Published row count must match normalized records' USING ERRCODE = '23514';
  END IF;

  FOR distribution IN SELECT * FROM public.income_distributions WHERE source_dataset_version = source_version.id LOOP
    SELECT count(*), sum(count) INTO bin_count, bin_total
      FROM public.income_brackets WHERE distribution_id = distribution.id;
    IF bin_count < 2 OR bin_total IS DISTINCT FROM distribution.total::numeric THEN
      RAISE EXCEPTION 'Income brackets must reconcile to their distribution total' USING ERRCODE = '23514';
    END IF;
    SELECT lower_bound INTO first_lower FROM public.income_brackets
      WHERE distribution_id = distribution.id ORDER BY ordinal LIMIT 1;
    SELECT upper_bound INTO last_upper FROM public.income_brackets
      WHERE distribution_id = distribution.id ORDER BY ordinal DESC LIMIT 1;
    IF first_lower IS NOT NULL OR last_upper IS NOT NULL THEN
      RAISE EXCEPTION 'Income distributions must cover both open tails' USING ERRCODE = '23514';
    END IF;
    IF EXISTS (
      SELECT 1 FROM (
        SELECT ordinal, lower_bound, upper_bound,
          row_number() OVER (ORDER BY ordinal) - 1 AS expected_ordinal,
          lag(upper_bound) OVER (ORDER BY ordinal) AS previous_upper,
          max(ordinal) OVER () AS last_ordinal
        FROM public.income_brackets WHERE distribution_id = distribution.id
      ) ordered
      WHERE ordinal <> expected_ordinal
        OR (ordinal > 0 AND (lower_bound IS NULL OR lower_bound IS DISTINCT FROM previous_upper))
        OR (ordinal < last_ordinal AND upper_bound IS NULL)
    ) THEN
      RAISE EXCEPTION 'Income brackets must be contiguous and ordered' USING ERRCODE = '23514';
    END IF;
    IF distribution.transformation_version <> source_version.transformation_version THEN
      RAISE EXCEPTION 'Income transformation must match its source version' USING ERRCODE = '23514';
    END IF;
  END LOOP;
  UPDATE public.dataset_versions SET published_at = NEW.published_at
    WHERE id = source_version.id AND published_at IS NULL;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER dataset_publications_validate BEFORE INSERT OR UPDATE ON public.dataset_publications
FOR EACH ROW EXECUTE FUNCTION public.validate_dataset_publication();
--> statement-breakpoint
CREATE FUNCTION public.protect_published_version() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF OLD.published_at IS NOT NULL THEN
    RAISE EXCEPTION 'Published dataset versions are immutable' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER dataset_versions_immutable BEFORE UPDATE OR DELETE ON public.dataset_versions
FOR EACH ROW EXECUTE FUNCTION public.protect_published_version();
--> statement-breakpoint
CREATE FUNCTION public.assert_unpublished_versions(version_ids text[]) RETURNS void
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE version_row record;
BEGIN
  -- Serialize source edits with publication, including concurrent transactions.
  FOR version_row IN SELECT published_at FROM public.dataset_versions
    WHERE id = ANY(version_ids) ORDER BY id FOR UPDATE LOOP
    IF version_row.published_at IS NOT NULL THEN
      RAISE EXCEPTION 'Published source records are immutable' USING ERRCODE = '23514';
    END IF;
  END LOOP;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION public.protect_published_distribution() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.assert_unpublished_versions(ARRAY[
    CASE WHEN TG_OP <> 'INSERT' THEN OLD.source_dataset_version END,
    CASE WHEN TG_OP <> 'DELETE' THEN NEW.source_dataset_version END
  ]);
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER income_distributions_immutable BEFORE INSERT OR UPDATE OR DELETE ON public.income_distributions
FOR EACH ROW EXECUTE FUNCTION public.protect_published_distribution();
--> statement-breakpoint
CREATE FUNCTION public.protect_published_bracket() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE version_ids text[];
BEGIN
  SELECT array_agg(source_dataset_version) INTO version_ids FROM public.income_distributions
    WHERE id = ANY(ARRAY[
      CASE WHEN TG_OP <> 'INSERT' THEN OLD.distribution_id END,
      CASE WHEN TG_OP <> 'DELETE' THEN NEW.distribution_id END
    ]);
  PERFORM public.assert_unpublished_versions(version_ids);
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER income_brackets_immutable BEFORE INSERT OR UPDATE OR DELETE ON public.income_brackets
FOR EACH ROW EXECUTE FUNCTION public.protect_published_bracket();
--> statement-breakpoint
CREATE FUNCTION public.protect_published_artifact() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.assert_unpublished_versions(ARRAY[
    CASE WHEN TG_OP <> 'INSERT' THEN OLD.dataset_version_id END,
    CASE WHEN TG_OP <> 'DELETE' THEN NEW.dataset_version_id END
  ]);
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER dataset_artifacts_immutable BEFORE INSERT OR UPDATE OR DELETE ON public.dataset_artifacts
FOR EACH ROW EXECUTE FUNCTION public.protect_published_artifact();
--> statement-breakpoint
CREATE FUNCTION public.reject_immutable_change() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  RAISE EXCEPTION 'Immutable records must be superseded, not rewritten' USING ERRCODE = '23514';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER derived_records_immutable BEFORE UPDATE OR DELETE ON public.derived_records
FOR EACH ROW EXECUTE FUNCTION public.reject_immutable_change();
--> statement-breakpoint
CREATE TRIGGER audit_logs_append_only BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.reject_immutable_change();
--> statement-breakpoint
CREATE FUNCTION public.invalidate_changed_page_approval() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.state IN ('PUBLISHED', 'MONITORING', 'RETAIN', 'REFRESH') AND NOT EXISTS (
    SELECT 1 FROM public.dataset_versions WHERE id = NEW.source_dataset_version
      AND validation_status = 'validated' AND published_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Published pages require a validated, published source version' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.approved_at IS NOT NULL AND (
    NEW.fact_object IS DISTINCT FROM OLD.fact_object
    OR NEW.source_dataset_version IS DISTINCT FROM OLD.source_dataset_version
    OR NEW.transformation_version IS DISTINCT FROM OLD.transformation_version
    OR NEW.template IS DISTINCT FROM OLD.template
    OR NEW.entity_key IS DISTINCT FROM OLD.entity_key
    OR NEW.canonical_path IS DISTINCT FROM OLD.canonical_path
  ) AND (NEW.state <> 'DRAFT' OR NEW.approved_at IS NOT NULL OR NEW.approved_by IS NOT NULL
    OR NEW.approval_batch_id IS NOT NULL OR NEW.quality_checked_at IS NOT NULL OR NEW.quality_score IS NOT NULL) THEN
    RAISE EXCEPTION 'Changed page facts require a new quality check and explicit approval' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER programmatic_pages_approval_reset BEFORE INSERT OR UPDATE ON public.programmatic_pages
FOR EACH ROW EXECUTE FUNCTION public.invalidate_changed_page_approval();
--> statement-breakpoint
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.saved_scenarios FORCE ROW LEVEL SECURITY;

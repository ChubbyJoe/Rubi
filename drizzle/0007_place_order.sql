-- Guest checkout: the only write rubi_public can make. Runs as the table
-- owner (SECURITY DEFINER, RLS not forced), so it checks everything itself:
-- prices and stock are read here, never trusted from the client, and the
-- store comes from the slug. Every name is schema qualified.
--
-- Errors (custom SQLSTATE, MESSAGE = code name, DETAIL = JSON array):
--   RB001 store_unavailable  []
--   RB002 item_unavailable   [{variant_id}]
--   RB003 price_changed      [{variant_id, current_price_kobo}]
--   RB004 out_of_stock       [{variant_id, available}]
--   RB005 invalid_input      [{field}]
-- Each error lists every failing item. Checks run in order: input, store,
-- availability, price, stock.
--
-- Lock order: the store row, then variants by id. Seller transactions that
-- lock variants must never lock the store row afterwards.
CREATE OR REPLACE FUNCTION public.place_order(
  p_store_slug text,
  p_idempotency_key uuid,
  p_customer jsonb,
  p_delivery jsonb,
  p_items jsonb
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  c_uuid constant text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
  c_e164 constant text := '^\+[1-9][0-9]{7,14}$';
  -- Same spellings as NIGERIAN_STATES and the orders CHECK.
  c_states constant text[] := ARRAY[
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
    'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
    'Yobe', 'Zamfara'
  ];
  v_name text := p_customer ->> 'name';
  v_phone text := p_customer ->> 'phone';
  v_email text := nullif(p_customer ->> 'email', '');
  v_state text := p_delivery ->> 'state';
  v_city text := p_delivery ->> 'city';
  v_address text := p_delivery ->> 'address';
  v_landmark text := nullif(p_delivery ->> 'landmark', '');
  v_note text := nullif(p_delivery ->> 'note', '');
  v_invalid jsonb := '[]'::jsonb;
  v_failed jsonb;
  v_element record;
  v_line record;
  v_variant_id text;
  v_variant_ids uuid[];
  v_quantities integer[];
  v_expected bigint[];
  v_store public.stores%ROWTYPE;
  v_existing public.orders%ROWTYPE;
  v_product_ids uuid[];
  v_number integer;
  v_customer_id uuid;
  v_order_id uuid;
  v_subtotal bigint;
BEGIN
  -- 1. Input caps.
  IF p_idempotency_key IS NULL THEN
    v_invalid := v_invalid || jsonb_build_array(jsonb_build_object('field', 'idempotency_key'));
  END IF;
  IF v_name IS NULL OR char_length(v_name) NOT BETWEEN 1 AND 100 THEN
    v_invalid := v_invalid || jsonb_build_array(jsonb_build_object('field', 'customer.name'));
  END IF;
  IF v_phone IS NULL OR v_phone !~ c_e164 THEN
    v_invalid := v_invalid || jsonb_build_array(jsonb_build_object('field', 'customer.phone'));
  END IF;
  IF char_length(v_email) > 254 THEN
    v_invalid := v_invalid || jsonb_build_array(jsonb_build_object('field', 'customer.email'));
  END IF;
  IF v_state IS NULL OR NOT (v_state = ANY (c_states)) THEN
    v_invalid := v_invalid || jsonb_build_array(jsonb_build_object('field', 'delivery.state'));
  END IF;
  IF v_city IS NULL OR char_length(v_city) NOT BETWEEN 1 AND 80 THEN
    v_invalid := v_invalid || jsonb_build_array(jsonb_build_object('field', 'delivery.city'));
  END IF;
  IF v_address IS NULL OR char_length(v_address) NOT BETWEEN 1 AND 300 THEN
    v_invalid := v_invalid || jsonb_build_array(jsonb_build_object('field', 'delivery.address'));
  END IF;
  IF char_length(v_landmark) > 150 THEN
    v_invalid := v_invalid || jsonb_build_array(jsonb_build_object('field', 'delivery.landmark'));
  END IF;
  IF char_length(v_note) > 500 THEN
    v_invalid := v_invalid || jsonb_build_array(jsonb_build_object('field', 'delivery.note'));
  END IF;

  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 50 THEN
    v_invalid := v_invalid || jsonb_build_array(jsonb_build_object('field', 'items'));
  ELSE
    FOR v_element IN
      SELECT e.value AS item, e.ordinality - 1 AS i
      FROM jsonb_array_elements(p_items) WITH ORDINALITY AS e
    LOOP
      IF jsonb_typeof(v_element.item) IS DISTINCT FROM 'object' THEN
        v_invalid := v_invalid || jsonb_build_array(jsonb_build_object('field', format('items[%s]', v_element.i)));
        CONTINUE;
      END IF;
      v_variant_id := v_element.item ->> 'variant_id';
      IF v_variant_id IS NULL OR v_variant_id !~ c_uuid THEN
        v_invalid := v_invalid || jsonb_build_array(jsonb_build_object('field', format('items[%s].variant_id', v_element.i)));
      END IF;
      IF jsonb_typeof(v_element.item -> 'quantity') IS DISTINCT FROM 'number'
        OR (v_element.item ->> 'quantity') !~ '^[0-9]{1,3}$'
        OR (v_element.item ->> 'quantity')::integer NOT BETWEEN 1 AND 999 THEN
        v_invalid := v_invalid || jsonb_build_array(jsonb_build_object('field', format('items[%s].quantity', v_element.i)));
      END IF;
      IF jsonb_typeof(v_element.item -> 'expected_unit_price_kobo') IS DISTINCT FROM 'number'
        OR (v_element.item ->> 'expected_unit_price_kobo') !~ '^[0-9]{1,15}$' THEN
        v_invalid := v_invalid || jsonb_build_array(jsonb_build_object('field', format('items[%s].expected_unit_price_kobo', v_element.i)));
      END IF;
    END LOOP;

    -- The cart merges repeated variants before submit.
    SELECT v_invalid || coalesce(jsonb_agg(jsonb_build_object('field', format('items[%s].variant_id', d.i)) ORDER BY d.i), '[]'::jsonb)
    INTO v_invalid
    FROM (
      SELECT e.ordinality - 1 AS i,
             count(*) OVER (PARTITION BY lower(e.value ->> 'variant_id')) AS n
      FROM jsonb_array_elements(p_items) WITH ORDINALITY AS e
      WHERE jsonb_typeof(e.value) = 'object' AND (e.value ->> 'variant_id') ~ c_uuid
    ) d
    WHERE d.n > 1;
  END IF;

  IF jsonb_array_length(v_invalid) > 0 THEN
    RAISE EXCEPTION USING ERRCODE = 'RB005', MESSAGE = 'invalid_input', DETAIL = v_invalid::text;
  END IF;

  SELECT array_agg((e.value ->> 'variant_id')::uuid ORDER BY e.ordinality),
         array_agg((e.value ->> 'quantity')::integer ORDER BY e.ordinality),
         array_agg((e.value ->> 'expected_unit_price_kobo')::bigint ORDER BY e.ordinality)
  INTO v_variant_ids, v_quantities, v_expected
  FROM jsonb_array_elements(p_items) WITH ORDINALITY AS e;

  -- 2. Resolve the slug (current or retired) and serialise orders per store.
  -- FOR NO KEY UPDATE does not block foreign key checks of other inserts.
  SELECT s.* INTO v_store
  FROM public.store_slugs ss
  JOIN public.stores s ON s.id = ss.store_id
  WHERE ss.slug = p_store_slug
  FOR NO KEY UPDATE OF s;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'RB001', MESSAGE = 'store_unavailable', DETAIL = '[]';
  END IF;

  -- 3. A retry returns its original order, even after unpublishing.
  SELECT o.* INTO v_existing
  FROM public.orders o
  WHERE o.store_id = v_store.id AND o.idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'order_id', v_existing.id,
      'number', v_existing.number,
      'total_kobo', v_existing.total_kobo,
      'store_id', v_store.id,
      'store_slug', v_store.slug,
      'product_ids', '[]'::jsonb,
      'existing', true
    );
  END IF;

  -- 4. Published.
  IF v_store.published_at IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'RB001', MESSAGE = 'store_unavailable', DETAIL = '[]';
  END IF;

  -- 5a. Availability: in this store, variant and product not archived.
  SELECT jsonb_agg(jsonb_build_object('variant_id', i.variant_id) ORDER BY i.ord)
  INTO v_failed
  FROM unnest(v_variant_ids) WITH ORDINALITY AS i(variant_id, ord)
  LEFT JOIN public.product_variants v
    ON v.id = i.variant_id AND v.store_id = v_store.id AND v.archived_at IS NULL
  LEFT JOIN public.products p
    ON p.id = v.product_id AND p.archived_at IS NULL
  WHERE p.id IS NULL;
  IF v_failed IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'RB002', MESSAGE = 'item_unavailable', DETAIL = v_failed::text;
  END IF;

  -- 5b. Price: the customer is charged the price they saw, or nothing.
  SELECT jsonb_agg(jsonb_build_object('variant_id', i.variant_id, 'current_price_kobo', v.price_kobo) ORDER BY i.ord)
  INTO v_failed
  FROM unnest(v_variant_ids, v_expected) WITH ORDINALITY AS i(variant_id, expected, ord)
  JOIN public.product_variants v ON v.id = i.variant_id
  WHERE v.price_kobo <> i.expected;
  IF v_failed IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'RB003', MESSAGE = 'price_changed', DETAIL = v_failed::text;
  END IF;

  -- 5c. Stock (null = not tracked).
  SELECT jsonb_agg(jsonb_build_object('variant_id', i.variant_id, 'available', v.stock) ORDER BY i.ord)
  INTO v_failed
  FROM unnest(v_variant_ids, v_quantities) WITH ORDINALITY AS i(variant_id, quantity, ord)
  JOIN public.product_variants v ON v.id = i.variant_id
  WHERE v.stock IS NOT NULL AND v.stock < i.quantity;
  IF v_failed IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'RB004', MESSAGE = 'out_of_stock', DETAIL = v_failed::text;
  END IF;

  -- Products whose public stock changes, for cache invalidation.
  SELECT coalesce(array_agg(DISTINCT v.product_id), '{}')
  INTO v_product_ids
  FROM public.product_variants v
  WHERE v.id = ANY (v_variant_ids) AND v.stock IS NOT NULL;

  -- 6. Decrement tracked stock in variant id order. Zero rows means a
  -- concurrent seller change won the race.
  FOR v_line IN
    SELECT i.variant_id, i.quantity
    FROM unnest(v_variant_ids, v_quantities) AS i(variant_id, quantity)
    ORDER BY i.variant_id
  LOOP
    UPDATE public.product_variants
    SET stock = stock - v_line.quantity
    WHERE id = v_line.variant_id AND (stock IS NULL OR stock >= v_line.quantity);
    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = 'RB004', MESSAGE = 'out_of_stock',
        DETAIL = jsonb_build_array(jsonb_build_object(
          'variant_id', v_line.variant_id,
          'available', (SELECT v.stock FROM public.product_variants v WHERE v.id = v_line.variant_id)
        ))::text;
    END IF;
  END LOOP;

  -- 7. Next order number, under the store row lock.
  UPDATE public.stores
  SET next_order_number = next_order_number + 1
  WHERE id = v_store.id
  RETURNING next_order_number - 1 INTO v_number;

  -- 8. Customer by (store, phone). A guest's phone is unverified, so an
  -- existing name and email are never overwritten.
  INSERT INTO public.customers AS c (store_id, phone, name, email)
  VALUES (v_store.id, v_phone, v_name, v_email)
  ON CONFLICT (store_id, phone) WHERE phone IS NOT NULL
  DO UPDATE SET email = coalesce(c.email, excluded.email), updated_at = now()
  RETURNING c.id INTO v_customer_id;

  -- 9. Order, snapshot lines and the placed event.
  SELECT sum(v.price_kobo * i.quantity)
  INTO v_subtotal
  FROM unnest(v_variant_ids, v_quantities) AS i(variant_id, quantity)
  JOIN public.product_variants v ON v.id = i.variant_id;

  v_order_id := public.uuid_generate_v7();

  INSERT INTO public.orders (
    id, store_id, number, idempotency_key, customer_id,
    customer_name, customer_phone, customer_email,
    delivery_state, delivery_city, delivery_address, delivery_landmark, delivery_note,
    subtotal_kobo, total_kobo
  ) VALUES (
    v_order_id, v_store.id, v_number, p_idempotency_key, v_customer_id,
    v_name, v_phone, v_email,
    v_state, v_city, v_address, v_landmark, v_note,
    v_subtotal, v_subtotal
  );

  -- variant_label is null for a default variant; Slice 5 builds it from
  -- option_values.
  INSERT INTO public.order_items (
    store_id, order_id, variant_id, product_id, product_name, variant_label, image_key,
    unit_price_kobo, quantity, line_total_kobo
  )
  SELECT v_store.id, v_order_id, v.id, p.id, p.name, NULL,
         (SELECT pi.r2_key FROM public.product_images pi
          WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1),
         v.price_kobo, i.quantity, v.price_kobo * i.quantity
  FROM unnest(v_variant_ids, v_quantities) WITH ORDINALITY AS i(variant_id, quantity, ord)
  JOIN public.product_variants v ON v.id = i.variant_id
  JOIN public.products p ON p.id = v.product_id
  ORDER BY i.ord;

  INSERT INTO public.order_events (store_id, order_id, type, actor)
  VALUES (v_store.id, v_order_id, 'placed', 'customer');

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'number', v_number,
    'total_kobo', v_subtotal,
    'store_id', v_store.id,
    'store_slug', v_store.slug,
    'product_ids', to_jsonb(v_product_ids),
    'existing', false
  );
END
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.place_order(text, uuid, jsonb, jsonb, jsonb) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.place_order(text, uuid, jsonb, jsonb, jsonb) TO rubi_public;
--> statement-breakpoint
-- Orders are records: no deletes, and history is append only. order_items
-- keeps DELETE for Slice 3 line edits.
REVOKE DELETE ON public.customers, public.orders, public.order_events FROM rubi_app;
--> statement-breakpoint
REVOKE UPDATE ON public.order_events FROM rubi_app;

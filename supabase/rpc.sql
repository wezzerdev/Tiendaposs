-- Función RPC para procesar una venta de forma atómica
-- 1. Crea el registro en sales
-- 2. Crea los registros en sale_items
-- 3. Descuenta el stock de los productos

create or replace function create_sale_transaction(
  p_organization_id uuid,
  p_customer_id uuid,
  p_profile_id uuid,
  p_total decimal,
  p_payment_method text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_sale_id uuid;
  v_item jsonb;
  v_product_stock int;
begin
  -- 1. Crear la venta
  insert into public.sales (organization_id, customer_id, profile_id, total, payment_method, status)
  values (p_organization_id, p_customer_id, p_profile_id, p_total, p_payment_method, 'completed')
  returning id into v_sale_id;

  -- 2. Procesar items
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    -- Insertar detalle
    insert into public.sale_items (sale_id, product_id, product_name, quantity, unit_price, total_price)
    values (
      v_sale_id,
      (v_item->>'product_id')::uuid,
      v_item->>'product_name',
      (v_item->>'quantity')::int,
      (v_item->>'price')::decimal,
      (v_item->>'total')::decimal
    );

    -- 3. Descontar stock (si el producto maneja stock)
    update public.products
    set stock = stock - (v_item->>'quantity')::int
    where id = (v_item->>'product_id')::uuid
    and manage_stock = true;
    
    -- Validar que no quede en negativo (opcional, por ahora permitimos y confiamos en frontend o añadimos check)
    -- En un sistema estricto, aquí lanzaríamos error si stock < 0
  end loop;

  return v_sale_id;
end;
$$;

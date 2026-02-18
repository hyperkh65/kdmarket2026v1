-- Update RLS policies to allow picker access to orders
-- Run this in Supabase SQL Editor

-- Allow pickers to read and update orders
create policy "Pickers can view assigned orders" 
on orders for select 
using (status in ('RECEIVED', 'PICKING', 'PACKING'));

create policy "Pickers can update order status" 
on orders for update 
using (status in ('RECEIVED', 'PICKING', 'PACKING'));

-- Allow pickers to update order items
create policy "Pickers can update order items" 
on order_items for update 
using (true);

-- Allow pickers to create picker events
create policy "Pickers can create events" 
on picker_events for insert 
with check (true);

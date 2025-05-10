
-- This file contains the SQL statements needed to set up the orders table in Supabase
-- Run these statements in the Supabase SQL editor

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  restaurant_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  special_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow customers to view their own orders
CREATE POLICY "Customers can view their own orders" ON public.orders
  FOR SELECT
  USING (auth.uid() = customer_id);

-- Allow customers to create orders
CREATE POLICY "Customers can create orders" ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Allow restaurants to view orders for their restaurant
CREATE POLICY "Restaurants can view their restaurant orders" ON public.orders
  FOR SELECT
  USING (auth.uid() = restaurant_id);

-- Allow restaurants to update orders for their restaurant
CREATE POLICY "Restaurants can update their restaurant orders" ON public.orders
  FOR UPDATE
  USING (auth.uid() = restaurant_id);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders (restaurant_id);

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_orders_updated_at();

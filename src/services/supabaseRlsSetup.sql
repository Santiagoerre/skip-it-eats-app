
-- RLS policies for restaurant details and locations

-- Enable RLS on restaurant_details if not already enabled
ALTER TABLE IF EXISTS public.restaurant_details ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Restaurant owners can view their own details" ON public.restaurant_details;
DROP POLICY IF EXISTS "Restaurant owners can update their own details" ON public.restaurant_details;
DROP POLICY IF EXISTS "Restaurant owners can insert their own details" ON public.restaurant_details;
DROP POLICY IF EXISTS "Anyone can view restaurant details" ON public.restaurant_details;

-- Create policies for restaurant_details
CREATE POLICY "Restaurant owners can view their own details" 
ON public.restaurant_details FOR SELECT 
USING (auth.uid() = restaurant_id);

CREATE POLICY "Restaurant owners can update their own details" 
ON public.restaurant_details FOR UPDATE 
USING (auth.uid() = restaurant_id);

CREATE POLICY "Restaurant owners can insert their own details" 
ON public.restaurant_details FOR INSERT 
WITH CHECK (auth.uid() = restaurant_id);

CREATE POLICY "Anyone can view restaurant details" 
ON public.restaurant_details FOR SELECT 
USING (true);

-- Enable RLS on restaurant_locations if not already enabled
ALTER TABLE IF EXISTS public.restaurant_locations ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Restaurant owners can view their own locations" ON public.restaurant_locations;
DROP POLICY IF EXISTS "Restaurant owners can update their own locations" ON public.restaurant_locations;
DROP POLICY IF EXISTS "Restaurant owners can insert their own locations" ON public.restaurant_locations;
DROP POLICY IF EXISTS "Anyone can view restaurant locations" ON public.restaurant_locations;

-- Create policies for restaurant_locations
CREATE POLICY "Restaurant owners can view their own locations" 
ON public.restaurant_locations FOR SELECT 
USING (auth.uid() = restaurant_id);

CREATE POLICY "Restaurant owners can update their own locations" 
ON public.restaurant_locations FOR UPDATE 
USING (auth.uid() = restaurant_id);

CREATE POLICY "Restaurant owners can insert their own locations" 
ON public.restaurant_locations FOR INSERT 
WITH CHECK (auth.uid() = restaurant_id);

CREATE POLICY "Anyone can view restaurant locations" 
ON public.restaurant_locations FOR SELECT 
USING (true);

-- Ensure the restaurant-images storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-images', 'Restaurant Images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can delete their own images" ON storage.objects;

-- Create policies for storage
CREATE POLICY "Anyone can view restaurant images"
ON storage.objects FOR SELECT
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Restaurant owners can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'restaurant-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Restaurant owners can update their own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'restaurant-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Restaurant owners can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'restaurant-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

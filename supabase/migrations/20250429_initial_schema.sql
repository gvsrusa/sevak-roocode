-- Create necessary tables for Sevak Mini Tractor Control System

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create profiles table to extend the auth.users table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tractor_data table to store tractor information
CREATE TABLE IF NOT EXISTS public.tractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT UNIQUE,
  status TEXT DEFAULT 'inactive',
  last_maintenance TIMESTAMP WITH TIME ZONE,
  next_maintenance TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_tractors table to associate users with tractors
CREATE TABLE IF NOT EXISTS public.user_tractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tractor_id UUID REFERENCES public.tractors(id) ON DELETE CASCADE,
  access_level TEXT DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, tractor_id)
);

-- Create telemetry_data table to store sensor data
CREATE TABLE IF NOT EXISTS public.telemetry_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tractor_id UUID REFERENCES public.tractors(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  data JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create alerts table to store system alerts
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tractor_id UUID REFERENCES public.tractors(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create maintenance_logs table to store maintenance records
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tractor_id UUID REFERENCES public.tractors(id) ON DELETE CASCADE,
  performed_by UUID REFERENCES public.profiles(id),
  maintenance_type TEXT NOT NULL,
  description TEXT,
  parts_replaced JSONB DEFAULT '[]'::jsonb,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create field_boundaries table to store field boundaries
CREATE TABLE IF NOT EXISTS public.field_boundaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  boundary JSONB NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create waypoints table to store navigation waypoints
CREATE TABLE IF NOT EXISTS public.waypoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  points JSONB NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sessions table to store user sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_info JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security (RLS) policies

-- Profiles table policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Tractors table policies
ALTER TABLE public.tractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tractors they have access to" 
  ON public.tractors FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tractors 
      WHERE user_tractors.tractor_id = tractors.id 
      AND user_tractors.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert tractors" 
  ON public.tractors FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update tractors" 
  ON public.tractors FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- User_tractors table policies
ALTER TABLE public.user_tractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tractor associations" 
  ON public.user_tractors FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage user-tractor associations" 
  ON public.user_tractors FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Telemetry_data table policies
ALTER TABLE public.telemetry_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view telemetry data for tractors they have access to" 
  ON public.telemetry_data FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tractors 
      WHERE user_tractors.tractor_id = telemetry_data.tractor_id 
      AND user_tractors.user_id = auth.uid()
    )
  );

-- Alerts table policies
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view alerts for tractors they have access to" 
  ON public.alerts FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tractors 
      WHERE user_tractors.tractor_id = alerts.tractor_id 
      AND user_tractors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users with operator access can resolve alerts" 
  ON public.alerts FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tractors 
      WHERE user_tractors.tractor_id = alerts.tractor_id 
      AND user_tractors.user_id = auth.uid()
      AND user_tractors.access_level IN ('operator', 'admin')
    )
  );

-- Create functions and triggers

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update profile when user is updated
CREATE OR REPLACE FUNCTION public.handle_user_update() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    full_name = COALESCE(new.raw_user_meta_data->>'full_name', profiles.full_name),
    avatar_url = COALESCE(new.raw_user_meta_data->>'avatar_url', profiles.avatar_url),
    updated_at = now()
  WHERE id = new.id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update profile when a user is updated
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_update();
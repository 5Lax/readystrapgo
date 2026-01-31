-- Create template_requests table
CREATE TABLE IF NOT EXISTS public.template_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  request_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS template_requests_user_id_idx ON public.template_requests(user_id);

-- Enable Row Level Security
ALTER TABLE public.template_requests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own requests
CREATE POLICY "Users can view own requests" ON public.template_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own requests
CREATE POLICY "Users can insert own requests" ON public.template_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

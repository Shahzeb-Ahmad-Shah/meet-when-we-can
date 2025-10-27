-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  location text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Event creators can update their events"
  ON public.events FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Event creators can delete their events"
  ON public.events FOR DELETE
  USING (auth.uid() = creator_id);

-- Create time_slots table
CREATE TABLE public.time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view time slots"
  ON public.time_slots FOR SELECT
  USING (true);

CREATE POLICY "Event creators can manage time slots"
  ON public.time_slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = time_slots.event_id
      AND events.creator_id = auth.uid()
    )
  );

-- Create phone_contacts table
CREATE TABLE public.phone_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name text,
  phone_number text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.phone_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view phone contacts"
  ON public.phone_contacts FOR SELECT
  USING (true);

CREATE POLICY "Event creators can manage phone contacts"
  ON public.phone_contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = phone_contacts.event_id
      AND events.creator_id = auth.uid()
    )
  );

-- Create event_responses table
CREATE TABLE public.event_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  time_slot_id uuid REFERENCES public.time_slots(id) ON DELETE CASCADE NOT NULL,
  user_name text NOT NULL,
  is_available boolean NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(event_id, time_slot_id, user_name)
);

ALTER TABLE public.event_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view responses"
  ON public.event_responses FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert responses"
  ON public.event_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own responses"
  ON public.event_responses FOR UPDATE
  USING (true);

-- Create messages table for chat
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_name text NOT NULL,
  message_text text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view messages"
  ON public.messages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
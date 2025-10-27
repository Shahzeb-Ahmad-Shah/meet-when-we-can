import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Plus, X, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TimeSlot {
  id: string;
  date: string;
  time: string;
}

interface PhoneContact {
  id: string;
  number: string;
  name?: string;
}

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [eventName, setEventName] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { id: "1", date: "", time: "" }
  ]);
  const [phoneContacts, setPhoneContacts] = useState<PhoneContact[]>([
    { id: "1", number: "", name: "" }
  ]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Please sign in to create events");
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { id: Date.now().toString(), date: "", time: "" }]);
  };

  const removeTimeSlot = (id: string) => {
    setTimeSlots(timeSlots.filter(slot => slot.id !== id));
  };

  const updateTimeSlot = (id: string, field: "date" | "time", value: string) => {
    setTimeSlots(timeSlots.map(slot => 
      slot.id === id ? { ...slot, [field]: value } : slot
    ));
  };

  const addPhoneContact = () => {
    setPhoneContacts([...phoneContacts, { id: Date.now().toString(), number: "", name: "" }]);
  };

  const removePhoneContact = (id: string) => {
    setPhoneContacts(phoneContacts.filter(contact => contact.id !== id));
  };

  const updatePhoneContact = (id: string, field: "number" | "name", value: string) => {
    setPhoneContacts(phoneContacts.map(contact => 
      contact.id === id ? { ...contact, [field]: value } : contact
    ));
  };

  const handleCreateEvent = async () => {
    if (!user) {
      toast.error("Please sign in to create events");
      navigate("/auth");
      return;
    }

    if (!eventName.trim()) {
      toast.error("Please enter an event name");
      return;
    }

    const filledSlots = timeSlots.filter(slot => slot.date && slot.time);
    if (filledSlots.length === 0) {
      toast.error("Please add at least one date and time");
      return;
    }

    setCreating(true);

    try {
      // Create event
      const { data: event, error: eventError } = await supabase
        .from("events")
        .insert({
          name: eventName,
          location: eventLocation || null,
          creator_id: user.id,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Create time slots
      const timeSlotsToInsert = filledSlots.map(slot => ({
        event_id: event.id,
        date: slot.date,
        time: slot.time,
      }));

      const { error: slotsError } = await supabase
        .from("time_slots")
        .insert(timeSlotsToInsert);

      if (slotsError) throw slotsError;

      // Create phone contacts
      const filledContacts = phoneContacts.filter(contact => contact.number.trim());
      if (filledContacts.length > 0) {
        const contactsToInsert = filledContacts.map(contact => ({
          event_id: event.id,
          name: contact.name || null,
          phone_number: contact.number,
        }));

        const { error: contactsError } = await supabase
          .from("phone_contacts")
          .insert(contactsToInsert);

        if (contactsError) throw contactsError;
      }

      toast.success("Event created successfully!");
      navigate(`/event/${event.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create event");
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card className="shadow-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-3xl">Create New Event</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                className="h-8 w-8"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription className="mt-1">Set up a new hangout and share it with your friends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name</Label>
              <Input
                id="eventName"
                placeholder="e.g., Weekend Brunch, Movie Night..."
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                placeholder="e.g., Central Park, My Place..."
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Invite Friends (Phone Numbers)</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPhoneContact}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </div>

              <div className="space-y-3">
                {phoneContacts.map((contact) => (
                  <div key={contact.id} className="flex gap-3 items-start">
                    <div className="flex-1 flex gap-3">
                      <div className="flex-1">
                        <Input
                          type="text"
                          placeholder="Name (optional)"
                          value={contact.name}
                          onChange={(e) => updatePhoneContact(contact.id, "name", e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="tel"
                            placeholder="+1 234 567 8900"
                            value={contact.number}
                            onChange={(e) => updatePhoneContact(contact.id, "number", e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                    {phoneContacts.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePhoneContact(contact.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Possible Dates & Times</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addTimeSlot}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>

              <div className="space-y-3">
                {timeSlots.map((slot) => (
                  <div key={slot.id} className="flex gap-3 items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="date"
                              value={slot.date}
                              onChange={(e) => updateTimeSlot(slot.id, "date", e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="time"
                              value={slot.time}
                              onChange={(e) => updateTimeSlot(slot.id, "time", e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {timeSlots.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTimeSlot(slot.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="hero" 
              size="lg" 
              className="w-full"
              onClick={handleCreateEvent}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Event & Get Link"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateEvent;

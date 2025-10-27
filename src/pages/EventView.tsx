import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, Share2, Check, X, Phone } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ChatPanel } from "@/components/ChatPanel";
import { supabase } from "@/integrations/supabase/client";

interface TimeSlot {
  id: string;
  date: string;
  time: string;
}

interface PhoneContact {
  id: string;
  name: string | null;
  phone_number: string;
}

interface Event {
  id: string;
  name: string;
  location: string | null;
  creator_id: string;
}

interface EventResponse {
  user_name: string;
  time_slot_id: string;
  is_available: boolean;
}

const EventView = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [phoneContacts, setPhoneContacts] = useState<PhoneContact[]>([]);
  const [responses, setResponses] = useState<EventResponse[]>([]);
  const [userName, setUserName] = useState("");
  const [userResponses, setUserResponses] = useState<Record<string, boolean>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();

      if (eventError) throw eventError;
      if (!eventData) {
        setEvent(null);
        setLoading(false);
        return;
      }

      setEvent(eventData);

      // Fetch time slots
      const { data: slotsData, error: slotsError } = await supabase
        .from("time_slots")
        .select("*")
        .eq("event_id", eventId)
        .order("date", { ascending: true });

      if (slotsError) throw slotsError;
      setTimeSlots(slotsData || []);

      // Fetch phone contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from("phone_contacts")
        .select("*")
        .eq("event_id", eventId);

      if (contactsError) throw contactsError;
      setPhoneContacts(contactsData || []);

      // Fetch responses
      const { data: responsesData, error: responsesError } = await supabase
        .from("event_responses")
        .select("*")
        .eq("event_id", eventId);

      if (responsesError) throw responsesError;
      setResponses(responsesData || []);

      setLoading(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to load event");
      setLoading(false);
    }
  };

  const toggleAvailability = (slotId: string) => {
    setUserResponses(prev => ({
      ...prev,
      [slotId]: !prev[slotId]
    }));
  };

  const handleSubmit = async () => {
    if (!userName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (Object.keys(userResponses).length === 0) {
      toast.error("Please mark your availability for at least one time slot");
      return;
    }

    setSubmitting(true);

    try {
      const responsesToInsert = Object.entries(userResponses).map(([slotId, isAvailable]) => ({
        event_id: eventId!,
        time_slot_id: slotId,
        user_name: userName.trim(),
        is_available: isAvailable,
      }));

      const { error } = await supabase
        .from("event_responses")
        .upsert(responsesToInsert, {
          onConflict: "event_id,time_slot_id,user_name",
        });

      if (error) throw error;

      await fetchEventData();
      setHasSubmitted(true);
      toast.success("Your availability has been submitted!");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit availability");
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getAvailabilityCount = (slotId: string) => {
    return responses.filter(r => r.time_slot_id === slotId && r.is_available).length;
  };

  const getRespondedUsers = () => {
    return [...new Set(responses.map(r => r.user_name))];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Event not found</p>
            <Button onClick={() => navigate("/")} className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-card border-border">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">{event.name}</CardTitle>
                    {event.location && (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={copyLink}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <Users className="w-4 h-4" />
                  {getRespondedUsers().length} people responded
                </CardDescription>
              </CardHeader>
            </Card>

            {phoneContacts.length > 0 && (
              <Card className="shadow-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Invited Friends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {phoneContacts.map((contact) => (
                      <div key={contact.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          {contact.name && <p className="font-medium text-sm">{contact.name}</p>}
                          <p className="text-sm text-muted-foreground">{contact.phone_number}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {!hasSubmitted ? (
              <Card className="shadow-card border-border">
                <CardHeader>
                  <CardTitle>Mark Your Availability</CardTitle>
                  <CardDescription>Select the times you're available to meet</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="userName">Your Name</Label>
                    <Input
                      id="userName"
                      placeholder="Enter your name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Available Times</Label>
                    {timeSlots.map((slot) => (
                      <div
                        key={slot.id}
                        onClick={() => toggleAvailability(slot.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          userResponses[slot.id]
                            ? "border-success bg-success/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{formatDate(slot.date)}</p>
                              <p className="text-sm text-muted-foreground">{slot.time}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="font-normal">
                              {getAvailabilityCount(slot.id)} available
                            </Badge>
                            {userResponses[slot.id] && (
                              <Check className="w-5 h-5 text-success" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button 
                    variant="hero" 
                    size="lg" 
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Availability"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-card border-border">
                <CardHeader>
                  <CardTitle>Availability Summary</CardTitle>
                  <CardDescription>See when everyone can make it</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {timeSlots.map((slot) => {
                    const count = getAvailabilityCount(slot.id);
                    const total = getRespondedUsers().length;
                    const availableUsers = responses
                      .filter(r => r.time_slot_id === slot.id && r.is_available)
                      .map(r => r.user_name);
                    const unavailableUsers = responses
                      .filter(r => r.time_slot_id === slot.id && !r.is_available)
                      .map(r => r.user_name);

                    return (
                      <div
                        key={slot.id}
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{formatDate(slot.date)}</p>
                              <p className="text-sm text-muted-foreground">{slot.time}</p>
                            </div>
                          </div>
                          <Badge 
                            variant={count === total ? "default" : "secondary"}
                            className={count === total ? "bg-success" : ""}
                          >
                            {count}/{total} available
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {availableUsers.length > 0 && (
                            <div className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-success mt-0.5" />
                              <p className="text-sm text-muted-foreground flex-1">
                                {availableUsers.join(", ")}
                              </p>
                            </div>
                          )}
                          {unavailableUsers.length > 0 && (
                            <div className="flex items-start gap-2">
                              <X className="w-4 h-4 text-destructive mt-0.5" />
                              <p className="text-sm text-muted-foreground flex-1">
                                {unavailableUsers.join(", ")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <ChatPanel eventId={eventId || ""} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventView;

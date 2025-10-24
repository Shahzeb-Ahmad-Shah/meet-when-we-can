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

interface Event {
  id: string;
  name: string;
  location: string;
  timeSlots: TimeSlot[];
  phoneContacts?: PhoneContact[];
  responses: Record<string, Record<string, boolean>>;
}

const EventView = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [userName, setUserName] = useState("");
  const [userResponses, setUserResponses] = useState<Record<string, boolean>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (eventId) {
      const storedEvent = localStorage.getItem(`event_${eventId}`);
      if (storedEvent) {
        setEvent(JSON.parse(storedEvent));
      }
    }
  }, [eventId]);

  const toggleAvailability = (slotId: string) => {
    setUserResponses(prev => ({
      ...prev,
      [slotId]: !prev[slotId]
    }));
  };

  const handleSubmit = () => {
    if (!userName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (Object.keys(userResponses).length === 0) {
      toast.error("Please mark your availability for at least one time slot");
      return;
    }

    if (event && eventId) {
      const updatedEvent = {
        ...event,
        responses: {
          ...event.responses,
          [userName]: userResponses
        }
      };
      
      localStorage.setItem(`event_${eventId}`, JSON.stringify(updatedEvent));
      setEvent(updatedEvent);
      setHasSubmitted(true);
      toast.success("Your availability has been submitted!");
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
    if (!event) return 0;
    return Object.values(event.responses).filter(response => response[slotId]).length;
  };

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
        <div className="grid lg:grid-cols-3 gap-6">{/* Main content - 2 columns */}
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
                  {Object.keys(event.responses).length} people responded
                </CardDescription>
              </CardHeader>
            </Card>

            {event.phoneContacts && event.phoneContacts.length > 0 && (
              <Card className="shadow-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Invited Friends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {event.phoneContacts.map((contact) => (
                      <div key={contact.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          {contact.name && <p className="font-medium text-sm">{contact.name}</p>}
                          <p className="text-sm text-muted-foreground">{contact.number}</p>
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
                    {event.timeSlots.map((slot) => (
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
                  >
                    Submit Availability
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
                  {event.timeSlots.map((slot) => {
                    const count = getAvailabilityCount(slot.id);
                    const total = Object.keys(event.responses).length;
                    const availableUsers = Object.entries(event.responses)
                      .filter(([_, responses]) => responses[slot.id])
                      .map(([name]) => name);
                    const unavailableUsers = Object.entries(event.responses)
                      .filter(([_, responses]) => !responses[slot.id])
                      .map(([name]) => name);

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

          {/* Chat sidebar - 1 column */}
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

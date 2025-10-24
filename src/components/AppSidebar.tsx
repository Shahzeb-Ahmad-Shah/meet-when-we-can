import { Calendar, Users, CheckCircle, Clock } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";

interface Event {
  id: string;
  name: string;
  location: string;
  timeSlots: Array<{ id: string; date: string; time: string }>;
  responses: Record<string, Record<string, boolean>>;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const [events, setEvents] = useState<Event[]>([]);
  const isCollapsed = state === "collapsed";

  useEffect(() => {
    // Load all events from localStorage
    const loadEvents = () => {
      const allEvents: Event[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("event_")) {
          const event = JSON.parse(localStorage.getItem(key) || "{}");
          allEvents.push(event);
        }
      }
      setEvents(allEvents);
    };

    loadEvents();
    // Refresh events when location changes
    const interval = setInterval(loadEvents, 1000);
    return () => clearInterval(interval);
  }, [location]);

  const getEventStatus = (event: Event) => {
    const totalResponses = Object.keys(event.responses).length;
    if (totalResponses === 0) return { icon: Clock, color: "text-muted-foreground", text: "No responses" };
    
    // Check if all responses agree on at least one time slot
    const hasConsensus = event.timeSlots.some(slot => {
      const availableCount = Object.values(event.responses).filter(r => r[slot.id]).length;
      return availableCount === totalResponses && totalResponses > 0;
    });

    if (hasConsensus) {
      return { icon: CheckCircle, color: "text-success", text: `${totalResponses} confirmed` };
    }

    return { icon: Users, color: "text-primary", text: `${totalResponses} responded` };
  };

  return (
    <Sidebar
      className={isCollapsed ? "w-14" : "w-72"}
      collapsible="icon"
    >
      <div className="p-4 border-b">
        {!isCollapsed && <h2 className="text-lg font-semibold">MeetUp</h2>}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            {!isCollapsed && "Your Events"}
            <SidebarTrigger className="ml-auto" />
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/" 
                    end 
                    className={({ isActive }) =>
                      isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"
                    }
                  >
                    <Calendar className="w-4 h-4" />
                    {!isCollapsed && <span>Home</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {events.length === 0 && !isCollapsed && (
                <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                  No events yet. Create one to get started!
                </div>
              )}

              {events.map((event) => {
                const status = getEventStatus(event);
                const StatusIcon = status.icon;
                const isActive = location.pathname === `/event/${event.id}`;

                return (
                  <SidebarMenuItem key={event.id}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={`/event/${event.id}`}
                        className={
                          isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"
                        }
                      >
                        <StatusIcon className={`w-4 h-4 ${status.color}`} />
                        {!isCollapsed && (
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{event.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {status.text}
                            </div>
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

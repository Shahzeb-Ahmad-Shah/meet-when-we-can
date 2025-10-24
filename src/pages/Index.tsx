import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Meet Up Made Easy
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Coordinate with friends effortlessly. Pick dates, share availability, and find the perfect time to hang out.
          </p>
          <Button 
            variant="hero" 
            size="lg"
            onClick={() => navigate("/create")}
            className="text-lg px-8 py-6"
          >
            Create Your First Event
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <FeatureCard 
            icon={<Calendar className="w-8 h-8" />}
            title="Pick Dates"
            description="Suggest multiple dates and times that work for you"
          />
          <FeatureCard 
            icon={<Users className="w-8 h-8" />}
            title="Invite Friends"
            description="Share a simple link with your group"
          />
          <FeatureCard 
            icon={<Clock className="w-8 h-8" />}
            title="Mark Availability"
            description="Everyone marks when they're free"
          />
          <FeatureCard 
            icon={<CheckCircle2 className="w-8 h-8" />}
            title="Find Time"
            description="See when everyone can make it"
          />
        </div>
      </div>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="bg-card rounded-xl p-6 shadow-card hover:shadow-glow transition-all duration-300 border border-border">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
};

export default Index;

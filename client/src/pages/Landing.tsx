import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InstallPrompt } from "@/components/InstallPrompt";
import { getLoginUrl } from "@/const";
import { BarChart3, Calendar, TrendingUp, Dumbbell, Target, Share2 } from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: <Dumbbell className="w-8 h-8" />,
      title: "Track Every Set",
      description: "Log sets, reps, and weight with precision. Build your workout history one rep at a time."
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Visual Calendar",
      description: "See your workout consistency at a glance. Never miss a training day again."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Progress Charts",
      description: "Track strength gains and body measurements over time with detailed analytics."
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Custom Exercises",
      description: "Add your own exercises beyond the preset library. Make FlexTab work for your routine."
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Body Measurements",
      description: "Track weight, chest, waist, arms, and thighs. See how your body transforms."
    },
    {
      icon: <Share2 className="w-8 h-8" />,
      title: "Share Progress",
      description: "Export workout summaries as text or images. Share your gains with the world."
    }
  ];

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(to bottom right, #F7F5F2, #F3F1EE)'}}>
      {/* PWA Install Prompt Banner */}
      <InstallPrompt />
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm" style={{borderBottom: '1px solid #E6E4E1'}}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/flextab-logo.png?v=2" alt="FlexTab" className="h-8 w-auto" />
            <h1 className="text-2xl font-bold tracking-tight" style={{fontFamily: 'Satoshi, sans-serif'}}>
              flextab
            </h1>
          </div>
          <Button 
            onClick={() => window.location.href = getLoginUrl()}
            className="bg-slate-800 hover:bg-slate-900 text-white"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6" style={{color: '#0B0B0C'}}>
            Track Your Fitness
            <br />
            <span style={{color: '#1F2937'}}>With Precision</span>
          </h2>
          <p className="text-xl md:text-2xl mb-8" style={{color: '#6B6F76', maxWidth: '600px', margin: '0 auto 2rem'}}>
            A professional workout tracking tool for serious lifters. Log sets, track progress, and hit your goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => window.location.href = getLoginUrl()}
              size="lg"
              className="bg-slate-800 hover:bg-slate-900 text-white text-lg px-8 py-6"
            >
              Get Started Free
            </Button>
            <Button 
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-slate-300 text-slate-800 text-lg px-8 py-6"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{color: '#0B0B0C'}}>
            Everything You Need
          </h3>
          <p className="text-lg text-center mb-12" style={{color: '#6B6F76'}}>
            Built for lifters who take their training seriously
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="p-6 bg-white border-slate-200 hover:shadow-lg transition-shadow"
              >
                <div className="mb-4 text-slate-800">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold mb-2" style={{color: '#0B0B0C'}}>
                  {feature.title}
                </h4>
                <p style={{color: '#6B6F76'}}>
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 bg-white border-slate-200 text-center">
            <h3 className="text-3xl md:text-4xl font-bold mb-4" style={{color: '#0B0B0C'}}>
              Ready to Track Your Progress?
            </h3>
            <p className="text-lg mb-8" style={{color: '#6B6F76'}}>
              Join FlexTab today and take control of your fitness journey
            </p>
            <Button 
              onClick={() => window.location.href = getLoginUrl()}
              size="lg"
              className="bg-slate-800 hover:bg-slate-900 text-white text-lg px-8 py-6"
            >
              Start Tracking Now
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{borderColor: '#E6E4E1'}}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/flextab-logo.png?v=2" alt="FlexTab" className="h-6 w-auto" />
              <span className="font-bold" style={{fontFamily: 'Satoshi, sans-serif', color: '#0B0B0C'}}>
                flextab
              </span>
            </div>
            <p style={{color: '#6B6F76'}}>
              © 2026 FlexTab. Track your fitness with precision.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

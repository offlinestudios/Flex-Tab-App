import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InstallPrompt } from "@/components/InstallPrompt";
import { IOSInstallPrompt } from "@/components/IOSInstallPrompt";
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
      <IOSInstallPrompt />
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

      {/* Hero Section with Athlete Image */}
      <section className="relative h-[600px] md:h-[700px] overflow-hidden">
        <img 
          src="/images/athlete-hero.jpg" 
          alt="Athlete training with intensity" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl">
            <h2 className="text-5xl md:text-7xl font-extrabold mb-6 text-white tracking-tight">
              Track Your Fitness
              <br />
              <span className="text-slate-200">With Precision</span>
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed">
              A professional workout tracking tool for serious lifters. Log sets, track progress, and hit your goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => window.location.href = getLoginUrl()}
                size="lg"
                className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 py-6 font-semibold shadow-xl"
              >
                Get Started Free
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6 font-semibold"
              >
                Learn More
              </Button>
            </div>
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
                className="p-6 bg-white border-slate-200 hover:shadow-xl transition-all transform hover:-translate-y-1"
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

      {/* CTA Section with Athlete Background */}
      <section className="relative h-[400px] overflow-hidden">
        <img 
          src="/images/athlete-legs.jpg" 
          alt="Athlete performing squats" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative container mx-auto px-4 h-full flex items-center justify-center">
          <div className="max-w-3xl text-center">
            <h3 className="text-4xl md:text-5xl font-extrabold mb-6 text-white tracking-tight">
              Ready to Track Your Progress?
            </h3>
            <p className="text-xl mb-8 text-white/90">
              Join FlexTab today and take control of your fitness journey
            </p>
            <Button 
              onClick={() => window.location.href = getLoginUrl()}
              size="lg"
              className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-10 py-6 font-semibold shadow-xl"
            >
              Start Tracking Now
            </Button>
          </div>
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

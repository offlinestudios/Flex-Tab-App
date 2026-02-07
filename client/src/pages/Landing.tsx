import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InstallPrompt } from "@/components/InstallPrompt";
import { IOSInstallPrompt } from "@/components/IOSInstallPrompt";
import { getLoginUrl } from "@/const";
import { useEffect, useRef, useState } from "react";

export default function Landing() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const featureCards = [
    {
      id: 0,
      image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/sUWhtLsscxMXAbBm.png",
      title: "Start by tracking.",
      description: "The way you improve is by logging every set. FlexTab works with your phone to track your workouts and visualize your progress over time."
    },
    {
      id: 1,
      image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/ZQcZJelIDPISaKrs.png",
      title: "Review your history.",
      description: "See every workout you've logged. Compare current performance to past sessions and identify patterns in your training."
    },
    {
      id: 2,
      image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/NfNzRYszCpliWVqV.png",
      title: "Analyze your progress.",
      description: "Track strength gains with detailed charts. See how your lifts improve week over week with visual analytics."
    }
  ];

  useEffect(() => {
    // Trigger initial load animations
    setIsLoaded(true);

    // Set up intersection observer for scroll animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-visible');
          }
        });
      },
      { threshold: 0.2 }
    );

    // Observe all fade-in elements
    const fadeElements = document.querySelectorAll('.fade-in-on-scroll');
    fadeElements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const handleDotClick = (index: number) => {
    setActiveCard(index);
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      {/* PWA Install Prompts */}
      <InstallPrompt />
      <IOSInstallPrompt />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E6E4E1]">
        <div className="container mx-auto px-5 md:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/flextab-logo.png?v=2" alt="FlexTab" className="h-8 w-auto" />
            <h1 className="text-2xl font-bold tracking-tight text-[#0B0B0C]">
              flextab
            </h1>
          </div>
          <Button 
            onClick={() => window.location.href = getLoginUrl()}
            className="bg-[#111827] hover:bg-[#1F2937] text-white px-6 py-2 rounded-lg font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section - Full Width Banner with Left-Aligned Content */}
      <section className="relative bg-[#1F2937] overflow-hidden min-h-[600px] md:min-h-[700px] flex items-center">
        {/* Full-width banner background photo */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/JfZFeFNwdWYiOfDR.jpg')`,
            backgroundPosition: 'center 30%'
          }}
        />
        
        <div className="relative container mx-auto px-5 md:px-10 py-16 md:py-24">
          <div className="max-w-2xl">
            <h2 
              className={`text-[44px] md:text-[64px] font-bold leading-[1.1] mb-6 tracking-tight text-white transition-all duration-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
              style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              Track Your Fitness
              <br />
              With Precision
            </h2>
            <p 
              className={`text-[18px] md:text-[22px] leading-[1.6] mb-10 text-white/90 transition-all duration-400 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
              style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              A professional workout tracking tool for serious lifters. Log sets, track progress, and hit your goals.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => window.location.href = getLoginUrl()}
                className={`bg-white hover:bg-gray-100 text-[#111827] px-8 py-4 h-14 rounded-lg text-lg font-semibold transition-all duration-150 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                Get Started Free
              </Button>
              <Button 
                onClick={() => {
                  document.getElementById('feature-explanation')?.scrollIntoView({ behavior: 'smooth' });
                }}
                variant="outline"
                className={`bg-transparent hover:bg-white/10 text-white border-2 border-white px-8 py-4 h-14 rounded-lg text-lg font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Explanation Carousel (Strava-style) */}
      <section id="feature-explanation" className="bg-white">
        <div className="container mx-auto px-5 md:px-10 py-20 md:py-32">
          <div className="max-w-2xl mx-auto">
            {/* Carousel Container */}
            <div className="relative overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${activeCard * 100}%)` }}
              >
                {featureCards.map((card) => (
                  <div key={card.id} className="w-full flex-shrink-0">
                    <Card className="bg-white border border-[#E6E4E1] rounded-2xl overflow-hidden shadow-lg">
                      {/* App Screenshot */}
                      <div className="relative bg-[#F7F5F2] p-6 flex items-center justify-center min-h-[500px]">
                        <img 
                          src={card.image}
                          alt={`FlexTab ${card.title}`}
                          className="max-w-full h-auto max-h-[480px] rounded-xl shadow-xl"
                        />
                      </div>

                      {/* Text Content */}
                      <div className="p-8 text-center">
                        <h3 className="text-[28px] md:text-[32px] font-bold leading-[1.2] mb-4 text-[#0B0B0C]">
                          {card.title}
                        </h3>
                        <p className="text-[16px] md:text-[18px] leading-[1.6] text-[#6B6F76]">
                          {card.description}
                        </p>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {featureCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleDotClick(card.id)}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    activeCard === card.id ? 'bg-[#0B0B0C]' : 'bg-[#E6E4E1]'
                  }`}
                  aria-label={`Go to slide ${card.id + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Value Proposition Section */}
      <section className="bg-[#F7F5F2]">
        <div className="container mx-auto px-5 md:px-10 py-20 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left: Athlete Photo */}
            <div className="fade-in-on-scroll order-2 md:order-1">
              <img 
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/aLKEmQTdFhQzOzgb.jpg"
                alt="Athlete performing bench press"
                className="w-full h-auto rounded-xl shadow-lg"
                loading="lazy"
              />
            </div>

            {/* Right: Copy */}
            <div className="fade-in-on-scroll order-1 md:order-2">
              <h3 className="text-[32px] md:text-[40px] font-bold leading-[1.2] mb-5 text-[#0B0B0C] tracking-tight">
                Progressive overload, made visible
              </h3>
              <p className="text-[18px] md:text-[20px] leading-[1.5] mb-6 text-[#6B6F76]">
                Every set logged. Every PR tracked. Every week compared. See your strength gains visualized in real-time charts.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#111827] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[16px] md:text-[18px] text-[#6B6F76]">Track volume, reps, and weight across all exercises</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#111827] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[16px] md:text-[18px] text-[#6B6F76]">Visualize progress with weekly and monthly charts</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#111827] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[16px] md:text-[18px] text-[#6B6F76]">Compare current performance to past workouts</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Proof Section */}
      <section className="bg-white">
        <div className="container mx-auto px-5 md:px-10 py-20 md:py-32">
          <div className="text-center mb-16">
            <h3 className="fade-in-on-scroll text-[32px] md:text-[40px] font-bold leading-[1.2] mb-4 text-[#0B0B0C] tracking-tight">
              Everything you need to train smarter
            </h3>
            <p className="fade-in-on-scroll text-[18px] md:text-[20px] text-[#6B6F76] max-w-2xl mx-auto">
              Built for lifters who take training seriously
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <Card className="fade-in-on-scroll p-8 bg-[#F7F5F2] border-none rounded-xl">
              <div className="w-12 h-12 bg-[#111827] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h4 className="text-[20px] font-bold mb-3 text-[#0B0B0C]">Custom Exercise Library</h4>
              <p className="text-[16px] leading-[1.6] text-[#6B6F76]">
                Add any exercise. Track any movement. Build your perfect workout routine.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="fade-in-on-scroll p-8 bg-[#F7F5F2] border-none rounded-xl">
              <div className="w-12 h-12 bg-[#111827] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-[20px] font-bold mb-3 text-[#0B0B0C]">Body Measurements</h4>
              <p className="text-[16px] leading-[1.6] text-[#6B6F76]">
                Track weight, chest, waist, arms, and legs. See physical changes over time.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="fade-in-on-scroll p-8 bg-[#F7F5F2] border-none rounded-xl">
              <div className="w-12 h-12 bg-[#111827] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-[20px] font-bold mb-3 text-[#0B0B0C]">Workout History</h4>
              <p className="text-[16px] leading-[1.6] text-[#6B6F76]">
                Review past sessions. Identify patterns. Never repeat a bad workout.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Training Philosophy Section */}
      <section className="relative bg-[#1F2937] overflow-hidden">
        {/* Background photo */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url('https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/irKQQAnhGsKossSs.jpg')`,
            backgroundPosition: 'center'
          }}
        />
        
        <div className="relative container mx-auto px-5 md:px-10 py-20 md:py-32 text-center">
          <h3 className="fade-in-on-scroll text-[32px] md:text-[40px] font-bold leading-[1.2] mb-6 text-white tracking-tight max-w-3xl mx-auto">
            Built for lifters who track every rep
          </h3>
          <p className="fade-in-on-scroll text-[18px] md:text-[20px] leading-[1.6] text-white/90 mb-10 max-w-2xl mx-auto">
            Progressive overload isn't a theory. It's a practice. FlexTab gives you the tools to make it measurable.
          </p>
          <Button 
            onClick={() => window.location.href = getLoginUrl()}
            className="fade-in-on-scroll bg-white hover:bg-gray-100 text-[#111827] px-8 py-4 h-14 rounded-lg text-lg font-semibold transition-all duration-150 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
          >
            Start tracking free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E6E4E1]">
        <div className="container mx-auto px-5 md:px-10 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/flextab-logo.png?v=2" alt="FlexTab" className="h-8 w-auto" />
              <span className="text-xl font-bold text-[#0B0B0C]">flextab</span>
            </div>
            <p className="text-sm text-[#6B6F76]">
              © 2026 FlexTab. Built for serious lifters.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        .fade-in-on-scroll {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 400ms cubic-bezier(0.16, 1, 0.3, 1), 
                      transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .fade-in-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}

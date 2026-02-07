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
      title: "Start by logging.",
      description: "The way you improve is by tracking every set. FlexTab works with your phone to record your workouts and visualize your progress over time."
    },
    {
      id: 1,
      image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/ZQcZJelIDPISaKrs.png",
      title: "Compare your sessions.",
      description: "See every workout you've logged. Compare current performance to past sessions and identify patterns in your training."
    },
    {
      id: 2,
      image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/NfNzRYszCpliWVqV.png",
      title: "Watch yourself improve.",
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

      {/* Feature Screenshot - Full Viewport */}
      <section id="feature-explanation" className="w-full min-h-screen flex items-center justify-center bg-white">
        {/* Desktop: Show only first card full-width */}
        <div className="hidden md:block w-full h-screen">
          <img 
            src={featureCards[0].image}
            alt={`FlexTab ${featureCards[0].title}`}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Mobile: Show carousel with all cards */}
        <div className="md:hidden w-full">
          {/* Carousel Container */}
          <div className="relative overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeCard * 100}%)` }}
            >
              {featureCards.map((card) => (
                <div key={card.id} className="w-full flex-shrink-0">
                  <div className="space-y-8 p-5">
                    {/* App Screenshot - Full Bleed */}
                    <div className="relative w-full flex items-center justify-center">
                      <img 
                        src={card.image}
                        alt={`FlexTab ${card.title}`}
                        className="w-full h-auto shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl"
                      />
                    </div>

                    {/* Text Content */}
                    <div className="text-center">
                      <h3 className="text-[28px] font-bold leading-[1.2] mb-4 text-[#0891B2]">
                        {card.title}
                      </h3>
                      <p className="text-[16px] leading-[1.6] text-[#6B6F76]">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel Dots - Mobile Only */}
          <div className="flex justify-center gap-2 mt-6 pb-8">
            {featureCards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleDotClick(card.id)}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  activeCard === card.id ? 'bg-[#0891B2]' : 'bg-[#E6E4E1]'
                }`}
                aria-label={`Go to slide ${card.id + 1}`}
              />
            ))}
          </div>
        </div>
      </section>



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

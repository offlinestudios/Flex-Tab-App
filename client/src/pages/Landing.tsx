import { Button } from "@/components/ui/button";
import { InstallPrompt } from "@/components/InstallPrompt";
import { IOSInstallPrompt } from "@/components/IOSInstallPrompt";
import { getLoginUrl } from "@/const";
import { useEffect, useState } from "react";

export default function Landing() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const screenshots = [
    {
      url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/sUWhtLsscxMXAbBm.png",
      alt: "Active workout tracking",
      title: "Log every set in real-time.",
      description: "Track sets, reps, and weight with a simple interface. No complex forms—just tap and log."
    },
    {
      url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/ZQcZJelIDPISaKrs.png",
      alt: "Workout history",
      title: "Review your complete workout history.",
      description: "See every workout session at a glance. Compare performance and spot trends instantly."
    },
    {
      url: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/NfNzRYszCpliWVqV.png",
      alt: "Progress charts",
      title: "Track strength gains over time.",
      description: "Visual charts show your progress. Watch yourself get stronger week after week."
    }
  ];

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentSlide < screenshots.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
    if (isRightSwipe && currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* PWA Install Prompts */}
      <InstallPrompt />
      <IOSInstallPrompt />

      {/* DESKTOP: Fixed Landing Page (hidden on mobile) */}
      <div className="hidden md:block fixed inset-0 overflow-hidden">
        {/* Background Image - Full Viewport */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/JfZFeFNwdWYiOfDR.jpg')`,
            backgroundPosition: 'center center',
            transform: isLoaded ? 'scale(1.02)' : 'scale(1)',
            transition: 'transform 8s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />

        {/* White Header - Overlay */}
        <header className="absolute top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-b border-[#E6E4E1]">
          <div className="container mx-auto px-12 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/flextab-logo.png?v=2" alt="FlexTab" className="h-10 w-auto" />
              <h1 className="text-2xl font-bold tracking-tight text-[#0B0B0C]">
                flextab
              </h1>
            </div>
            <Button 
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-[#111827] hover:bg-[#1F2937] text-white px-8 py-3 rounded-lg font-semibold transition-all duration-150"
            >
              Sign In
            </Button>
          </div>
        </header>

        {/* Hero Content - Centered Between Header and Footer */}
        <div className="absolute top-[88px] bottom-[340px] left-0 right-0 flex items-center z-10">
          <div className="container mx-auto px-12">
            <div className="max-w-2xl">
              <h2 className="text-7xl font-bold leading-tight mb-6 tracking-tight text-white">
                Track Your
                <br />
                Fitness
                <br />
                With Precision
              </h2>
              <p className="text-2xl leading-relaxed text-white/90 mb-10">
                A professional workout tracking tool for serious lifters. Log sets, track progress, and hit your goals.
              </p>
              
              <div className="flex gap-4">
                <Button 
                  onClick={() => window.location.href = getLoginUrl()}
                  className="bg-white hover:bg-gray-100 text-[#111827] px-10 py-6 rounded-xl font-bold text-lg transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-xl"
                >
                  Get Started Free
                </Button>
                <Button 
                  onClick={() => window.location.href = getLoginUrl()}
                  className="bg-transparent hover:bg-white/10 text-white border-2 border-white/50 hover:border-white px-10 py-6 rounded-xl font-bold text-lg transition-all duration-150"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Overlay */}
        <footer className="absolute bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-t border-[#E6E4E1]">
          <div className="container mx-auto px-12 py-12">
            {/* Main Footer Content */}
            <div className="grid grid-cols-3 gap-16 mb-12">
              {/* Brand Column */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <img src="/flextab-logo.png?v=2" alt="FlexTab" className="h-8 w-auto" />
                  <h3 className="text-xl font-bold tracking-tight text-[#0B0B0C]">
                    flextab
                  </h3>
                </div>
                <p className="text-sm text-[#6B6F76] leading-relaxed">
                  The workout tracker built for serious lifters. Track every set, visualize progress, and hit new PRs.
                </p>
              </div>

              {/* Product Column */}
              <div>
                <h4 className="text-xs font-bold text-[#0B0B0C] uppercase tracking-wider mb-4">
                  Product
                </h4>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-sm text-[#6B6F76] hover:text-[#0891B2] transition-colors">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-[#6B6F76] hover:text-[#0891B2] transition-colors">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href={getLoginUrl()} className="text-sm text-[#6B6F76] hover:text-[#0891B2] transition-colors">
                      Sign In
                    </a>
                  </li>
                </ul>
              </div>

              {/* Legal Column */}
              <div>
                <h4 className="text-xs font-bold text-[#0B0B0C] uppercase tracking-wider mb-4">
                  Legal
                </h4>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-sm text-[#6B6F76] hover:text-[#0891B2] transition-colors">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-[#6B6F76] hover:text-[#0891B2] transition-colors">
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-[#6B6F76] hover:text-[#0891B2] transition-colors">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Copyright */}
            <div className="pt-8 border-t border-[#E6E4E1]">
              <p className="text-sm text-[#6B6F76] text-center">
                © 2026 FlexTab. Built for serious lifters.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* MOBILE: Scrolling Landing Page (hidden on desktop) */}
      <div className="block md:hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E6E4E1]">
          <div className="container mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/flextab-logo.png?v=2" alt="FlexTab" className="h-9 w-auto" />
              <h1 className="text-2xl font-bold tracking-tight text-[#0B0B0C]">
                flextab
              </h1>
            </div>
            <Button 
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-[#111827] hover:bg-[#1F2937] text-white px-6 py-2.5 rounded-lg font-semibold"
            >
              Sign In
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative bg-[#1F2937] overflow-hidden min-h-[600px] flex items-center">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/JfZFeFNwdWYiOfDR.jpg')`,
              backgroundPosition: 'center 30%',
            }}
          />
          
          <div className="relative container mx-auto px-6 py-20">
            <div className="max-w-2xl">
              <h2 className="text-5xl font-bold leading-tight mb-6 tracking-tight text-white">
                Track Your
                <br />
                Fitness
                <br />
                With Precision
              </h2>
              <p className="text-xl leading-relaxed text-white/90 mb-8">
                The workout tracker built for serious lifters. Log every set, visualize progress, and hit new PRs faster.
              </p>
              
              <div className="flex flex-col gap-4">
                <Button 
                  onClick={() => window.location.href = getLoginUrl()}
                  className="w-full bg-white hover:bg-gray-100 text-[#111827] px-8 py-6 rounded-xl font-bold text-lg shadow-xl"
                >
                  Get started free — no credit card
                </Button>
                <button 
                  onClick={() => window.location.href = getLoginUrl()}
                  className="text-white/90 hover:text-white font-semibold py-3 transition-colors border-2 border-white/30 hover:border-white/50 rounded-xl"
                >
                  See how it works
                </button>
              </div>
            </div>
          </div>
          
          {/* Animated Scroll Arrow */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
            <a 
              href="#who-we-are"
              className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors group"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('who-we-are')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <svg 
                className="w-6 h-6 animate-bounce"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 9l-7 7-7-7" 
                />
              </svg>
            </a>
          </div>
        </section>

        {/* Who We Are Section */}
        <section id="who-we-are" className="bg-white py-16">
          <div className="container mx-auto px-6">
            <h3 className="text-xs font-bold text-[#6B6F76] uppercase tracking-wider text-center mb-6">
              Who We Are
            </h3>
            <p className="text-lg leading-relaxed text-[#0B0B0C] text-center max-w-2xl mx-auto">
              If you're serious about lifting, FlexTab was made for you. Our mobile app enhances the experience of strength training and connects lifters from around the world. We're the workout tracker built for progress, precision, and PRs.
            </p>
          </div>
        </section>

        {/* Unified Feature Card with Swipeable Carousel */}
        <section className="bg-white py-8">
          <div className="container mx-auto px-6">
            <div className="space-y-4">
              {/* Swipeable Screenshot Carousel */}
              <div 
                className="relative overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div 
                  className="flex transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {screenshots.map((screenshot, index) => (
                    <div key={index} className="w-full flex-shrink-0 flex items-center justify-center">
                      <img 
                        src={screenshot.url}
                        alt={screenshot.alt}
                        className="w-full max-w-[200px] h-auto rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.12)] border-[6px] border-[#1F2937]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Carousel Dots */}
              <div className="flex items-center justify-center gap-2">
                {screenshots.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                      index === currentSlide 
                        ? 'bg-[#1F2937]' 
                        : 'bg-[#E6E4E1] hover:bg-[#6B6F76]'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Dynamic Title and Description with Fade Transition */}
              <div className="text-center px-4">
                <h3 
                  key={`title-${currentSlide}`}
                  className="text-2xl font-bold leading-tight text-[#0B0B0C] tracking-tight mb-3 animate-fade-in"
                >
                  {screenshots[currentSlide].title}
                </h3>
                <p 
                  key={`desc-${currentSlide}`}
                  className="text-base leading-relaxed text-[#6B6F76] max-w-md mx-auto animate-fade-in"
                >
                  {screenshots[currentSlide].description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Join Now CTA Section */}
        <section className="bg-white py-16">
          {/* Top Divider */}
          <div className="border-t border-[#E6E4E1] mb-12"></div>
          
          <div className="container mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <svg className="w-6 h-6 text-[#1F2937]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <h2 className="text-3xl font-bold leading-tight text-[#0B0B0C] tracking-tight">
                Join Now
              </h2>
            </div>
            <p className="text-lg leading-relaxed text-[#6B6F76] max-w-2xl mx-auto mb-8">
              Join for the tracking, stay for the results. FlexTab helps serious lifters track every rep, visualize progress, and hit new PRs.
            </p>
            <button className="bg-[#1F2937] text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#374151] transition-colors">
              Get Started Free
            </button>
          </div>
          
          {/* Bottom Divider */}
          <div className="border-t border-[#E6E4E1] mt-12"></div>
        </section>

        {/* Image Section with Shaped Overlay */}
        <section className="bg-white py-16 overflow-hidden">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold leading-tight text-[#0B0B0C] tracking-tight mb-8 text-center">
              Open, tap, go.
            </h2>
            
            <div className="relative h-[500px] rounded-2xl overflow-hidden">
              {/* Athlete Image */}
              <img 
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/aLKEmQTdFhQzOzgb.jpg" 
                alt="Athlete training" 
                className="w-full h-full object-cover"
              />
              
              {/* White Shaped Overlay with Text */}
              <div 
                className="absolute bottom-0 left-0 right-0 bg-white pt-16 pb-8 px-8"
                style={{ 
                  clipPath: 'polygon(0 20%, 100% 0%, 100% 100%, 0% 100%)',
                  marginBottom: '-2px' // Prevent gap at bottom
                }}
              >
                <p className="text-base leading-relaxed text-[#6B6F76]">
                  Logging your workout with FlexTab is effortless. Open the app, select your exercise, and start tracking sets, reps, and weight instantly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Explore Features Section */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold leading-tight text-[#0B0B0C] tracking-tight mb-12 text-center">
              Explore our features.
            </h2>
            
            <div className="space-y-12 max-w-md mx-auto">
              {/* Body Measurements Card */}
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <svg className="w-16 h-16 text-[#1F2937]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold leading-tight text-[#0B0B0C] tracking-tight mb-3">
                  Track & Measure
                </h3>
                <p className="text-base leading-relaxed text-[#6B6F76]">
                  Log body measurements alongside your workouts. Track weight, chest, waist, arms, and thighs to see your transformation.
                </p>
              </div>

              {/* Custom Exercises Card */}
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <svg className="w-16 h-16 text-[#1F2937]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold leading-tight text-[#0B0B0C] tracking-tight mb-3">
                  Build & Customize
                </h3>
                <p className="text-base leading-relaxed text-[#6B6F76]">
                  Create custom exercises tailored to your routine. Add any movement, track it your way, and build your perfect workout plan.
                </p>
              </div>

              {/* Visual Calendar Card */}
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <svg className="w-16 h-16 text-[#1F2937]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold leading-tight text-[#0B0B0C] tracking-tight mb-3">
                  Visualize & Stay Consistent
                </h3>
                <p className="text-base leading-relaxed text-[#6B6F76]">
                  See your workout consistency at a glance with the visual calendar. Never miss a training day again.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section 
          className="relative py-32 overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/irKQQAnhGsKossSs.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="container mx-auto px-6 text-center relative z-10">
            <h3 className="text-4xl font-bold leading-tight mb-4 text-white tracking-tight max-w-2xl mx-auto">
              Start tracking your progress today
            </h3>
            <p className="text-lg leading-relaxed text-white/90 mb-8 max-w-xl mx-auto">
              Get started free. No credit card required.
            </p>
            <Button 
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-[#1F2937] hover:bg-[#374151] text-white px-10 py-6 rounded-full font-bold text-lg shadow-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
            >
              Get started free
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white border-t border-[#E6E4E1] py-16">
          <div className="container mx-auto px-6">
            {/* Logo and Tagline */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-3">
                <img src="/flextab-icon.png" alt="FlexTab" className="h-8 w-8" />
                <span className="text-xl font-bold text-[#0B0B0C]">flextab</span>
              </div>
              <p className="text-sm text-[#6B6F76] max-w-xs">
                The workout tracker built for serious lifters. Track every set, visualize progress, and hit new PRs.
              </p>
            </div>

            {/* Footer Links */}
            <div className="grid grid-cols-2 gap-8 mb-12">
              <div>
                <h4 className="text-xs font-bold text-[#0B0B0C] uppercase tracking-wider mb-4">
                  PRODUCT
                </h4>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-sm text-[#6B6F76] hover:text-[#0B0B0C] transition-colors">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-[#6B6F76] hover:text-[#0B0B0C] transition-colors">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-[#6B6F76] hover:text-[#0B0B0C] transition-colors">
                      Sign In
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0B0B0C] uppercase tracking-wider mb-4">
                  LEGAL
                </h4>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-sm text-[#6B6F76] hover:text-[#0B0B0C] transition-colors">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-[#6B6F76] hover:text-[#0B0B0C] transition-colors">
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-[#6B6F76] hover:text-[#0B0B0C] transition-colors">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Copyright */}
            <div className="pt-8 border-t border-[#E6E4E1]">
              <p className="text-sm text-[#6B6F76] text-center">
                © 2026 FlexTab. Built for serious lifters.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

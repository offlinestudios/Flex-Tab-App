import { Button } from "@/components/ui/button";
import { InstallPrompt } from "@/components/InstallPrompt";
import { IOSInstallPrompt } from "@/components/IOSInstallPrompt";
import { getLoginUrl } from "@/const";
import { useEffect, useState } from "react";

export default function Landing() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* PWA Install Prompts */}
      <InstallPrompt />
      <IOSInstallPrompt />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E6E4E1]">
        <div className="container mx-auto px-6 md:px-12 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/flextab-logo.png?v=2" alt="FlexTab" className="h-9 w-auto" />
            <h1 className="text-2xl font-bold tracking-tight text-[#0B0B0C]">
              flextab
            </h1>
          </div>
          <Button 
            onClick={() => window.location.href = getLoginUrl()}
            className="bg-[#111827] hover:bg-[#1F2937] text-white px-7 py-2.5 rounded-lg font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-[#1F2937] overflow-hidden min-h-[700px] md:min-h-[800px] flex items-center">
        {/* Background with parallax effect */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/JfZFeFNwdWYiOfDR.jpg')`,
            backgroundPosition: 'center 30%',
            transform: isLoaded ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 8s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
        
        <div className="relative container mx-auto px-6 md:px-12 py-20 md:py-32">
          <div className="max-w-3xl">
            <h2 
              className={`text-[56px] md:text-[80px] font-bold leading-[1.05] mb-7 tracking-tight text-white transition-all duration-500 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
            >
              See every PR
              <br />
              in real-time
            </h2>
            <p 
              className={`text-[20px] md:text-[24px] leading-[1.5] mb-12 text-white/90 max-w-2xl transition-all duration-500 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
            >
              The workout tracker built for serious lifters. Log every set, visualize progress, and hit new PRs faster.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => window.location.href = getLoginUrl()}
                className={`bg-white hover:bg-gray-100 text-[#111827] px-9 py-4 h-16 rounded-lg text-lg font-semibold transition-all duration-150 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
              >
                Get started free — no credit card
              </Button>
              <Button 
                onClick={() => {
                  document.getElementById('product-story')?.scrollIntoView({ behavior: 'smooth' });
                }}
                variant="outline"
                className={`bg-transparent hover:bg-white/10 text-white border-2 border-white/40 hover:border-white px-9 py-4 h-16 rounded-lg text-lg font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
              >
                See how it works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Product Story - Feature 1 (Screenshot Left) */}
      <section id="product-story" className="bg-white">
        <div className="container mx-auto px-6 md:px-12 py-24 md:py-40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Screenshot */}
            <div className="order-2 lg:order-1 flex items-center justify-center">
              <div className="relative w-full max-w-[375px]">
                <img 
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/sUWhtLsscxMXAbBm.png"
                  alt="Active workout tracking"
                  className="w-full h-auto rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,0,0,0.15)] border-[8px] border-[#1F2937]"
                />
              </div>
            </div>

            {/* Copy */}
            <div className="order-1 lg:order-2">
              <h3 className="text-[40px] md:text-[52px] font-bold leading-[1.1] mb-6 text-[#0B0B0C] tracking-tight">
                Log every set
                <br />
                in seconds
              </h3>
              <p className="text-[20px] md:text-[22px] leading-[1.6] text-[#6B6F76] mb-8">
                No complex forms. No wasted time. Just tap the exercise, enter your numbers, and get back to lifting.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0891B2]/10 flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-[#0891B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[18px] text-[#6B6F76]">Pre-loaded with 50+ exercises, add your own in one tap</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0891B2]/10 flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-[#0891B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[18px] text-[#6B6F76]">Auto-saves every set — never lose your workout data</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0891B2]/10 flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-[#0891B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[18px] text-[#6B6F76]">Works offline, syncs when you're back online</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Product Story - Feature 2 (Screenshot Right) */}
      <section className="bg-[#F7F5F2]">
        <div className="container mx-auto px-6 md:px-12 py-24 md:py-40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Copy */}
            <div>
              <h3 className="text-[40px] md:text-[52px] font-bold leading-[1.1] mb-6 text-[#0B0B0C] tracking-tight">
                Compare every
                <br />
                session
              </h3>
              <p className="text-[20px] md:text-[22px] leading-[1.6] text-[#6B6F76] mb-8">
                See your entire training history at a glance. Spot patterns, identify plateaus, and adjust your program based on real data.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0891B2]/10 flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-[#0891B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[18px] text-[#6B6F76]">Filter by exercise, date range, or muscle group</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0891B2]/10 flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-[#0891B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[18px] text-[#6B6F76]">See total volume, sets, and reps for each workout</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0891B2]/10 flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-[#0891B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[18px] text-[#6B6F76]">Export your data anytime — you own your training log</span>
                </li>
              </ul>
            </div>

            {/* Screenshot */}
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-[375px]">
                <img 
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/ZQcZJelIDPISaKrs.png"
                  alt="Workout history"
                  className="w-full h-auto rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,0,0,0.15)] border-[8px] border-[#1F2937]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Story - Feature 3 (Screenshot Left) */}
      <section className="bg-white">
        <div className="container mx-auto px-6 md:px-12 py-24 md:py-40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Screenshot */}
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-[375px]">
                <img 
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/NfNzRYszCpliWVqV.png"
                  alt="Progress charts"
                  className="w-full h-auto rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,0,0,0.15)] border-[8px] border-[#1F2937]"
                />
              </div>
            </div>

            {/* Copy */}
            <div>
              <h3 className="text-[40px] md:text-[52px] font-bold leading-[1.1] mb-6 text-[#0B0B0C] tracking-tight">
                Watch yourself
                <br />
                get stronger
              </h3>
              <p className="text-[20px] md:text-[22px] leading-[1.6] text-[#6B6F76] mb-8">
                Progressive overload made visible. See your strength gains plotted in real-time charts that update with every workout.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0891B2]/10 flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-[#0891B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[18px] text-[#6B6F76]">Track weight progression for every exercise</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0891B2]/10 flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-[#0891B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[18px] text-[#6B6F76]">See weekly, monthly, and all-time trends</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0891B2]/10 flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-[#0891B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[18px] text-[#6B6F76]">Identify PRs automatically — celebrate every win</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white">
        <div className="container mx-auto px-6 md:px-12 py-24 md:py-32 text-center">
          <h3 className="text-[40px] md:text-[56px] font-bold leading-[1.1] mb-6 text-[#0B0B0C] tracking-tight max-w-3xl mx-auto">
            Start tracking your progress today
          </h3>
          <p className="text-[20px] md:text-[22px] leading-[1.6] text-[#6B6F76] mb-10 max-w-2xl mx-auto">
            Join thousands of lifters who track every rep and hit new PRs every week.
          </p>
          <Button 
            onClick={() => window.location.href = getLoginUrl()}
            className="bg-[#111827] hover:bg-[#1F2937] text-white px-9 py-4 h-16 rounded-lg text-lg font-semibold transition-all duration-150 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]"
          >
            Get started free — no credit card
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F7F5F2] border-t border-[#E6E4E1]">
        <div className="container mx-auto px-6 md:px-12 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src="/flextab-logo.png?v=2" alt="FlexTab" className="h-8 w-auto" />
                <span className="text-xl font-bold text-[#0B0B0C]">flextab</span>
              </div>
              <p className="text-[16px] text-[#6B6F76] max-w-sm">
                The workout tracker built for serious lifters. Track every set, visualize progress, and hit new PRs.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="text-[14px] font-semibold text-[#0B0B0C] uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="#product-story" className="text-[16px] text-[#6B6F76] hover:text-[#0B0B0C] transition-colors">Features</a></li>
                <li><a href={getLoginUrl()} className="text-[16px] text-[#6B6F76] hover:text-[#0B0B0C] transition-colors">Pricing</a></li>
                <li><a href={getLoginUrl()} className="text-[16px] text-[#6B6F76] hover:text-[#0B0B0C] transition-colors">Sign In</a></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="text-[14px] font-semibold text-[#0B0B0C] uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-[16px] text-[#6B6F76] hover:text-[#0B0B0C] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-[16px] text-[#6B6F76] hover:text-[#0B0B0C] transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-[16px] text-[#6B6F76] hover:text-[#0B0B0C] transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-[#E6E4E1]">
            <p className="text-[14px] text-[#6B6F76] text-center">
              © 2026 FlexTab. Built for serious lifters.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

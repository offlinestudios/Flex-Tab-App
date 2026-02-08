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
                    <a href="#" onClick={() => window.location.href = getLoginUrl()} className="text-sm text-[#6B6F76] hover:text-[#0891B2] transition-colors cursor-pointer">
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
                See every PR
                <br />
                in real-time
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
        </section>

        {/* Product Story - Feature 1 */}
        <section className="bg-white py-20">
          <div className="container mx-auto px-6">
            <div className="space-y-8">
              {/* Screenshot */}
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-[375px]">
                  <img 
                    src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663026754577/sUWhtLsscxMXAbBm.png"
                    alt="Active workout tracking"
                    className="w-full h-auto rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,0,0,0.15)] border-[8px] border-[#1F2937]"
                  />
                </div>
              </div>

              {/* Copy */}
              <div className="text-center">
                <h3 className="text-4xl font-bold leading-tight mb-4 text-[#0B0B0C] tracking-tight">
                  Log every set
                  <br />
                  in seconds
                </h3>
                <p className="text-lg leading-relaxed text-[#6B6F76] mb-6">
                  No complex forms. No wasted time. Just tap the exercise, enter your numbers, and get back to lifting.
                </p>
                <ul className="space-y-3 text-left max-w-md mx-auto">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0891B2]/10 flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-[#0891B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-base text-[#6B6F76]">Pre-loaded with 50+ exercises, add your own in one tap</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0891B2]/10 flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-[#0891B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-base text-[#6B6F76]">Auto-saves every set — never lose your workout data</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0891B2]/10 flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-[#0891B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-base text-[#6B6F76]">Works offline, syncs when you're back online</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Product Story - Feature 2 */}
        <section className="bg-[#F7F5F2] py-20">
          <div className="container mx-auto px-6">
            <div className="space-y-8">
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

              {/* Copy */}
              <div className="text-center">
                <h3 className="text-4xl font-bold leading-tight mb-4 text-[#0B0B0C] tracking-tight">
                  Compare your
                  <br />
                  sessions instantly
                </h3>
                <p className="text-lg leading-relaxed text-[#6B6F76] mb-6">
                  See your complete workout history at a glance. Compare today's lifts with last week, last month, or your all-time best.
                </p>
                <ul className="space-y-3 text-left max-w-md mx-auto">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0891B2]/10 flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-[#0891B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-base text-[#6B6F76]">Calendar view shows every workout day</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0891B2]/10 flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-[#0891B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-base text-[#6B6F76]">Filter by exercise, date range, or muscle group</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0891B2]/10 flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-[#0891B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-base text-[#6B6F76]">Export your data anytime, anywhere</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Product Story - Feature 3 */}
        <section className="bg-white py-20">
          <div className="container mx-auto px-6">
            <div className="space-y-8">
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
              <div className="text-center">
                <h3 className="text-4xl font-bold leading-tight mb-4 text-[#0B0B0C] tracking-tight">
                  Watch yourself
                  <br />
                  get stronger
                </h3>
                <p className="text-lg leading-relaxed text-[#6B6F76] mb-6">
                  Track strength gains with detailed charts. See how your lifts improve week over week with visual analytics.
                </p>
                <ul className="space-y-3 text-left max-w-md mx-auto">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0891B2]/10 flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-[#0891B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-base text-[#6B6F76]">Weight progression charts for every exercise</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0891B2]/10 flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-[#0891B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-base text-[#6B6F76]">Volume tracking shows total work over time</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0891B2]/10 flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-[#0891B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-base text-[#6B6F76]">Personal records automatically highlighted</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[#F7F5F2] py-20">
          <div className="container mx-auto px-6 text-center">
            <h3 className="text-4xl font-bold leading-tight mb-4 text-[#0B0B0C] tracking-tight max-w-2xl mx-auto">
              Start tracking your progress today
            </h3>
            <p className="text-lg leading-relaxed text-[#6B6F76] mb-8 max-w-xl mx-auto">
              Get started free. No credit card required.
            </p>
            <Button 
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-[#0891B2] hover:bg-[#0E7490] text-white px-10 py-6 rounded-xl font-bold text-lg shadow-lg transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
            >
              Get started free
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white border-t border-[#E6E4E1] py-12">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="font-bold text-[#0B0B0C] mb-3">Product</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-[#6B6F76] hover:text-[#0891B2] transition-colors">Features</a></li>
                  <li><a href="#" className="text-[#6B6F76] hover:text-[#0891B2] transition-colors">Pricing</a></li>
                  <li><a href="#" className="text-[#6B6F76] hover:text-[#0891B2] transition-colors">About</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-[#0B0B0C] mb-3">Legal</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-[#6B6F76] hover:text-[#0891B2] transition-colors">Privacy</a></li>
                  <li><a href="#" className="text-[#6B6F76] hover:text-[#0891B2] transition-colors">Terms</a></li>
                  <li><a href="#" className="text-[#6B6F76] hover:text-[#0891B2] transition-colors">Contact</a></li>
                </ul>
              </div>
            </div>
            <div className="text-center text-sm text-[#6B6F76] pt-6 border-t border-[#E6E4E1]">
              © 2026 FlexTab. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

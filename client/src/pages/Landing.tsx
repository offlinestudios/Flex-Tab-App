import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InstallPrompt } from "@/components/InstallPrompt";
import { IOSInstallPrompt } from "@/components/IOSInstallPrompt";
import { getLoginUrl } from "@/const";
import { useEffect, useRef, useState } from "react";

export default function Landing() {
  const [isLoaded, setIsLoaded] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

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

      {/* Hero Section with Banner Photo + UI Overlay */}
      <section className="relative bg-white overflow-hidden">
        {/* Banner Background Photo */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://private-us-east-1.manuscdn.com/sessionFile/QYf23oqm9rdq1J7U9jDEhg/sandbox/XXGhXo1Cn50cYEFafmkMB8-img-1_1770072185000_na1fn_aGVyby1hdGhsZXRlLXNxdWF0.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUVlmMjNvcW05cmRxMUo3VTlqREVoZy9zYW5kYm94L1hYR2hYbzFDbjUwY1lFRmFmbWtNQjgtaW1nLTFfMTc3MDA3MjE4NTAwMF9uYTFmbl9hR1Z5YnkxaGRHaHNaWFJsTFhOeGRXRjAuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=D5SOBFFCShl~I-~GMWL58HjeNEKm85N7jOi5lSCWpxype7tbaYYxCr4NTFeJ-ZI-ObELSXOUqb3m~PXjIZVvbBPKKFYprga-cR~LCc380Ahy9ghW95i~i2ZgLkKMRXCcrjf2xEtusCGcTLmFj9asXfN4wvSvcU1lTR7PLYwFlj3j1xMqUTAZbOqSxgKJpDu5oxWf-aHrwK4k84x2awuh8fn0ZiAj6zAmlseC2hmCrfkvQsqPQPqxzO-uD9NmIUbMDehk2M74rfGN3sV~T1~V5yKbmq1OnsejLgqLXESNvVw2aPo3rHwzZnI5F9gcDGBfFY1B1D6Wen0Ppci5ohnLAQ__')`
          }}
        />
        
        <div className="relative container mx-auto px-5 md:px-10 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="text-white">
              <h2 
                className={`text-[40px] md:text-[56px] font-bold leading-[1.1] mb-4 tracking-tight transition-all duration-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                Track every rep. See every gain.
              </h2>
              <p 
                className={`text-[18px] md:text-[20px] leading-[1.5] mb-8 text-white/90 transition-all duration-400 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                The workout tracker built for progressive overload.
              </p>
              <Button 
                onClick={() => window.location.href = getLoginUrl()}
                className={`bg-white hover:bg-gray-100 text-[#111827] px-8 py-4 h-12 rounded-lg text-base font-semibold transition-all duration-150 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                Start tracking free
              </Button>
            </div>

            {/* Right: Product UI Screenshot */}
            <div className={`transition-all duration-400 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              <img 
                src="https://private-us-east-1.manuscdn.com/sessionFile/QYf23oqm9rdq1J7U9jDEhg/sandbox/sQRvymh8ohcn0t7gTH3dPg-img-1_1770083525000_na1fn_dWktYWN0aXZlLXdvcmtvdXQtc2Vzc2lvbg.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUVlmMjNvcW05cmRxMUo3VTlqREVoZy9zYW5kYm94L3NRUnZ5bWg4b2hjbjB0N2dUSDNkUGctaW1nLTFfMTc3MDA4MzUyNTAwMF9uYTFmbl9kV2t0WVdOMGFYWmxMWGR2Y210dmRYUXRjMlZ6YzJsdmJnLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=iN9gwSEp79wJZOltPrDMc15ubdqrtJU09a0JTP5gzQl5GQBSafQSqbI18KlewB1R0vE-xwNgaYaCqcuV8Wwdz1a3lqLrfRA16Qpjp-jFzBrJQe3-mwMSFCGRtJa6nmCbKygpHICGL249C219vMXXW4U03wVsG4Gp26BLxCJU1B4yuibCyAt9uQ-UzCikGikH~SQeDC6yDD9S3DKdyfeRUmu-xzTEdvfeAPMDmpLL9lk~rJOkFTgObuOjmVSzVOZdvsGsoNKjPGwkD27juui6n-BrxwwVW0wAg6EFtIhIKfVc9EcY43mzWnntctuZOcycAnIkVV1KZ~fMUSnyKTfcSw__"
                alt="FlexTab app showing active workout session"
                className="w-full max-w-sm mx-auto h-auto drop-shadow-2xl"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="relative bg-[#F7F5F2] overflow-hidden">
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url('https://private-us-east-1.manuscdn.com/sessionFile/QYf23oqm9rdq1J7U9jDEhg/sandbox/XXGhXo1Cn50cYEFafmkMB8-img-4_1770072195000_na1fn_ZGV0YWlsLWJhcmJlbGwtcGxhdGVz.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUVlmMjNvcW05cmRxMUo3VTlqREVoZy9zYW5kYm94L1hYR2hYbzFDbjUwY1lFRmFmbWtNQjgtaW1nLTRfMTc3MDA3MjE5NTAwMF9uYTFmbl9aR1YwWVdsc0xXSmhjbUpsYkd3dGNHeGhkR1Z6LmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=QiT6TyixrykXaWnDriowIj1bqeUPPHm7nDR3r5v3ecXeWc46vI9UcdLoBPrPIP9rLvFg2FDr6W9B3IMScpHAwEwPgJor0QZwIUsGteaQTVmPw2aRU-JNabmpfOW~kpytEJETkRTwg7K1mRbKcaKAQc348HAi0qlKojkVsoMQnGROe4X-VHsOObc2mhfl8kGieK3ECqbV-AKwo2GfU3O5limYZZrFLsf3qTvjcVtfdJe9OnZgToQDKxD1A8hP2Tk2b-pbl0tYYE14XE9SHkwq19WdaIkZkQTBrFHvFZvy~JHPJ6JA3tsiOznTrwhArflbsiuJZW8tx8U7Z8~thiPUOg__')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="relative container mx-auto px-5 md:px-10 py-20 md:py-24 text-center">
          <h3 className="fade-in-on-scroll text-[32px] md:text-[40px] font-bold leading-[1.2] mb-2 text-[#0B0B0C] tracking-tight">
            Built for consistency
          </h3>
        </div>
      </section>

      {/* Core Value Proposition Section (UI Primary) */}
      <section className="bg-white">
        <div className="container mx-auto px-5 md:px-10 py-20 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left: Product UI Screenshot (PRIMARY) */}
            <div className="fade-in-on-scroll order-2 md:order-1">
              <img 
                src="https://private-us-east-1.manuscdn.com/sessionFile/QYf23oqm9rdq1J7U9jDEhg/sandbox/sQRvymh8ohcn0t7gTH3dPg-img-2_1770083532000_na1fn_dWktcHJvZ3Jlc3MtY2hhcnQtdm9sdW1l.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUVlmMjNvcW05cmRxMUo3VTlqREVoZy9zYW5kYm94L3NRUnZ5bWg4b2hjbjB0N2dUSDNkUGctaW1nLTJfMTc3MDA4MzUzMjAwMF9uYTFmbl9kV2t0Y0hKdlozSmxjM010WTJoaGNuUXRkbTlzZFcxbC5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=SziLCB42x8p2Zy3ZOTYWW5gQ~6mtusD4~6PUmaul2~jTuzUJ~~UONFNTVrUZCe1ieC6c0WdrxyXSv1pwhphLRMiV19p~TOqrlumNVrdY-JIgbaoPTtSxo3FaxRbs5d~4MV2KNTqDG29IM2Sjctmi7Rm6KWKMy1VfYQFWbwnKlh-NDrXOFMk6AvCTWj7LJWkg6tMxEXmkPEe4e2wdBAUyaUdozvVwI-cTT1KiW6NnKUlkajWoScZ9aYey9FPxha5a-chRyQFt6~1z8JrS0gHHDfa1RduhsAQIK1Z-ig23lvP4h9wTOCmOCpWX7kCuk-3Rnm7MSAIPTZTwm1v~cukGjA__"
                alt="FlexTab progress chart showing volume growth"
                className="w-full max-w-sm mx-auto h-auto drop-shadow-xl"
                loading="lazy"
              />
            </div>

            {/* Right: Copy + Small Stock Photo (SECONDARY) */}
            <div className="fade-in-on-scroll order-1 md:order-2">
              <h3 className="text-[32px] md:text-[40px] font-bold leading-[1.2] mb-5 text-[#0B0B0C] tracking-tight">
                Progressive overload, made visible
              </h3>
              <p className="text-[18px] md:text-[20px] leading-[1.5] mb-8 text-[#6B6F76]">
                Every set logged. Every PR tracked. Every week compared.
              </p>
              
              {/* Small contextual stock photo */}
              <img 
                src="https://private-us-east-1.manuscdn.com/sessionFile/QYf23oqm9rdq1J7U9jDEhg/sandbox/XXGhXo1Cn50cYEFafmkMB8-img-3_1770072188000_na1fn_dHJhaW5pbmctb3ZlcmhlYWQtcHJlc3M.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUVlmMjNvcW05cmRxMUo3VTlqREVoZy9zYW5kYm94L1hYR2hYbzFDbjUwY1lFRmFmbWtNQjgtaW1nLTNfMTc3MDA3MjE4ODAwMF9uYTFmbl9kSEpoYVc1cGJtY3RiM1psY21obFlXUXRjSEpsYzNNLmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=hWQjMrXoeyGu14AA5FYuHVBCKB92KE6DD5nVSqcV7c93A~FW5qjt4m2LWpN~UfTSv7SueeSsxmSyJgN~c6fByOBE~AdCRi4Ki0FjxHJsBfEaShs5Y1lni-QqCMcDiDBVL~xcGISbWYuaGBydnp-Jz~MXvgb0gBrjlQ5UA5v1UbMQZn3ouBu0~2yJOaxFYPfAibJzHu0lmggHRPIq~yIGDEWBosLn8RwwKadIyw2ZN2NcT0iG9RiwE1QEJrnFdntZlWy~JCPR4N6VJ2-dGcEGtCqr17RxrN8rK8~NSoQWCk1m5tD497VypuSpDvxpCYNFfzQz39ifijy02QQCYMSnrw__"
                alt="Athlete training with overhead press"
                className="w-full max-w-xs rounded-lg border border-[#E6E4E1] opacity-60"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Proof Section (UI Primary, 3 cards) */}
      <section className="bg-[#F7F5F2]">
        <div className="container mx-auto px-5 md:px-10 py-20 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Feature 1: Custom Exercises */}
            <Card className="fade-in-on-scroll p-6 bg-white border border-[#E6E4E1] rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <img 
                src="https://private-us-east-1.manuscdn.com/sessionFile/QYf23oqm9rdq1J7U9jDEhg/sandbox/sQRvymh8ohcn0t7gTH3dPg-img-3_1770083531000_na1fn_dWktY3VzdG9tLWV4ZXJjaXNlLWxpc3Q.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUVlmMjNvcW05cmRxMUo3VTlqREVoZy9zYW5kYm94L3NRUnZ5bWg4b2hjbjB0N2dUSDNkUGctaW1nLTNfMTc3MDA4MzUzMTAwMF9uYTFmbl9kV2t0WTNWemRHOXRMV1Y0WlhKamFYTmxMV3hwYzNRLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=PJPTvBWXzpEnywNwMwwBvC0XBtZJFUXJH0xnT8k3gQhYVkCOFYud0xn5AgWgukZoTYgJlSVj3L-a1gMTrYPj6-Zi3zIh0-DQuPtOdYXSxfz4OdlN9wzEtnXUidLKT7VXb1FB0AUCtfy7COw7ueaDiwNxS1jcXnN17tVZAklHNptgQQxFjEhaM~lxEnlg1g-AvMFKkBH41b4Wr9HOXmaSPDKHM~VhJXaUSZhaiC2l78pQWvsQSYHhkJHjfkBtd-gBRZ2rZ6EFHgi1HpKUds8e-FS8wqP3AXa-8eMvQrM3UFCkJ56hD8z8d7PJtC7rlZBgjPGhIvPbpLSVPzM5Ay3Vtg__"
                alt="FlexTab custom exercise library"
                className="w-full h-64 object-contain object-top mb-4"
                loading="lazy"
              />
              <h4 className="text-[20px] font-semibold leading-[1.3] mb-2 text-[#0B0B0C]">
                Custom exercises
              </h4>
              <p className="text-[16px] leading-[1.6] text-[#6B6F76]">
                Track any movement, any style.
              </p>
            </Card>

            {/* Feature 2: Body Measurements */}
            <Card className="fade-in-on-scroll p-6 bg-white border border-[#E6E4E1] rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <img 
                src="https://private-us-east-1.manuscdn.com/sessionFile/QYf23oqm9rdq1J7U9jDEhg/sandbox/sQRvymh8ohcn0t7gTH3dPg-img-4_1770083530000_na1fn_dWktYm9keS1tZWFzdXJlbWVudHMtdHJhY2tpbmc.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUVlmMjNvcW05cmRxMUo3VTlqREVoZy9zYW5kYm94L3NRUnZ5bWg4b2hjbjB0N2dUSDNkUGctaW1nLTRfMTc3MDA4MzUzMDAwMF9uYTFmbl9kV2t0WW05a2VTMXRaV0Z6ZFhKbGJXVnVkSE10ZEhKaFkydHBibWMucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=Jbt7M854RTiT8yIdPiy13TAkBp5fa6YaW9Wv0s8mPmSf9ClZAiLsVC1LM6cEm9~Oe626FKaFuO85znPjc-W6m1~MVGYt7ymdb2fgW5d60W5nBvh8eliN1cAZ1oLLRycpUJ-KRDwW44wkMEhTn1yAGcwJ~LH-AESeWxvWFPh820PRN2icLitBL23FHRoHZDHlDvIgpawTFYmddG9VYh8v9~7TXA~T~7m9JZo5bLeVKIytineJrmNNvsKxKbRjFTSA63Hlf3mto4du~pUHZKSdGubDi8eQxUpcBMz-2SgJ5mMA1JGlyEB7JKmn7EOn-NB02bvRpVINDdZTN3AaCw1sow__"
                alt="FlexTab body measurements tracking"
                className="w-full h-64 object-contain object-top mb-4"
                loading="lazy"
              />
              <h4 className="text-[20px] font-semibold leading-[1.3] mb-2 text-[#0B0B0C]">
                Body measurements
              </h4>
              <p className="text-[16px] leading-[1.6] text-[#6B6F76]">
                Log weight, chest, arms, waist, thighs.
              </p>
            </Card>

            {/* Feature 3: Workout History */}
            <Card className="fade-in-on-scroll p-6 bg-white border border-[#E6E4E1] rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <img 
                src="https://private-us-east-1.manuscdn.com/sessionFile/QYf23oqm9rdq1J7U9jDEhg/sandbox/sQRvymh8ohcn0t7gTH3dPg-img-5_1770083532000_na1fn_dWktd29ya291dC1oaXN0b3J5LWNhbGVuZGFy.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUVlmMjNvcW05cmRxMUo3VTlqREVoZy9zYW5kYm94L3NRUnZ5bWg4b2hjbjB0N2dUSDNkUGctaW1nLTVfMTc3MDA4MzUzMjAwMF9uYTFmbl9kV2t0ZDI5eWEyOTFkQzFvYVhOMGIzSjVMV05oYkdWdVpHRnkucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=D91Io94XhhFdug~lF3Wh9vZLOiEoC6RK6AV6RtlwAocuZCWDy8m3b6pYafigIxxRvwvzjGM299vjGa-SR1eKYNCfCkw0AXq53SSNF3Ft1sXVoU2SURuoV-r3dGVnbGMGwuSPgBt0EkHKE3osmNbBQ-UMz44OK7TrBGuEFO2FlSixstrosweOb2Com7zSBj6ilgwJZJW6gGlAY30-zs5HezeJb67IX8NIO91oq3Lz82CwJotQGqOVXzJk9-t-atwrlv13q0BUepG1WaCAA-Ozk4gEg2aaiVe0-STXLgzUzQLGLQLE-lZqQu2PwQKat8HOQiLFWA2CQd12xDSJih92kQ__"
                alt="FlexTab workout history calendar"
                className="w-full h-64 object-contain object-top mb-4"
                loading="lazy"
              />
              <h4 className="text-[20px] font-semibold leading-[1.3] mb-2 text-[#0B0B0C]">
                Workout history
              </h4>
              <p className="text-[16px] leading-[1.6] text-[#6B6F76]">
                Review every session, edit any set.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative bg-white overflow-hidden">
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url('https://private-us-east-1.manuscdn.com/sessionFile/QYf23oqm9rdq1J7U9jDEhg/sandbox/xeAgAge3No47vLwWqgtTD5-img-1_1770072252000_na1fn_ZGV0YWlsLWNoYWxrLWhhbmRz.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUVlmMjNvcW05cmRxMUo3VTlqREVoZy9zYW5kYm94L3hlQWdBZ2UzTm80N3ZMd1dxZ3RURDUtaW1nLTFfMTc3MDA3MjI1MjAwMF9uYTFmbl9aR1YwWVdsc0xXTm9ZV3hyTFdoaGJtUnouanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=qoGii~ai-GeksReJqEcLC~2Noj2Evmhyl5TAWxDm0cUmp64ktBDKx44D0J0Ey8prMNihS~qvQzF5vrvol4RhYGDX0jvxE5WxgdUOcR53W5DEDBXxjCE-Mg5xG1iZV3OpxQj~wRcz943e2bsULcAOsgui5pZ0YeRPhN7NB3A6Sqy-3snZ9i2BdQ4rXCwFPc4sLyylNYxn~bpID4-Zz4J6bubvLnUECMdyCnFD8QGaAx9sbcP~1hUov0TiDYWkGN8wMkEzJpbk45huhDA6S19gR-rcVChAECCAfKiVpBGSAdvZA91jMJSpR3VsGZFuQ3rKit3vejO6QerIDDKUxM6bow__')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="relative container mx-auto px-5 md:px-10 py-20 md:py-32 text-center">
          <h3 className="fade-in-on-scroll text-[32px] md:text-[40px] font-bold leading-[1.2] mb-5 text-[#0B0B0C] tracking-tight">
            Start your next session
          </h3>
          <p className="fade-in-on-scroll text-[18px] md:text-[20px] leading-[1.5] mb-10 text-[#6B6F76]">
            Free to use. No credit card required.
          </p>
          <Button 
            onClick={() => window.location.href = getLoginUrl()}
            className="fade-in-on-scroll bg-[#111827] hover:bg-[#1F2937] text-white px-8 py-4 h-12 rounded-lg text-base font-semibold transition-all duration-150 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
          >
            Get started
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F7F5F2] border-t border-[#E6E4E1]">
        <div className="container mx-auto px-5 md:px-10 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/flextab-logo.png?v=2" alt="FlexTab" className="h-6 w-auto" />
              <span className="font-bold text-[#0B0B0C]">flextab</span>
            </div>
            <p className="text-[14px] text-[#6B6F76]">
              © 2026 FlexTab
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        .fade-in-on-scroll {
          opacity: 0;
          transition: opacity 400ms ease-out;
        }

        .fade-in-on-scroll.fade-in-visible {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

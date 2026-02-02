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
      <header className="sticky top-0 z-40 bg-white border-b border-[#E6E4E1] shadow-sm">
        <div className="container mx-auto px-5 md:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/flextab-logo.png?v=2" alt="FlexTab" className="h-8 w-auto" />
            <h1 className="text-2xl font-bold tracking-tight text-[#0B0B0C]">
              flextab
            </h1>
          </div>
          <Button 
            onClick={() => window.location.href = getLoginUrl()}
            className="bg-[#111827] hover:bg-[#1F2937] text-white px-6 py-2 rounded-lg font-semibold transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="container mx-auto px-5 md:px-10 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h2 
              className={`text-[40px] md:text-[56px] font-bold leading-[1.1] mb-4 text-[#0B0B0C] tracking-tight transition-all duration-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
              style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              Track every rep. See every gain.
            </h2>
            <p 
              className={`text-[18px] md:text-[20px] leading-[1.5] mb-8 text-[#6B6F76] transition-all duration-400 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
              style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              The workout tracker built for progressive overload.
            </p>
            <Button 
              onClick={() => window.location.href = getLoginUrl()}
              className={`bg-[#111827] hover:bg-[#1F2937] text-white px-8 py-4 h-12 rounded-lg text-base font-semibold transition-all duration-150 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
              style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              Start tracking free
            </Button>
          </div>
          
          {/* Hero Image */}
          <div className="mt-16 max-w-2xl mx-auto">
            <img 
              src="https://private-us-east-1.manuscdn.com/sessionFile/QYf23oqm9rdq1J7U9jDEhg/sandbox/XXGhXo1Cn50cYEFafmkMB8-img-1_1770072185000_na1fn_aGVyby1hdGhsZXRlLXNxdWF0.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUVlmMjNvcW05cmRxMUo3VTlqREVoZy9zYW5kYm94L1hYR2hYbzFDbjUwY1lFRmFmbWtNQjgtaW1nLTFfMTc3MDA3MjE4NTAwMF9uYTFmbl9hR1Z5YnkxaGRHaHNaWFJsTFhOeGRXRjAuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=D5SOBFFCShl~I-~GMWL58HjeNEKm85N7jOi5lSCWpxype7tbaYYxCr4NTFeJ-ZI-ObELSXOUqb3m~PXjIZVvbBPKKFYprga-cR~LCc380Ahy9ghW95i~i2ZgLkKMRXCcrjf2xEtusCGcTLmFj9asXfN4wvSvcU1lTR7PLYwFlj3j1xMqUTAZbOqSxgKJpDu5oxWf-aHrwK4k84x2awuh8fn0ZiAj6zAmlseC2hmCrfkvQsqPQPqxzO-uD9NmIUbMDehk2M74rfGN3sV~T1~V5yKbmq1OnsejLgqLXESNvVw2aPo3rHwzZnI5F9gcDGBfFY1B1D6Wen0Ppci5ohnLAQ__"
              alt="Athlete performing squat with focused form"
              className="w-full h-auto rounded-xl border border-[#E6E4E1] shadow-lg"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Proof Section */}
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
          <h3 className="fade-in-on-scroll text-[32px] md:text-[40px] font-bold leading-[1.2] mb-4 text-[#0B0B0C] tracking-tight">
            Built for consistency
          </h3>
          <p className="fade-in-on-scroll text-[18px] md:text-[20px] leading-[1.5] text-[#6B6F76]">
            Trusted by lifters who track every session.
          </p>
        </div>
      </section>

      {/* Feature Story Section */}
      <section className="bg-white">
        <div className="container mx-auto px-5 md:px-10 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h3 className="fade-in-on-scroll text-[32px] md:text-[40px] font-bold leading-[1.2] mb-5 text-[#0B0B0C] tracking-tight">
              Progressive overload, made visible
            </h3>
            <p className="fade-in-on-scroll text-[18px] md:text-[20px] leading-[1.5] text-[#6B6F76]">
              Every set logged. Every PR tracked. Every week compared.
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <img 
              src="https://private-us-east-1.manuscdn.com/sessionFile/QYf23oqm9rdq1J7U9jDEhg/sandbox/XXGhXo1Cn50cYEFafmkMB8-img-3_1770072188000_na1fn_dHJhaW5pbmctb3ZlcmhlYWQtcHJlc3M.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUVlmMjNvcW05cmRxMUo3VTlqREVoZy9zYW5kYm94L1hYR2hYbzFDbjUwY1lFRmFmbWtNQjgtaW1nLTNfMTc3MDA3MjE4ODAwMF9uYTFmbl9kSEpoYVc1cGJtY3RiM1psY21obFlXUXRjSEpsYzNNLmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=hWQjMrXoeyGu14AA5FYuHVBCKB92KE6DD5nVSqcV7c93A~FW5qjt4m2LWpN~UfTSv7SueeSsxmSyJgN~c6fByOBE~AdCRi4Ki0FjxHJsBfEaShs5Y1lni-QqCMcDiDBVL~xcGISbWYuaGBydnp-Jz~MXvgb0gBrjlQ5UA5v1UbMQZn3ouBu0~2yJOaxFYPfAibJzHu0lmggHRPIq~yIGDEWBosLn8RwwKadIyw2ZN2NcT0iG9RiwE1QEJrnFdntZlWy~JCPR4N6VJ2-dGcEGtCqr17RxrN8rK8~NSoQWCk1m5tD497VypuSpDvxpCYNFfzQz39ifijy02QQCYMSnrw__"
              alt="Athlete performing overhead press with controlled form"
              className="fade-in-on-scroll w-full h-auto rounded-xl border border-[#E6E4E1] shadow-lg"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="bg-[#F7F5F2]">
        <div className="container mx-auto px-5 md:px-10 py-20 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <Card className="fade-in-on-scroll p-6 bg-white border border-[#E6E4E1] rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
              <img 
                src="https://private-us-east-1.manuscdn.com/sessionFile/QYf23oqm9rdq1J7U9jDEhg/sandbox/XXGhXo1Cn50cYEFafmkMB8-img-5_1770072195000_na1fn_ZGV0YWlsLWR1bWJiZWxsLWJlbmNo.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUVlmMjNvcW05cmRxMUo3VTlqREVoZy9zYW5kYm94L1hYR2hYbzFDbjUwY1lFRmFmbWtNQjgtaW1nLTVfMTc3MDA3MjE5NTAwMF9uYTFmbl9aR1YwWVdsc0xXUjFiV0ppWld4c0xXSmxibU5vLmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=KoXNgnUlgU4L6g02Clh4vnGDUCLqKpkmUGWGWV4Dob8RA3qBgx7F0kG3Sj2z37O5bgGt8Q8Ymi~xwizbxBZ4NuyqGtMbYhCX2oSeh1p4ORtW46oLZvSBB-4xfJt5zOoyfpxQVK2QJby3AK4JmpUOF0FDRvK9f-gWOkBEssfGrCSwwmBuAPqhMeyVGCykuLLbiUM65UR-YPS3oZe6t305GbngiKmSPkyGLwXwUd~nmCjWRSMqc-SQOxBGKlqGFSYrmYpM5jKqej6957Iq8ZML62uwGu8-vtdDnWykgbyeSQfal404UIIXcFl13utouIXSfzkKPANwBmov2J4gbolERA__"
                alt="Dumbbells on bench"
                className="w-full h-48 object-cover rounded-lg mb-4"
                loading="lazy"
              />
              <h4 className="text-[20px] font-semibold leading-[1.3] mb-2 text-[#0B0B0C]">
                Custom exercises
              </h4>
              <p className="text-[16px] leading-[1.6] text-[#6B6F76]">
                Track any movement, any style.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="fade-in-on-scroll p-6 bg-white border border-[#E6E4E1] rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
              <img 
                src="https://private-us-east-1.manuscdn.com/sessionFile/QYf23oqm9rdq1J7U9jDEhg/sandbox/xeAgAge3No47vLwWqgtTD5-img-2_1770072251000_na1fn_dHJhaW5pbmctYmVuY2gtcHJlc3M.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUVlmMjNvcW05cmRxMUo3VTlqREVoZy9zYW5kYm94L3hlQWdBZ2UzTm80N3ZMd1dxZ3RURDUtaW1nLTJfMTc3MDA3MjI1MTAwMF9uYTFmbl9kSEpoYVc1cGJtY3RZbVZ1WTJndGNISmxjM00uanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=K4DFLiJJsJaYcXq1iqBwDnI6F7Aga2Pcvv0-IocW9Iq6alV2OWqWfkSWJ~5JtIGUh3XwL8SpTJ1Y6tmoRDnlfrxK6POX115MLQWxsQPPucDgLHMMsNTQN3E9z9MmjxpueGOX9Tkg-7ZiPks~72WXkItJPM8uG0y7S2myXMPuc~MuQqBrmaEWSV6Qo-Sz27tLqEFnIKsyX7q5aYtG1hldXbtNoQ9OhjSQTTWhcp35DzIj2~ltCfpwPoqf6sAjx4CWisFqmgqHJQ0J95FPKcxJe3XtaZPoUSgR~SU5ACsCgQm390vbJNvrwkAGeCJYnpEAilq0tkbb1rYQXHyvBTrrqQ__"
                alt="Athlete bench pressing"
                className="w-full h-48 object-cover rounded-lg mb-4"
                loading="lazy"
              />
              <h4 className="text-[20px] font-semibold leading-[1.3] mb-2 text-[#0B0B0C]">
                Body measurements
              </h4>
              <p className="text-[16px] leading-[1.6] text-[#6B6F76]">
                Log weight, chest, arms, waist, thighs.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="fade-in-on-scroll p-6 bg-white border border-[#E6E4E1] rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
              <img 
                src="https://private-us-east-1.manuscdn.com/sessionFile/QYf23oqm9rdq1J7U9jDEhg/sandbox/xeAgAge3No47vLwWqgtTD5-img-3_1770072250000_na1fn_ZGV0YWlsLXdlaWdodC1wbGF0ZS1yYWNr.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUVlmMjNvcW05cmRxMUo3VTlqREVoZy9zYW5kYm94L3hlQWdBZ2UzTm80N3ZMd1dxZ3RURDUtaW1nLTNfMTc3MDA3MjI1MDAwMF9uYTFmbl9aR1YwWVdsc0xYZGxhV2RvZEMxd2JHRjBaUzF5WVdOci5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=H6Xg2JBhhrIyLV8iNZL2Pg6UgAO3iC3xQSjW25mejxo920BEtGV66EP8w2ReVTiw4elGQ5ixR1po6klwQFMZvWtFvjWVkmbCu23LImnHn6vmfuYiDlpkWLyCW8jJaBIjfkjSF-x8LlHm5o~dJA~isUruN6ZEXu15mIR5uOC7dMSapP3JS8n4B47BeA0hdsU~E3~WxDX4snBYXIdERc4qlCmqgYDjl4-O97YhuD~eW1zIXZd2xekSdw9BuzllQxZaNEenloWE-lDV2nFVO78svrHWbRqZyk4RmLa24cZFawO5ZGm6rYm4mmffrWFeYrU~yvp41l6VJXQRAwEtF7jfEQ__"
                alt="Weight plates organized on rack"
                className="w-full h-48 object-cover rounded-lg mb-4"
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

      {/* CTA Block */}
      <section className="relative bg-white overflow-hidden">
        <div 
          className="absolute inset-0 opacity-3"
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
            className="fade-in-on-scroll bg-[#111827] hover:bg-[#1F2937] text-white px-8 py-4 h-12 rounded-lg text-base font-semibold transition-all duration-150 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
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
          transition: opacity 300ms ease-out;
        }

        .fade-in-on-scroll.fade-in-visible {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

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
              className={`bg-[#111827] hover:bg-[#1F2937] text-white px-8 py-4 h-12 rounded-lg text-base font-semibold transition-all duration-150 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
              style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              Start tracking free
            </Button>
          </div>
          
          {/* Hero Image */}
          <div className="mt-16 max-w-2xl mx-auto">
            <img 
              src="https://private-us-east-1.manuscdn.com/sessionFile/QYf23oqm9rdq1J7U9jDEhg/sandbox/BpQeUFyBYinThMaa6ET6YB-img-1_1770073252000_na1fn_c3RyYXZhLXBhcml0eS1zcXVhdA.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUVlmMjNvcW05cmRxMUo3VTlqREVoZy9zYW5kYm94L0JwUWVVRnlCWWluVGhNYWE2RVQ2WUItaW1nLTFfMTc3MDA3MzI1MjAwMF9uYTFmbl9jM1J5WVhaaExYQmhjbWwwZVMxemNYVmhkQS5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=lPmofC3eey0AI0dAK6RqBu-jvne8MuOu3MQO39n4gB~hi2BGlv6fGN05gVpHTK27SzKhM5eXFiKTGn1plfY5HsMLHjJQCiHce7LxjR-WgIwKkETnm41wK-MQ-FvesyiOCm2Uu7aOCj68I0YNufkOJYlzxITR7uz8ku5iK9CzolyB6QntUAQTqvPUJoVlPCa~hNRYtjdrKdHfJ3~zE5awzuwwyDc9j6LF1cU7Hv8gsM0aRudl5CfxZXqJnE9MThnd-0PFtWO38o9E34d24dw2Pd1sqCBh6nXbFLWLSAQyT5gPvNgUPk7cCkOpvIMmd2QmqNFDKpysmkXW4Ir-ABKyQQ__"
              alt="Athlete performing squat with focused form"
              className="w-full h-auto rounded-xl border border-[#E6E4E1]"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="relative bg-[#F7F5F2] overflow-hidden">
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url('https://private-us-east-1.manuscdn.com/sessionFile/QYf23oqm9rdq1J7U9jDEhg/sandbox/BpQeUFyBYinThMaa6ET6YB-img-3_1770073236000_na1fn_c3RyYXZhLXBhcml0eS1iYXJiZWxsLWRldGFpbA.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUVlmMjNvcW05cmRxMUo3VTlqREVoZy9zYW5kYm94L0JwUWVVRnlCWWluVGhNYWE2RVQ2WUItaW1nLTNfMTc3MDA3MzIzNjAwMF9uYTFmbl9jM1J5WVhaaExYQmhjbWwwZVMxaVlYSmlaV3hzTFdSbGRHRnBiQS5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=k893pgNihcuOWIBUkMkRTqgQc0fQDfd~UPA62yV8lQJa-3GFq~jXhCMVnWss3lOUPuj~Tk6wjTezMQF5pjWAqDWko1eUiAflW24ZW9GBDU3B2NbPZ31weJHPiCUIJZq6FdGsXSlV0syayAJFhspH2YflWcXzIGwbNnhmrll6Ev5F0U5aGsOq4zXObWLsEnOTGJqcWvl83id5hFOh3aQpwmnPEZLFzQW9t7LsZkCCQZkTbuuFNx~7z-QwHBwkMVTu9WOtN8bYH3Xy3-SKf-1~2yAqTyqlagCYF~p3pDOQJiiosuKN4N5oDWzTxTAcSXXuPASkGS25FKxNKAGEem~40Q__')`,
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

      {/* Core Value Proposition Section */}
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
              src="https://private-us-east-1.manuscdn.com/sessionFile/QYf23oqm9rdq1J7U9jDEhg/sandbox/BpQeUFyBYinThMaa6ET6YB-img-2_1770073207000_na1fn_c3RyYXZhLXBhcml0eS1kZWFkbGlmdC1zZXR1cA.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUVlmMjNvcW05cmRxMUo3VTlqREVoZy9zYW5kYm94L0JwUWVVRnlCWWluVGhNYWE2RVQ2WUItaW1nLTJfMTc3MDA3MzIwNzAwMF9uYTFmbl9jM1J5WVhaaExYQmhjbWwwZVMxa1pXRmtiR2xtZEMxelpYUjFjQS5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=DC59vmcCmSiKC9bZoKNEmumdc74Az7LPYxj-1HI6Jcu5SnFo6OD2PtTxN8sa-gfQSAX3xA0KUstu493xVsdyE4NXc2ap6apyDbwC9naYcDx8NVJnsSwV4NQbpri~~grez23EIGYZtClmy87e9q6hxO0HL3DWSYIr6cYE6MiXLPQYKwsFOXc5f6o8AdUQUHHBI9dwnwTNfONuL2sTvIHGvZ-mLyytJXY-3pQnxwXOge868gobBWFKTdGRzDceF-Q4Kfe4PIAITppmpfqnO1kl9UCn1-GlWTS4xQ63zLfRs63CcOXxWqy9lSf-xwwGgWY3wrC2rdrzqB0U9~uwkPZHxA__"
              alt="Athlete preparing for deadlift with calm focus"
              className="fade-in-on-scroll w-full h-auto rounded-xl border border-[#E6E4E1]"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Feature Proof Section (3 cards) */}
      <section className="bg-[#F7F5F2]">
        <div className="container mx-auto px-5 md:px-10 py-20 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <Card className="fade-in-on-scroll p-6 bg-white border border-[#E6E4E1] rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <img 
                src="https://private-us-east-1.manuscdn.com/sessionFile/QYf23oqm9rdq1J7U9jDEhg/sandbox/BpQeUFyBYinThMaa6ET6YB-img-4_1770073216000_na1fn_c3RyYXZhLXBhcml0eS1kdW1iYmVsbC1iZW5jaA.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUVlmMjNvcW05cmRxMUo3VTlqREVoZy9zYW5kYm94L0JwUWVVRnlCWWluVGhNYWE2RVQ2WUItaW1nLTRfMTc3MDA3MzIxNjAwMF9uYTFmbl9jM1J5WVhaaExYQmhjbWwwZVMxa2RXMWlZbVZzYkMxaVpXNWphQS5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=UjvlrEuy88FbUXaNf9er07SHiyQgtHOgvNgiOCPi0qmA-4lKDf6-rIWaHfoGKhdI2ZaZqmGtzXLrrri1vH9rbWCc6xxK6rQOdfAiH2PnATW8~zlqLZUvkROey0c-9iBNmheI~TkS-1ch-GP9Q-xfdPfq5PgPI~-JEvesRw7retvgzr71amsvQx0SC8zaTh34AMsuQrqe~sK5A7o-YMUHQN57m1QLrbLgtXqd50hgrDMUzYpRxF~2GHKo3fO7jUVb7gdx4WayOTR6tdh4Egl1iE0r-4gHxgDzm5WXTJAqueNHLJMxMxubW~vhcBVKWzwcm5QKk8fG3G-I6wQhTNyW1g__"
                alt="Dumbbell on bench"
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
            <Card className="fade-in-on-scroll p-6 bg-white border border-[#E6E4E1] rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <img 
                src="https://private-us-east-1.manuscdn.com/sessionFile/QYf23oqm9rdq1J7U9jDEhg/sandbox/BpQeUFyBYinThMaa6ET6YB-img-5_1770073202000_na1fn_c3RyYXZhLXBhcml0eS13ZWlnaHQtcmFjaw.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUVlmMjNvcW05cmRxMUo3VTlqREVoZy9zYW5kYm94L0JwUWVVRnlCWWluVGhNYWE2RVQ2WUItaW1nLTVfMTc3MDA3MzIwMjAwMF9uYTFmbl9jM1J5WVhaaExYQmhjbWwwZVMxM1pXbG5hSFF0Y21GamF3LmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=F1N5URpKMJthOO9xYbgDwPghWOsjBgFjGMxP~OARJuXQWW~Op-FkPuzp2lmob7rzQJ7NNVzh46nxyHnLjXtHB-Nd4brhSyl6l60bdF9XDDh-74IuEFv6jGUo0VwlR8YqsS8r38iw5Q29iZyVxd1dpTYZsDCYjcKi6g~GNaef2XDJ4t~2cvEsGBmrTwvjSx~NLNd8EcW0fNU6aWeZIz0eDsoJqGaMmukDaM8i65fUHk8r~92vYqBVufdUrpd2cnrEPIntLZGpIP1nGiZ0dhU1zhMJl2Zs9LeFpTZTZ5YyHub9UJXP~o~Z4Ta68TboFK3fVLpRW1nll4bbJkH-SNjvCg__"
                alt="Weight plates organized on rack"
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
            <Card className="fade-in-on-scroll p-6 bg-white border border-[#E6E4E1] rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <div className="w-full h-48 bg-[#F7F5F2] rounded-lg mb-4 flex items-center justify-center border border-[#E6E4E1]">
                <svg className="w-16 h-16 text-[#6B6F76]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
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
          transition: opacity 300ms ease-out;
        }

        .fade-in-on-scroll.fade-in-visible {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

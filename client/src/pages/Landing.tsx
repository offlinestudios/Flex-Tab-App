import {
  ArrowUpRight,
  Check,
  Dumbbell,
  ChartNoAxesCombined,
  Repeat2,
} from "lucide-react";
import { isNativeShell } from "@/lib/api";
import "./launch.css";

const features = [
  {
    icon: Dumbbell,
    number: "01",
    title: "Make every set count.",
    text: "Log your exercises, sets, reps and weight. Keep your attention on the next rep.",
  },
  {
    icon: ChartNoAxesCombined,
    number: "02",
    title: "See the work add up.",
    text: "Look back at your training and follow your strength over time.",
  },
  {
    icon: Repeat2,
    number: "03",
    title: "More ways to see progress.",
    text: "Keep body measurements alongside your training history, all in one place.",
  },
];

export default function Landing() {
  const native = isNativeShell();
  return (
    <div className={`ft-launch${native ? " ft-launch-native" : ""}`}>
      <a className="ft-skip" href="#main">
        Skip to content
      </a>
      <header className="ft-nav">
        <a className="ft-wordmark" href="/" aria-label="FlexTab home">
          <img src="/flextab-logo.png?v=2" alt="" />
          flextab
        </a>
        <nav aria-label="Main navigation">
          <a className="ft-feature-link" href="#features">
            The app
          </a>
          <a href="/sign-in">
            Sign in <ArrowUpRight size={16} />
          </a>
        </nav>
      </header>
      <main id="main">
        <section className="ft-hero">
          <div className="ft-hero-copy">
            <p className="ft-eyebrow">YOUR TRAINING. YOUR PROGRESS.</p>
            <h1>
              Put your
              <br />
              work <span>on record.</span>
            </h1>
            <p className="ft-lede">
              The workout log that goes where you train. Record every set, build
              your routines, and see how far you’ve come.
            </p>
            <a className="ft-primary" href="/sign-up">
              {native ? "Start training free" : "Try FlexTab free"}{" "}
              <ArrowUpRight size={21} />
            </a>
            <p className="ft-launch-note">
              {native
                ? "Already training with us? Sign in above."
                : "Coming to iPhone. Train on the web today."}
            </p>
            <div className="ft-benefits">
              <span>
                <Check size={15} /> Free to use
              </span>
              <span>
                <Check size={15} /> Your log, wherever you train
              </span>
            </div>
          </div>
          <div className="ft-hero-visual">
            <img
              className="ft-athlete"
              src="/athlete-launch-v2.png"
              alt="Athlete training in a gym"
            />
            <div className="ft-photo-shade" />
          </div>
        </section>
        <div className="ft-strip">
          <span>SETS. REPS. PROGRESS.</span>
          <span>
            BUILT FOR YOUR NEXT WORKOUT <ArrowUpRight size={18} />
          </span>
        </div>
        <section id="features" className="ft-features">
          <div className="ft-section-heading">
            <p className="ft-eyebrow">A LITTLE STRUCTURE. A LOT OF PROGRESS.</p>
            <h2>
              Your training,
              <br />
              all together.
            </h2>
            <p>
              From your first working set to your next personal best, keep a
              record you can build on.
            </p>
          </div>
          <div className="ft-feature-grid">
            {features.map(({ icon: Icon, ...f }) => (
              <article key={f.number} className="ft-feature">
                <div className="ft-feature-number">
                  <Icon size={24} />
                  <span>{f.number}</span>
                </div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="ft-final">
          <p className="ft-eyebrow">START WITH YOUR NEXT SET.</p>
          <h2>
            Make consistency
            <br />
            something you can see.
          </h2>
          <a className="ft-primary" href="/sign-up">
            Create your free account <ArrowUpRight size={21} />
          </a>
          <p>
            Already have an account? <a href="/sign-in">Sign in</a>
          </p>
        </section>
      </main>
      <footer className="ft-footer">
        <a className="ft-wordmark" href="/">
          flextab
        </a>
        <p>Keep showing up.</p>
        <nav aria-label="Footer">
          <a href="/support">Support</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
        <small>© {new Date().getFullYear()} FlexTab</small>
      </footer>
    </div>
  );
}

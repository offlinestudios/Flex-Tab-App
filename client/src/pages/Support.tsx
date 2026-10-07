export default function Support() {
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border px-6 py-5"><a href="/" className="font-bold text-xl">FlexTab</a></header>
    <main className="mx-auto max-w-2xl px-6 py-10 space-y-8">
      <div><h1 className="text-3xl font-bold">FlexTab support</h1><p className="mt-3 text-muted-foreground">Help with your account, workout log and community features.</p></div>
      <section className="space-y-3"><h2 className="text-xl font-semibold">Contact us or send feedback</h2>
        <p>Email <a className="underline" href="mailto:support@flextab.app?subject=FlexTab%20Support">support@flextab.app</a>.</p>
        <p>For a technical problem, include your device model, app version, what you were trying to do and any error message. Please leave passwords, sign-in codes and private workout information out of your message.</p>
      </section>
      <section className="space-y-3"><h2 className="text-xl font-semibold">Trouble signing in?</h2>
        <p>Use the same sign-in method you used when creating your account. If you use an email and password, choose “Forgot password?” on the sign-in screen and follow the reset email.</p>
        <a className="underline" href="/sign-in">Go to sign in</a>
      </section>
      <section className="space-y-3"><h2 className="text-xl font-semibold">A workout is not loading</h2>
        <p>Check your internet connection and the date selected in your workout log. If the problem continues, contact support with the steps that led to it.</p>
      </section>
      <section className="space-y-3"><h2 className="text-xl font-semibold">Community safety</h2>
        <p>Use the report action on a post or comment to send it for moderation review. You can also block or mute someone from their profile. Manage these choices under Profile → Settings → Blocked &amp; Muted.</p>
        <p>If you cannot access the content, contact support with enough detail to help us locate it.</p>
      </section>
      <section className="space-y-3"><h2 className="text-xl font-semibold">Delete your account</h2>
        <p>Sign in and open the account deletion page to request removal of your account and associated data. The page explains the process before you confirm.</p>
        <a className="underline" href="/delete-account">Account deletion</a>
      </section>
      <footer className="border-t border-border pt-6 flex gap-6"><a className="underline" href="/privacy">Privacy policy</a><a className="underline" href="/terms">Terms of service</a></footer>
    </main>
  </div>;
}

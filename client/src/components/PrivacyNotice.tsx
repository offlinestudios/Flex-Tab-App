export function PrivacyNotice() {
  return <div className="space-y-4 text-sm leading-relaxed">
    <p>Your profile name, photo, bio, fitness goal and community posts are visible to other FlexTab members. Your workout log and measurements stay out of the community feed unless you choose to share them.</p>
    <p>FlexTab does not currently offer private or followers-only profiles. Shared photos, videos and workout images use links that can be forwarded.</p>
    <p>To stop interacting with someone, use <strong>Block</strong> from their profile menu. Blocking hides your profiles and posts from each other inside FlexTab and prevents follows, likes and comments between you. It cannot recall media links or copies already shared.</p>
    <p><strong>Mute</strong> hides someone’s posts from your feed without notifying them. They can still view your profile and posts.</p>
    <a className="inline-block underline" href="/privacy">Read the privacy policy</a>
  </div>;
}

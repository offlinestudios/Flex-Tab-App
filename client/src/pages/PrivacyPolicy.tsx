export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E6E4E1]">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/flextab-icon.png" alt="FlexTab" className="h-8 w-8" />
            <span className="text-xl font-bold text-[#0B0B0C]">flextab</span>
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold text-[#0B0B0C] mb-4">Privacy Policy</h1>
        <p className="text-sm text-[#6B6F76] mb-12">Last updated: February 9, 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#0B0B0C] mb-4">Introduction</h2>
            <p className="text-base leading-relaxed text-[#6B6F76] mb-4">
              FlexTab ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our workout tracking application and related services (collectively, the "Service"). By using FlexTab, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#0B0B0C] mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-[#0B0B0C] mb-3 mt-6">Personal Information</h3>
            <p className="text-base leading-relaxed text-[#6B6F76] mb-4">
              When you create an account with FlexTab, we collect personal information that you voluntarily provide, including your name, email address, and authentication credentials. This information is necessary to create and maintain your account, provide personalized services, and communicate with you about your use of the Service.
            </p>

            <h3 className="text-xl font-semibold text-[#0B0B0C] mb-3 mt-6">Workout Data</h3>
            <p className="text-base leading-relaxed text-[#6B6F76] mb-4">
              FlexTab collects and stores the workout information you enter into the application, including exercise names, sets, repetitions, weight lifted, workout dates and times, body measurements (weight, chest, waist, arms, thighs), custom exercises you create, and workout notes or comments. This data is essential to providing our core service of tracking your fitness progress and generating insights about your training.
            </p>

            <h3 className="text-xl font-semibold text-[#0B0B0C] mb-3 mt-6">Usage Information</h3>
            <p className="text-base leading-relaxed text-[#6B6F76] mb-4">
              We automatically collect certain information about your device and how you interact with our Service. This includes device information (type, operating system, unique device identifiers), log data (IP address, browser type, pages visited, time spent), and usage patterns (features used, frequency of use, session duration). This information helps us improve our Service and provide technical support.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#0B0B0C] mb-4">How We Use Your Information</h2>
            <p className="text-base leading-relaxed text-[#6B6F76] mb-4">
              We use the collected information to provide, maintain, and improve our Service. Specifically, we use your data to create and manage your account, store and display your workout history, generate progress charts and statistics, enable you to track body measurements over time, provide personalized workout insights, send you service-related notifications and updates, respond to your support requests, and improve our application based on usage patterns.
            </p>
            <p className="text-base leading-relaxed text-[#6B6F76] mb-4">
              We do not sell your personal information to third parties. We do not use your workout data for advertising purposes. Your fitness data remains private and is only visible to you unless you explicitly choose to share it.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#0B0B0C] mb-4">Data Storage and Security</h2>
            <p className="text-base leading-relaxed text-[#6B6F76] mb-4">
              Your data is stored on secure servers with industry-standard encryption both in transit and at rest. We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security.
            </p>
            <p className="text-base leading-relaxed text-[#6B6F76] mb-4">
              We retain your personal information and workout data for as long as your account is active or as needed to provide you services. If you delete your account, we will delete or anonymize your personal information within a reasonable timeframe, except where we are required to retain it for legal compliance.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#0B0B0C] mb-4">Data Sharing and Disclosure</h2>
            <p className="text-base leading-relaxed text-[#6B6F76] mb-4">
              We do not share your personal information or workout data with third parties except in the following limited circumstances: with service providers who assist us in operating our Service (such as cloud hosting providers), subject to strict confidentiality agreements; when required by law, such as to comply with a subpoena or similar legal process; to protect the rights, property, or safety of FlexTab, our users, or others; or with your explicit consent.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#0B0B0C] mb-4">Your Rights and Choices</h2>
            <p className="text-base leading-relaxed text-[#6B6F76] mb-4">
              You have the right to access, update, or delete your personal information at any time through your account settings. You can export your workout data in a portable format. You may delete your account, which will result in the deletion of your personal information and workout data. You can opt out of non-essential communications from us while still receiving important service-related notifications.
            </p>
            <p className="text-base leading-relaxed text-[#6B6F76] mb-4">
              If you are located in the European Economic Area (EEA), you have additional rights under the General Data Protection Regulation (GDPR), including the right to data portability, the right to object to processing, and the right to lodge a complaint with a supervisory authority.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#0B0B0C] mb-4">Children's Privacy</h2>
            <p className="text-base leading-relaxed text-[#6B6F76] mb-4">
              FlexTab is not intended for use by individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information promptly.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#0B0B0C] mb-4">Changes to This Privacy Policy</h2>
            <p className="text-base leading-relaxed text-[#6B6F76] mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#0B0B0C] mb-4">Contact Us</h2>
            <p className="text-base leading-relaxed text-[#6B6F76] mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-base leading-relaxed text-[#6B6F76] mb-2">
              <strong>Email:</strong> privacy@flextab.app
            </p>
            <p className="text-base leading-relaxed text-[#6B6F76]">
              We will respond to your inquiry within a reasonable timeframe.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E6E4E1] py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-[#6B6F76]">
            © 2026 FlexTab. Built for serious lifters.
          </p>
        </div>
      </footer>
    </div>
  );
}

import type { Metadata } from "next";
import { COMPANY_NAME, COMPANY_URL, APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: March 24, 2026</p>

      <div className="prose prose-zinc mt-8 max-w-none dark:prose-invert text-sm leading-relaxed space-y-6">
        <section>
          <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
          <p>By accessing or using {APP_NAME} (the &quot;Service&quot;), operated by {COMPANY_NAME}, you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. Description of Service</h2>
          <p>{APP_NAME} provides a document conversion API that converts documents to Markdown and PDF formats. The Service is provided &quot;as is&quot; and &quot;as available.&quot;</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">3. Account Registration</h2>
          <p>You must register for an account to use the API. You are responsible for maintaining the confidentiality of your API keys and account credentials. You must provide accurate information and are responsible for all activity under your account.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">4. Acceptable Use</h2>
          <p>You agree not to: upload malicious files or content; attempt to circumvent rate limits; use the Service for illegal purposes; reverse engineer the Service; share API keys with unauthorized parties; or upload content you do not have the right to process.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">5. Document Handling</h2>
          <p>Documents uploaded to the Service are temporarily stored for up to 24 hours to enable download of converted files. After 24 hours, all documents are automatically and permanently deleted. You retain all rights to your documents. We claim no ownership over content you upload.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">6. Rate Limits & Usage</h2>
          <p>The free tier includes 100 API requests per hour and a 10MB file size limit. We reserve the right to modify these limits with reasonable notice. Exceeding rate limits will result in HTTP 429 responses.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">7. API Keys</h2>
          <p>API keys are confidential credentials. You are responsible for securing your API keys. If you believe a key has been compromised, revoke it immediately from your dashboard. We are not liable for unauthorized use of your API keys.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">8. Intellectual Property</h2>
          <p>The Service, including its design, code, and documentation, is owned by {COMPANY_NAME}. You retain all rights to documents you upload and the converted output.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">9. Limitation of Liability</h2>
          <p>{COMPANY_NAME} shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim (if any).</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">10. Disclaimer of Warranties</h2>
          <p>The Service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that conversions will be error-free or that the Service will be uninterrupted. Conversion quality depends on the input document format and complexity.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">11. Termination</h2>
          <p>We may suspend or terminate your account at any time for violation of these Terms. You may delete your account at any time. Upon termination, your API keys will be revoked and any stored documents will be deleted.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">12. Changes to Terms</h2>
          <p>We may modify these Terms at any time. Material changes will be communicated via email or a notice on the Service. Continued use after changes constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">13. Contact</h2>
          <p>For questions about these Terms, contact us at: <a href="mailto:legal@bramkas.com" className="text-indigo-600 underline">legal@bramkas.com</a> or visit <a href={COMPANY_URL} className="text-indigo-600 underline">{COMPANY_URL}</a>.</p>
        </section>
      </div>
    </div>
  );
}

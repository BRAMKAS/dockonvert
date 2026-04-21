import type { Metadata } from "next";
import { COMPANY_NAME, COMPANY_URL, APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: March 24, 2026</p>

      <div className="prose prose-zinc mt-8 max-w-none dark:prose-invert text-sm leading-relaxed space-y-6">
        <section>
          <h2 className="text-xl font-semibold">1. Introduction</h2>
          <p>{COMPANY_NAME} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the {APP_NAME} service. This Privacy Policy explains how we collect, use, and protect your information when you use our document conversion API and website.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. Information We Collect</h2>
          <p><strong>Account Information:</strong> When you register, we collect your name, email address, and authentication credentials. If you sign in via Google or GitHub, we receive your profile information from those providers.</p>
          <p><strong>Usage Data:</strong> We collect API usage metrics including request counts, endpoints accessed, response times, and error rates. This data is used for rate limiting and service improvement.</p>
          <p><strong>Documents:</strong> Documents uploaded for conversion are temporarily stored for up to 24 hours solely to enable you to download the converted output. After 24 hours, all documents (input and output) are automatically and permanently deleted.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
          <p>We use your information to: provide and maintain the service; authenticate your identity; enforce rate limits; send service-related communications; improve the service; and comply with legal obligations.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">4. Document Processing</h2>
          <p>We do not permanently store your documents. All uploaded files are processed in memory where possible and temporarily cached for download purposes only. Documents are automatically purged after 24 hours. We do not read, analyze, train on, or share the content of your documents.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">5. Data Storage & Security</h2>
          <p>Account data is stored in Cloudflare D1 databases. Temporary document files are stored in Cloudflare R2 with automatic lifecycle policies for deletion. All data is encrypted in transit (TLS) and at rest.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">6. Third-Party Services</h2>
          <p>We use the following third-party services: Cloudflare (infrastructure, CDN, storage); Google and GitHub (optional OAuth authentication). We do not sell your data to third parties.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">7. Your Rights</h2>
          <p>You may: access, update, or delete your account information; revoke API keys at any time; request a copy of your data; and request account deletion. Contact us at privacy@bramkas.com for any requests.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">8. Cookies</h2>
          <p>We use essential cookies for authentication and session management. We do not use tracking or advertising cookies.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">10. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, contact us at: <a href="mailto:privacy@bramkas.com" className="text-indigo-600 underline">privacy@bramkas.com</a> or visit <a href={COMPANY_URL} className="text-indigo-600 underline">{COMPANY_URL}</a>.</p>
        </section>
      </div>
    </div>
  );
}

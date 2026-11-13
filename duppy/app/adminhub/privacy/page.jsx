import Legal from "@/components/AdminHub/Legal";

export const metadata = { title: "Privacy Policy · DUPSCALED Admin Hub" };

export default function Privacy() {
  return (
    <Legal tag="Admin_hub" title="Privacy Policy" updated="13 November 2026">
      <p>
        This policy explains what personal data the DUPSCALED Admin Hub (dupscaled.com/adminhub) and the client
        portal (dupscaled.com/portal) handle, why, and what your choices are. The controller is DUPSCALED (Dalibor
        Přikryl), Prague, Czech Republic. Contact: <a href="mailto:info@dupscaled.com">info@dupscaled.com</a>.
      </p>

      <h2>1. Data we handle</h2>
      <h3>Team members</h3>
      <p>
        When you sign in with Google we receive your name, email address and profile picture from your Google
        account. We use the email address to check that you are on the team list and to record who created or changed
        something in the hub. We do not receive your Google password.
      </p>
      <h3>The agency mailbox (Gmail)</h3>
      <p>
        If an administrator connects the agency&apos;s own Gmail mailbox, the hub uses Google&apos;s Gmail API with two
        permissions: creating drafts, and reading messages. It uses them only to place outreach drafts in that
        mailbox, to see whether a draft was sent, and to see whether the recipient replied or the message bounced.
        For this it reads message metadata (sender, labels, dates, thread) of the conversations it started. It does
        not send email, and it does not read or store the content of other mail in the mailbox.
      </p>
      <h3>Outreach contacts</h3>
      <p>
        For business outreach we keep the name, business contact email, public channel links and notes about the
        public content of creators, organisations and brands we may want to work with. Email addresses are taken only
        from the contact&apos;s own official pages, never from data brokers. We also keep the emails we drafted to them
        and the status of the conversation.
      </p>
      <h3>Clients</h3>
      <p>
        For clients we keep the client&apos;s name, the login email, a hashed password, the deliverables we are working
        on, audience figures for the client&apos;s channels, weekly reports, and, visible to administrators only, the
        agreed monthly fee and whether it has been paid.
      </p>
      <h3>Audit pages</h3>
      <p>
        When someone opens an audit page we prepared for them, we count that the page was opened and when. We do not
        record who opened it, their IP address or their device.
      </p>

      <h2>2. Why we handle it</h2>
      <ul>
        <li>to give the right people access to the hub and keep everyone else out (legitimate interest, contract);</li>
        <li>to contact businesses and creators about our services and follow up (legitimate interest);</li>
        <li>to deliver and report on the work we do for clients (contract);</li>
        <li>to keep an overview of the agency&apos;s income (legitimate interest, legal obligations).</li>
      </ul>

      <h2>3. Google user data</h2>
      <p>
        The hub&apos;s use and transfer of information received from Google APIs adheres to the{" "}
        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements. In particular:
      </p>
      <ul>
        <li>Google user data is used only to provide the features described above;</li>
        <li>it is not sold, and not used for advertising;</li>
        <li>it is not used to train general-purpose AI or machine learning models;</li>
        <li>
          people do not read it, except where you ask us to for support, where it is needed for security, or where
          the law requires it.
        </li>
      </ul>
      <p>
        The key that gives the hub access to the connected mailbox is stored encrypted. An administrator can
        disconnect the mailbox at any time in Settings, and access can also be withdrawn at{" "}
        <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">
          myaccount.google.com/permissions
        </a>
        .
      </p>

      <h2>4. Who else processes the data</h2>
      <p>We use these providers to run the hub. Each processes data only on our instructions:</p>
      <ul>
        <li>Vercel (hosting);</li>
        <li>Neon (database, stored in the EU);</li>
        <li>Google (sign-in and the Gmail mailbox);</li>
        <li>
          Anthropic (the AI model that researches public information and writes drafts; it receives the public
          details of an outreach contact or client channel, not your Google account data or mailbox content).
        </li>
      </ul>
      <p>
        Some of these providers are based outside the European Economic Area. Where data is transferred there, it is
        covered by the safeguards the provider offers, such as the EU standard contractual clauses or the EU-US Data
        Privacy Framework. We do not sell personal data to anyone.
      </p>

      <h2>5. How long we keep it</h2>
      <ul>
        <li>team accounts: until the person is removed from the team list;</li>
        <li>outreach contacts: while the conversation is active and for up to 24 months after the last contact;</li>
        <li>client data: for the length of the cooperation and as long afterwards as the law requires;</li>
        <li>the mailbox connection: until an administrator disconnects it.</li>
      </ul>

      <h2>6. Security</h2>
      <p>
        Access to the hub requires sign-in and is limited to invited accounts. Client passwords are stored only as
        hashes, the mailbox key is encrypted, connections use HTTPS, and pricing and finance are visible to
        administrators only.
      </p>

      <h2>7. Your rights</h2>
      <p>
        Under the GDPR you can ask us for a copy of your personal data, ask us to correct or delete it, object to or
        restrict its use, and ask for it in a portable form. If we contacted you about our services and you do not
        want to hear from us again, tell us and we will stop and remove your details. Write to{" "}
        <a href="mailto:info@dupscaled.com">info@dupscaled.com</a>. You can also complain to the Czech Office for
        Personal Data Protection (uoou.gov.cz).
      </p>

      <h2>8. Cookies</h2>
      <p>
        The hub and the portal use only the cookies needed to keep you signed in. There are no advertising or
        analytics cookies.
      </p>

      <h2>9. Changes</h2>
      <p>We may update this policy. The date at the top shows the latest version.</p>
    </Legal>
  );
}

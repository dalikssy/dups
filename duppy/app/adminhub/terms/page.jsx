import Legal from "@/components/AdminHub/Legal";

export const metadata = { title: "Terms of Service · DUPSCALED Admin Hub" };

export default function Terms() {
  return (
    <Legal tag="Admin_hub" title="Terms of Service" updated="13 November 2026">
      <p>
        These terms cover the DUPSCALED Admin Hub at dupscaled.com/adminhub and the client portal at
        dupscaled.com/portal (together, the hub). The hub is operated by DUPSCALED (Dalibor Přikryl), Prague, Czech
        Republic. Questions go to <a href="mailto:info@dupscaled.com">info@dupscaled.com</a>.
      </p>

      <h2>1. What the hub is</h2>
      <p>
        The hub is an internal working tool of the agency. The team uses it to research outreach contacts, prepare
        email drafts, follow the sales pipeline, manage client work and keep an overview of the agency&apos;s income.
        Clients use the portal to see their own deliverables, numbers and weekly reports. It is not a public service
        and there is no sign-up.
      </p>

      <h2>2. Who may use it</h2>
      <p>
        Access is by invitation only. Team members sign in with a Google account that an administrator has added to
        the team list. Clients sign in with the email and password they receive from DUPSCALED. You are responsible
        for keeping your sign-in details to yourself and for what is done under your account. Tell us straight away
        if you think someone else has access to it.
      </p>

      <h2>3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use the hub for anything other than DUPSCALED&apos;s business or your own client account;</li>
        <li>try to reach data, accounts or parts of the hub you were not given access to;</li>
        <li>copy, export or pass on contact data, client data or pricing from the hub outside the agency;</li>
        <li>disrupt the hub, probe it for weaknesses, or get around its sign-in and access controls;</li>
        <li>use it to send unlawful, misleading or unsolicited bulk messages.</li>
      </ul>

      <h2>4. Google account and Gmail</h2>
      <p>
        Team members sign in with Google. An administrator may also connect the agency mailbox so that the hub can
        place email drafts in it and see which drafts were sent and answered. The hub never sends email on its own:
        every message is reviewed and sent by a person. How this data is handled is described in the{" "}
        <a href="/adminhub/privacy">Privacy Policy</a>.
      </p>

      <h2>5. Content produced with AI</h2>
      <p>
        Lead research, email drafts, audits, price estimates and strategy suggestions in the hub are generated with
        the help of an AI model and may contain mistakes. They are working material. The person using them is
        responsible for checking facts, figures and wording before anything is sent to a third party or relied on.
      </p>

      <h2>6. Client portal</h2>
      <p>
        Figures and reports in the portal are entered by the DUPSCALED team and are provided for information. They do
        not replace the terms of the contract between DUPSCALED and the client, which take priority if the two differ.
      </p>

      <h2>7. Availability and changes</h2>
      <p>
        The hub is provided as it is. We work to keep it available and correct, but we do not guarantee that it will
        be uninterrupted or free of errors, and we may change, suspend or retire any part of it. We may also end or
        suspend access for any account, in particular when these terms are broken or a working relationship ends.
      </p>

      <h2>8. Liability</h2>
      <p>
        To the extent the law allows, DUPSCALED is not liable for indirect or consequential loss arising from use of
        the hub, or for decisions made on the basis of AI-generated content in it. Nothing in these terms limits
        liability that cannot be limited by law.
      </p>

      <h2>9. Governing law</h2>
      <p>
        These terms are governed by the law of the Czech Republic. Disputes are for the courts of the Czech Republic,
        unless mandatory law gives you the right to bring them elsewhere.
      </p>

      <h2>10. Changes to these terms</h2>
      <p>
        We may update these terms. The date at the top shows the latest version. Continuing to use the hub after a
        change means you accept the updated terms.
      </p>
    </Legal>
  );
}

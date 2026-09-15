import MarketingNav from '../components/layout/MarketingNav';
import Footer from '../components/layout/Footer';

const UPDATED = '15 September 2026';

const Section = ({ title, children }) => (
  <section className="mt-10">
    <h2 className="text-xl font-bold">{title}</h2>
    <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-600">{children}</div>
  </section>
);

const Shell = ({ title, children }) => (
  <div className="flex min-h-screen flex-col bg-white">
    <MarketingNav />

    <main className="flex-1 bg-ink-950 pb-px pt-20">
      <div className="container-page py-14">
        <h1 className="font-display text-4xl font-extrabold text-white">{title}</h1>
        <p className="mt-2 text-sm text-white/50">Last updated {UPDATED}</p>
      </div>
    </main>

    <div className="container-page max-w-3xl py-14">{children}</div>

    <Footer />
  </div>
);

export const Privacy = () => (
  <Shell title="Privacy">
    <p className="text-sm leading-relaxed text-ink-600">
      This describes what BUDDYFI stores about you, why, and how to get rid of it. It is
      written to be read, not to be survived.
    </p>

    <Section title="What we store">
      <p>
        <strong>Your account:</strong> name, email address, age and gender. The email is
        used to sign you in, confirm your account and send password resets.
      </p>
      <p>
        <strong>Your answers:</strong> what you picked for each quiz question. These decide
        who we show you, and other members see them on your profile.
      </p>
      <p>
        <strong>Your profile:</strong> your photo, bio and interests, if you add them.
      </p>
      <p>
        <strong>Your location:</strong> one pair of coordinates, only if you choose to
        share it. Other members never see your coordinates — only a rounded distance, and
        anything under 2&nbsp;km is shown as &ldquo;Under 2 km&rdquo;.
      </p>
      <p>
        <strong>Your messages:</strong> stored so you can read them again. We do not read
        them except when investigating a report.
      </p>
      <p>
        <strong>Sessions:</strong> the browser and rough time of each sign-in, so you can
        recognise and end them.
      </p>
    </Section>

    <Section title="What other members can see">
      <p>
        Your name, age, gender, photo, bio, interests and quiz answers. Your distance, if
        you share your location. Whether you are online, if you leave that switched on.
      </p>
      <p>
        <strong>Your email address is never shown to another member.</strong>
      </p>
    </Section>

    <Section title="What we never do">
      <p>We do not sell your data. We do not share it with advertisers.</p>
    </Section>

    <Section title="How long we keep it">
      <p>
        Until you delete your account. Read notifications are cleared after 90 days, and
        expired sessions clean themselves up.
      </p>
    </Section>

    <Section title="Your control">
      <p>
        You can edit or clear your profile, bio, interests, photo and location at any time
        from your profile. You can turn off presence, location matching and the weekly
        email under Settings.
      </p>
      <p>
        You can download everything we hold about you, and you can delete your account —
        both from your profile. Deleting removes your account, your messages, your
        connections and your uploaded photo. It cannot be undone.
      </p>
    </Section>

    <Section title="Contact">
      <p>Questions about any of this: reach the team through the app.</p>
    </Section>
  </Shell>
);

export const Terms = () => (
  <Shell title="Terms of service">
    <p className="text-sm leading-relaxed text-ink-600">
      The short version: be a decent person, and we will keep the service running.
    </p>

    <Section title="Who can use BUDDYFI">
      <p>
        You must be at least 13 years old. One account per person, and the information on
        it must be genuinely about you.
      </p>
    </Section>

    <Section title="How to behave">
      <p>
        Do not harass, threaten or abuse anyone. Do not impersonate another person. Do not
        post content that is illegal, hateful or sexually explicit. Do not use BUDDYFI to
        advertise or to scam people.
      </p>
      <p>
        Every profile and conversation has a block and report control. We read reports and
        act on them, which can mean removing content or closing an account.
      </p>
    </Section>

    <Section title="Your content">
      <p>
        What you write and upload stays yours. You give us permission to show it to other
        members as part of running the service, and nothing more.
      </p>
    </Section>

    <Section title="Ending it">
      <p>
        You can delete your account whenever you like. We can close an account that breaks
        these terms.
      </p>
    </Section>

    <Section title="The boring part">
      <p>
        BUDDYFI is provided as it is. We introduce people; what happens next is between
        them. Meet new people somewhere public the first time.
      </p>
    </Section>
  </Shell>
);

export const Guidelines = () => (
  <Shell title="Community guidelines">
    <p className="text-sm leading-relaxed text-ink-600">
      BUDDYFI exists to help people find friends. These are the things that keep it worth
      being part of.
    </p>

    <Section title="Be a real person">
      <p>Use your own name and your own photo. Answer the quiz honestly.</p>
    </Section>

    <Section title="Take no for an answer">
      <p>
        If someone declines your request or stops replying, leave it there. Repeatedly
        contacting someone who has not answered is harassment.
      </p>
    </Section>

    <Section title="This is not a dating app">
      <p>
        People are here for friends. Unsolicited romantic or sexual messages are the
        fastest way to get reported, and we act on those reports.
      </p>
    </Section>

    <Section title="Report things">
      <p>
        If someone is behaving badly, use the menu on their profile or in the conversation.
        Reports are anonymous — nobody is told who reported them. You can block at the same
        time, and they will not be able to see or contact you again.
      </p>
    </Section>

    <Section title="Meeting up">
      <p>
        Meet somewhere public the first time, tell someone where you are going, and leave
        if anything feels wrong. You never owe anyone your time.
      </p>
    </Section>
  </Shell>
);

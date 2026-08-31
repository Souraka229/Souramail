/** biome-ignore-all lint/a11y/useValidAnchor: marketing nav + footer are placeholder links until those routes exist */
import Link from 'next/link';
import { Icon } from '@/components/icon';
import { DomainWidget } from '@/components/landing/domain-widget';
import { Logo } from '@/components/logo';

export default function Home() {
  return (
    <>
      <header className="fixed top-0 z-50 w-full border-b border-surface-container-highest/50 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-margin">
          <div className="flex items-center gap-sm">
            <Logo className="h-8 w-8" />
            <span className="font-headline-md text-[20px] font-bold tracking-tight text-on-surface">
              SouraMAIL
            </span>
          </div>
          <nav className="hidden items-center gap-lg lg:flex">
            {['Product', 'Developers', 'AI', 'Pricing', 'Startups'].map((l, i) => (
              <a
                key={l}
                href="#"
                className={
                  i === 0
                    ? 'text-[14px] font-bold text-primary'
                    : 'font-label-md text-label-md text-on-surface-variant transition-colors hover:text-on-surface'
                }
              >
                {l}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-md">
            <Link
              href="/sign-in"
              className="px-md py-xs font-label-md text-label-md text-on-surface-variant hover:text-on-surface"
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-[#00A48A] px-lg py-sm font-label-md text-label-md text-white shadow-sm transition-all hover:bg-[#008f78]"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full pt-16">
        {/* Hero */}
        <section className="mesh-gradient bg-grid-pattern relative z-10 mx-auto flex min-h-[70vh] w-full max-w-7xl flex-col items-center justify-center px-margin pb-3xl pt-4xl text-center">
          <div className="flex max-w-[800px] flex-col items-center gap-lg">
            <div className="flex items-center gap-sm rounded-full border border-[#00A48A]/20 bg-surface-container-lowest px-md py-xs shadow-sm">
              <Icon name="bolt" className="text-[16px] text-[#00A48A]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#00A48A]">
                SouraMAIL API v2.0 is live
              </span>
            </div>
            <h1 className="mt-sm font-headline-xl text-[56px] font-semibold leading-[64px] tracking-tight text-on-surface">
              Professional email infrastructure.
              <br />
              <span className="text-on-surface-variant/70">
                Without the infrastructure headache.
              </span>
            </h1>
            <p className="mt-md max-w-[640px] font-body-lg text-[20px] leading-[30px] text-on-surface-variant">
              Connect your domain, create your first professional email and start sending in
              minutes. SouraMAIL handles the technical complexity.
            </p>
            <div className="mt-xl flex flex-row items-center gap-md">
              <Link
                href="/sign-up"
                className="flex items-center gap-sm rounded-lg bg-[#00A48A] px-xl py-md font-label-md text-[15px] text-white shadow-[0_4px_14px_0_rgba(0,164,138,0.39)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(0,164,138,0.23)]"
              >
                Start building for free <Icon name="arrow_forward" className="text-[18px]" />
              </Link>
              <a
                href="#"
                className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-xl py-md font-label-md text-[15px] text-on-surface shadow-sm transition-all duration-200 hover:border-outline-variant hover:bg-surface-container-low"
              >
                Read the docs
              </a>
            </div>
          </div>
        </section>

        {/* Domain widget */}
        <section className="relative z-20 mx-auto -mt-3xl w-full max-w-[800px] px-margin pb-4xl">
          <DomainWidget />
        </section>

        {/* Trust bar */}
        <section className="flex w-full flex-col items-center gap-xl border-b border-surface-container-highest/50 px-margin pb-4xl">
          <p className="font-label-md text-[12px] font-semibold uppercase tracking-widest text-on-surface-variant">
            Trusted by modern engineering teams
          </p>
          <div className="flex flex-wrap items-center justify-center gap-[4rem] opacity-70 mix-blend-luminosity grayscale">
            {[
              ['change_history', 'Vercel'],
              ['api', 'Linear'],
              ['code_blocks', 'Stripe'],
              ['terminal', 'Raycast'],
              ['account_tree', 'GitHub'],
            ].map(([icon, name]) => (
              <div
                key={name}
                className="flex items-center gap-xs font-headline-md text-[22px] font-bold"
              >
                <Icon name={icon as string} className="text-[28px]" /> {name}
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-3xl px-margin py-4xl">
          <div className="mx-auto mb-xl flex max-w-2xl flex-col gap-sm text-center">
            <h2 className="font-headline-lg text-[36px] font-semibold leading-[44px] text-on-surface">
              Everything you need to send email.
            </h2>
            <p className="text-[18px] text-on-surface-variant">
              A complete developer toolkit designed for modern applications, built on a global edge
              network.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-xl md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex flex-col gap-lg rounded-xl border border-surface-container-highest bg-surface-container-lowest p-xl shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
                    'accent' in f && f.accent
                      ? 'border-[#00A48A]/20 bg-[#00A48A]/10 text-[#00A48A]'
                      : 'border-surface-container-highest bg-surface-container-low text-on-surface'
                  }`}
                >
                  <Icon name={f.icon} className="text-[24px]" />
                </div>
                <div className="flex flex-col gap-xs">
                  <h4 className="font-headline-md text-[18px] font-semibold">{f.title}</h4>
                  <p className="text-[15px] leading-relaxed text-on-surface-variant">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Developer section */}
        <section className="relative mt-xl w-full overflow-hidden border-y border-surface-container-highest/10 bg-[#0a0a0a] py-4xl text-surface-container-lowest">
          <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-3xl px-margin">
            <div className="flex flex-col items-end justify-between gap-lg md:flex-row">
              <div className="flex max-w-2xl flex-col gap-md">
                <h2 className="font-headline-xl text-[40px] font-semibold leading-[48px] tracking-tight text-white">
                  Built for developers.
                </h2>
                <p className="font-body-lg text-[18px] text-outline-variant/80">
                  Integrate our robust API in seconds. We handle the deliverability, bounce
                  tracking, and compliance automatically, so you can focus on your product.
                </p>
              </div>
              <a
                href="#"
                className="rounded-lg border border-surface-container-highest/20 bg-surface-container-low/10 px-lg py-sm font-label-md text-[14px] text-white transition-colors hover:bg-surface-container-low/20"
              >
                View API Reference
              </a>
            </div>
            <div className="grid grid-cols-1 items-start gap-xl lg:grid-cols-12">
              <div className="col-span-1 flex flex-col overflow-hidden rounded-xl border border-surface-container-highest/20 bg-[#111111] p-xl font-mono text-[14px] text-surface-variant shadow-2xl lg:col-span-7">
                <div className="mb-lg flex items-center gap-md border-b border-surface-container-highest/10 pb-md">
                  <div className="flex items-center gap-xs">
                    <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                    <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                    <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
                  </div>
                  <div className="flex gap-md text-[13px] opacity-60">
                    <span className="border-b border-[#00A48A] pb-1 text-white">
                      send-welcome.ts
                    </span>
                    <span>package.json</span>
                  </div>
                </div>
                <pre className="overflow-x-auto text-[13px] leading-relaxed">
                  <code>
                    <span className="ide-keyword">import</span> {'{ SouraMail } '}
                    <span className="ide-keyword">from</span>{' '}
                    <span className="ide-string">&apos;@souramail/node&apos;</span>;{'\n\n'}
                    <span className="ide-keyword">const</span> soura ={' '}
                    <span className="ide-keyword">new</span>{' '}
                    <span className="ide-function">SouraMail</span>(process.env.SOURA_KEY);{'\n\n'}
                    <span className="ide-keyword">await</span> soura.
                    <span className="ide-property">emails</span>.
                    <span className="ide-function">send</span>({'{'}
                    {'\n  '}
                    <span className="ide-property">from</span>:{' '}
                    <span className="ide-string">&apos;hello@acme.com&apos;</span>,{'\n  '}
                    <span className="ide-property">to</span>: user.email,{'\n  '}
                    <span className="ide-property">subject</span>:{' '}
                    <span className="ide-string">&apos;Welcome&apos;</span>,{'\n  '}
                    <span className="ide-property">react</span>:{' '}
                    <span className="ide-function">WelcomeTemplate</span>({'{'} firstName: user.name{' '}
                    {'}'}),{'\n'}
                    {'}'});
                  </code>
                </pre>
              </div>
              <div className="col-span-1 flex flex-col gap-md lg:col-span-5">
                <div className="flex h-full flex-col gap-xl rounded-xl border border-surface-container-highest/20 bg-[#111111] p-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-label-md text-[12px] font-semibold uppercase tracking-widest text-outline-variant">
                      Real-time Delivery Logs
                    </h4>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#00A48A]" />
                  </div>
                  <div className="flex flex-col gap-lg">
                    {(
                      [
                        ['check_circle', 'DNS Resolution', 'Checking MX & TXT records', '12ms'],
                        ['verified_user', 'Authentication', 'SPF, DKIM, DMARC PASS', '45ms'],
                        ['flight_takeoff', 'Edge Delivery', 'Routed via eu-west-1', '112ms'],
                      ] as const
                    ).map(([icon, title, sub, ms]) => (
                      <div key={title} className="flex items-start justify-between">
                        <div className="flex items-start gap-md">
                          <Icon name={icon} className="mt-0.5 text-[20px] text-[#00A48A]" />
                          <div className="flex flex-col">
                            <span className="font-mono text-[14px] text-white">{title}</span>
                            <span className="font-mono text-[12px] text-outline-variant/60">
                              {sub}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-[12px] text-outline-variant/60">{ms}</span>
                      </div>
                    ))}
                    <div className="my-xs h-px w-full bg-surface-container-highest/20" />
                    <div className="flex items-center justify-between rounded-lg border border-[#00A48A]/20 bg-[#00A48A]/10 p-md">
                      <div className="flex items-center gap-sm">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00A48A] shadow-[0_0_10px_rgba(0,164,138,0.5)]">
                          <Icon name="done_all" className="text-[14px] text-white" />
                        </span>
                        <span className="font-mono text-[14px] font-bold text-[#00A48A]">
                          Delivered
                        </span>
                      </div>
                      <span className="font-mono text-[12px] text-[#00A48A]">169ms total</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-2xl px-margin py-4xl">
          <div className="mx-auto mb-lg flex max-w-2xl flex-col gap-sm text-center">
            <h2 className="font-headline-lg text-[36px] font-semibold leading-[44px] text-on-surface">
              Simple, transparent pricing.
            </h2>
            <p className="text-[18px] text-on-surface-variant">
              Start for free, upgrade when you need more power.
            </p>
          </div>
          <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-lg md:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`flex flex-col rounded-xl bg-surface-container-lowest p-2xl ${
                  p.featured
                    ? 'relative border-2 border-[#00A48A] shadow-xl md:-translate-y-4'
                    : 'border border-surface-container-highest shadow-sm'
                }`}
              >
                {p.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#00A48A] px-sm py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    Most Popular
                  </div>
                )}
                <h3 className="mb-xs font-headline-md text-[20px] font-semibold">{p.name}</h3>
                <p className="mb-xl text-[14px] text-on-surface-variant">{p.blurb}</p>
                <div className="mb-xs flex items-end gap-xs">
                  <span className="font-headline-xl text-[48px] font-bold leading-none">
                    {p.price}
                  </span>
                  {p.per && (
                    <span className="mb-1 text-[15px] text-on-surface-variant">{p.per}</span>
                  )}
                </div>
                <p className="mb-2xl text-[13px] text-on-surface-variant">{p.sub}</p>
                <ul className="mb-2xl flex flex-1 flex-col gap-md">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-sm text-[15px]">
                      <Icon name="check" className="text-[20px] text-[#00A48A]" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/sign-up"
                  className={`w-full rounded-lg px-lg py-md text-center font-label-md text-[14px] font-medium transition-colors ${
                    p.featured
                      ? 'bg-[#00A48A] text-white shadow-sm hover:bg-[#008f78]'
                      : 'border border-surface-container-highest bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="flex w-full flex-col items-center justify-center border-t border-surface-container-highest/50 bg-surface-container-lowest px-margin py-4xl text-center">
          <div className="mb-xl flex h-16 w-16 items-center justify-center rounded-xl border border-surface-container-highest bg-surface-container-lowest shadow-sm">
            <Logo className="h-8 w-8" />
          </div>
          <h2 className="mb-lg max-w-2xl font-headline-xl text-[40px] font-semibold leading-[48px] tracking-tight text-on-surface">
            Ready to upgrade your email infrastructure?
          </h2>
          <p className="mb-2xl max-w-xl font-body-lg text-[18px] text-on-surface-variant">
            Join thousands of developers who have stopped worrying about email and started focusing
            on building great products.
          </p>
          <Link
            href="/sign-up"
            className="rounded-lg bg-[#00A48A] px-2xl py-md font-label-md text-[15px] font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg"
          >
            Start building for free
          </Link>
        </section>
      </main>

      <footer className="w-full border-t border-surface-container-highest bg-surface-container-lowest pb-xl pt-4xl">
        <div className="mx-auto max-w-7xl px-margin">
          <div className="mb-3xl grid grid-cols-2 gap-xl md:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-2 flex flex-col gap-md lg:col-span-1">
              <div className="mb-xs flex items-center gap-xs">
                <Logo className="h-6 w-6" />
                <span className="font-headline-md text-[18px] font-bold tracking-tight text-on-surface">
                  SouraMAIL
                </span>
              </div>
              <p className="max-w-[200px] text-[13px] leading-relaxed text-on-surface-variant">
                The developer-first email infrastructure for the AI era.
              </p>
            </div>
            {FOOTER.map((col) => (
              <div key={col.title} className="flex flex-col gap-md">
                <h4 className="font-label-md text-[13px] font-semibold text-on-surface">
                  {col.title}
                </h4>
                <nav className="flex flex-col gap-sm">
                  {col.links.map((l) => (
                    <a
                      key={l}
                      href="#"
                      className="text-[14px] text-on-surface-variant transition-colors hover:text-[#00A48A]"
                    >
                      {l}
                    </a>
                  ))}
                </nav>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center justify-between gap-md border-t border-surface-container-highest pt-lg md:flex-row">
            <span className="text-[13px] text-on-surface-variant">© 2026 SouraMAIL Inc.</span>
            <div className="flex gap-lg">
              <a
                href="#"
                className="flex items-center gap-xs text-[13px] text-on-surface-variant transition-colors hover:text-[#00A48A]"
              >
                <Icon name="share" className="text-[16px]" /> Twitter
              </a>
              <a
                href="#"
                className="flex items-center gap-xs text-[13px] text-on-surface-variant transition-colors hover:text-[#00A48A]"
              >
                <Icon name="code" className="text-[16px]" /> GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

const FEATURES = [
  {
    icon: 'code',
    title: 'RESTful API & SDKs',
    body: 'Integrate email sending in seconds with typed SDKs for Node.js, Python, Go, and Ruby.',
  },
  {
    icon: 'account_tree',
    title: 'Model Context Protocol',
    body: 'Give AI agents access to read, search, and draft emails securely via our official MCP server.',
  },
  {
    icon: 'auto_awesome',
    title: 'AI Inbox Copilot',
    body: 'Built-in AI assistant to summarize threads, draft replies, and extract structured data.',
    accent: true,
  },
  {
    icon: 'schema',
    title: 'Visual Automations',
    body: 'Build complex email workflows with a node-based visual editor. No code required.',
  },
  {
    icon: 'filter_alt',
    title: 'Natural Language Rules',
    body: 'Route and label emails by describing what you want in plain English.',
  },
  {
    icon: 'monitoring',
    title: 'Email Health Monitoring',
    body: 'Real-time alerts for bounce rates, spam complaints, and domain reputation changes.',
  },
] as const;

const PLANS = [
  {
    name: 'Free',
    blurb: 'For developers getting started.',
    price: '€0',
    per: '/mo',
    sub: 'No credit card required.',
    cta: 'Start free',
    featured: false,
    features: [
      '1 domain',
      '3 email addresses',
      '1 GB / mailbox',
      '100 outgoing emails / day',
      'Webmail, API & AI Copilot',
      'SPF, DKIM, DMARC & MCP',
    ],
  },
  {
    name: 'Pro',
    blurb: 'For production applications.',
    price: '€7.90',
    per: '/mo',
    sub: 'or €79 / year',
    cta: 'Start free',
    featured: true,
    features: [
      'Multiple domains & mailboxes',
      'More storage & higher sending limits',
      'Advanced AI & automations',
      'MCP, analytics & API logs',
      'Priority support',
      'No SouraMAIL branding',
    ],
  },
  {
    name: 'Business',
    blurb: 'For teams & agencies.',
    price: 'Coming soon',
    per: '',
    sub: '',
    cta: 'Contact sales',
    featured: false,
    features: [
      'Everything in Pro',
      'Multiple team members',
      'Roles & permissions',
      'Audit logs & team quotas',
      'SSO & advanced analytics',
    ],
  },
] as const;

const FOOTER = [
  {
    title: 'Product',
    links: ['Inbox', 'Email API', 'AI Copilot', 'AI Rules', 'MCP', 'Automations'],
  },
  {
    title: 'Developers',
    links: ['Documentation', 'API Reference', 'SDKs', 'Webhooks', 'Changelog', 'Status'],
  },
  { title: 'Company', links: ['About', 'SouraMAIL for Startups', 'Blog', 'Contact'] },
  { title: 'Legal', links: ['Privacy', 'Terms', 'Security'] },
] as const;

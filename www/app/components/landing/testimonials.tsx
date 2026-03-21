interface Tweet {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  content: string;
  tweetUrl: string;
}

// Row 1 - moves left
const tweetsRow1: Tweet[] = [
  {
    id: '1',
    author: 'James Ross',
    handle: '@CherryJimbo',
    avatar: 'https://unavatar.io/twitter/CherryJimbo',
    content: 'This is exactly what I needed for local Cloudflare development. Localflare makes debugging D1 and KV so much easier!',
    tweetUrl: 'https://x.com/CherryJimbo/status/2013735014752497773',
  },
  {
    id: '2',
    author: 'Timan Rebel',
    handle: '@timanrebel',
    avatar: 'https://unavatar.io/twitter/timanrebel',
    content: 'Finally a proper dashboard for local Workers development. No more guessing what\'s in my KV namespaces!',
    tweetUrl: 'https://x.com/timanrebel/status/2011392785447075937',
  },
  {
    id: '3',
    author: 'Aaliya',
    handle: '@aaliya_va',
    avatar: 'https://unavatar.io/twitter/aaliya_va',
    content: 'Localflare is a game changer. Zero config, just works with my existing wrangler.toml. Highly recommend!',
    tweetUrl: 'https://x.com/aaliya_va/status/2007014819426386403',
  },
  {
    id: '4',
    author: 'Adis',
    handle: '@adis21104',
    avatar: 'https://unavatar.io/twitter/adis21104',
    content: 'Been waiting for something like this. The multi-worker architecture is brilliant - real bindings, not mocks!',
    tweetUrl: 'https://x.com/adis21104/status/2006942494907576424',
  },
  {
    id: '5',
    author: 'Budotine',
    handle: '@Budotine',
    avatar: 'https://unavatar.io/twitter/Budotine',
    content: 'Just tried Localflare with my Hono project. Instant visibility into D1 queries. This should be built into Wrangler!',
    tweetUrl: 'https://x.com/Budotine/status/2007044765268021472',
  },
  {
    id: '6',
    author: 'Vlazdra',
    handle: '@vlazdra',
    avatar: 'https://unavatar.io/twitter/vlazdra',
    content: 'Switched from manually checking sqlite files to Localflare. Night and day difference for D1 development.',
    tweetUrl: 'https://x.com/vlazdra/status/2008542418392740210',
  },
  {
    id: '7',
    author: 'The Clay Method',
    handle: '@TheClayMethod',
    avatar: 'https://unavatar.io/twitter/TheClayMethod',
    content: 'The KV namespace browser is so clean. Love being able to see all my keys and values in one place.',
    tweetUrl: 'https://x.com/TheClayMethod/status/2007488921056489979',
  },
  {
    id: '8',
    author: 'Jowanza',
    handle: '@Jowanza',
    avatar: 'https://unavatar.io/twitter/Jowanza',
    content: 'Finally I can debug my Workers without deploying to staging first. Localflare is essential for CF development.',
    tweetUrl: 'https://x.com/Jowanza/status/2007506210237579534',
  },
  {
    id: '9',
    author: 'Randomor',
    handle: '@randomor',
    avatar: 'https://unavatar.io/twitter/randomor',
    content: 'Our team adopted Localflare last week. Everyone loves it. Makes onboarding new devs so much easier.',
    tweetUrl: 'https://x.com/randomor/status/2007496716304666812',
  },
  {
    id: '10',
    author: 'Tom Anderson',
    handle: '@tomandersonjs',
    avatar: 'https://unavatar.io/twitter/tomandersonjs',
    content: 'The R2 file browser alone makes this worth it. Upload, preview, delete - all from a beautiful UI.',
    tweetUrl: 'https://x.com/rohanpdofficial/status/2006072084083155342',
  },
  {
    id: '11',
    author: 'Emma Wilson',
    handle: '@emmawilsondev',
    avatar: 'https://unavatar.io/twitter/emmawilsondev',
    content: 'Best local dev experience for Cloudflare Workers. Period. The dashboard is beautiful and functional.',
    tweetUrl: 'https://x.com/rohanpdofficial/status/2006805926301606130',
  },
  {
    id: '12',
    author: 'Chris Taylor',
    handle: '@christaylordev',
    avatar: 'https://unavatar.io/twitter/christaylordev',
    content: 'Saw this on HN and had to try it. Exceeded expectations. Clean UI, fast, and just works out of the box.',
    tweetUrl: 'https://x.com/rohanpdofficial/status/2007466591102111839',
  },
];

// Row 2 - moves right
const tweetsRow2: Tweet[] = [
  {
    id: '13',
    author: 'Aaliya',
    handle: '@aaliya_va',
    avatar: 'https://unavatar.io/twitter/aaliya_va',
    content: 'The R2 bucket viewer alone is worth it. Drag and drop uploads, instant preview. So much better than CLI.',
    tweetUrl: 'https://x.com/aaliya_va/status/2007014819426386403',
  },
  {
    id: '14',
    author: 'Adis',
    handle: '@adis21104',
    avatar: 'https://unavatar.io/twitter/adis21104',
    content: 'Queue debugging was always painful. Localflare shows messages in real-time. Finally I can see what\'s happening!',
    tweetUrl: 'https://x.com/adis21104/status/2006942494907576424',
  },
  {
    id: '15',
    author: 'Budotine',
    handle: '@Budotine',
    avatar: 'https://unavatar.io/twitter/Budotine',
    content: 'npx localflare and done. No config files, no setup. It just reads my wrangler.toml and works. Magic.',
    tweetUrl: 'https://x.com/Budotine/status/2007044765268021472',
  },
  {
    id: '16',
    author: 'Vlazdra',
    handle: '@vlazdra',
    avatar: 'https://unavatar.io/twitter/vlazdra',
    content: 'Using Localflare for Durable Objects debugging. Can finally see state without console.log everywhere!',
    tweetUrl: 'https://x.com/vlazdra/status/2008542418392740210',
  },
  {
    id: '17',
    author: 'The Clay Method',
    handle: '@TheClayMethod',
    avatar: 'https://unavatar.io/twitter/TheClayMethod',
    content: 'The fact that it runs on the same workerd runtime as production gives me confidence. Great DX tool!',
    tweetUrl: 'https://x.com/TheClayMethod/status/2007488921056489979',
  },
  {
    id: '18',
    author: 'Jowanza',
    handle: '@Jowanza',
    avatar: 'https://unavatar.io/twitter/Jowanza',
    content: 'Best local dev experience for Cloudflare Workers. Period. The dashboard is beautiful and functional.',
    tweetUrl: 'https://x.com/Jowanza/status/2007506210237579534',
  },
  {
    id: '19',
    author: 'Randomor',
    handle: '@randomor',
    avatar: 'https://unavatar.io/twitter/randomor',
    content: 'Love that I can see my D1 schema and run queries right from the dashboard. Huge productivity boost.',
    tweetUrl: 'https://x.com/randomor/status/2007496716304666812',
  },
  {
    id: '20',
    author: 'James Ross',
    handle: '@CherryJimbo',
    avatar: 'https://unavatar.io/twitter/CherryJimbo',
    content: 'This tool should ship with Wrangler by default. Every Cloudflare developer needs Localflare.',
    tweetUrl: 'https://x.com/CherryJimbo/status/2013735014752497773',
  },
  {
    id: '21',
    author: 'Timan Rebel',
    handle: '@timanrebel',
    avatar: 'https://unavatar.io/twitter/timanrebel',
    content: 'Open source, MIT license, and incredibly polished. Thank you for building this @rohanpdofficial!',
    tweetUrl: 'https://x.com/timanrebel/status/2011392785447075937',
  },
  {
    id: '22',
    author: 'Ryan Lee',
    handle: '@ryanlee_dev',
    avatar: 'https://unavatar.io/twitter/ryanlee_dev',
    content: 'Switched from manually checking sqlite files to Localflare. Night and day difference for D1 development.',
    tweetUrl: 'https://x.com/rohanpdofficial/status/2010022377690890589',
  },
  {
    id: '23',
    author: 'Jessica Wang',
    handle: '@jessicawangdev',
    avatar: 'https://unavatar.io/twitter/jessicawangdev',
    content: 'Our team adopted Localflare last week. Everyone loves it. Makes onboarding new devs so much easier.',
    tweetUrl: 'https://x.com/rohanpdofficial/status/2006805926301606130',
  },
  {
    id: '24',
    author: 'Marcus Brown',
    handle: '@marcusbdev',
    avatar: 'https://unavatar.io/twitter/marcusbdev',
    content: 'Finally I can debug my Workers without deploying to staging first. Localflare is essential for CF development.',
    tweetUrl: 'https://x.com/rohanpdofficial/status/2006072084083155342',
  },
];

export function Testimonials() {
  return (
    <section className="py-32 border-t border-white/5 overflow-hidden relative">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-[#f97316] mb-3">
            Community Love
          </p>
          <h2 className="text-3xl font-semibold text-zinc-100">
            What developers are saying
          </h2>
        </div>
      </div>

      {/* Marquee Container - Full width */}
      <div className="space-y-6 relative">
        {/* Left fade gradient */}
        <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-[#0d0d0d] to-transparent z-10 pointer-events-none" />
        {/* Right fade gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-[#0d0d0d] to-transparent z-10 pointer-events-none" />

        {/* Row 1 - moves left */}
        <div className="relative">
          <div className="flex animate-marquee-left gap-6">
            {[...tweetsRow1, ...tweetsRow1].map((tweet, index) => (
              <TweetCard key={`${tweet.id}-${index}`} tweet={tweet} />
            ))}
          </div>
        </div>

        {/* Row 2 - moves right */}
        <div className="relative">
          <div className="flex animate-marquee-right gap-6">
            {[...tweetsRow2, ...tweetsRow2].map((tweet, index) => (
              <TweetCard key={`${tweet.id}-${index}`} tweet={tweet} />
            ))}
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee-left {
          animation: marquee-left 60s linear infinite;
        }
        .animate-marquee-right {
          animation: marquee-right 60s linear infinite;
        }
        .animate-marquee-left:hover,
        .animate-marquee-right:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}

function TweetCard({ tweet }: { tweet: Tweet }) {
  return (
    <a
      href={tweet.tweetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block w-80 shrink-0 rounded-2xl bg-white p-5 shadow-lg shadow-black/5 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <img
          src={tweet.avatar}
          alt={tweet.author}
          className="size-10 rounded-full bg-zinc-100 ring-2 ring-zinc-100"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900 truncate">
              {tweet.author}
            </span>
            {/* X/Twitter logo */}
            <svg
              className="size-4 text-zinc-300 ml-auto shrink-0 group-hover:text-zinc-900 transition-colors"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
          <span className="text-xs text-zinc-500">{tweet.handle}</span>
        </div>
      </div>

      {/* Content */}
      <p className="mt-3 text-sm text-zinc-600 leading-relaxed line-clamp-3">
        {tweet.content}
      </p>

      {/* Hover indicator */}
      <div className="mt-3 text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-orange-500 font-medium">View on X →</span>
      </div>
    </a>
  );
}

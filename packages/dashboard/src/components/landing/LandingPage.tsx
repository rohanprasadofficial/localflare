import {
  DatabaseIcon,
  HardDriveIcon,
  FolderIcon,
  StackIcon,
  LinkIcon,
  ArrowsClockwiseIcon,
} from "@phosphor-icons/react"
import { cn } from "@cloudflare/kumo"

function ChromeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.7434,22.505A12.9769,12.9769,0,0,0,14.88,28.949l5.8848-10.1927L16,16.0058,11.2385,18.755l-1.5875-2.75L8.4885,13.9919,5.3553,8.5649A12.9894,12.9894,0,0,0,4.7434,22.505Z" fill="#00ac47" />
      <path d="M16,3.0072A12.9769,12.9769,0,0,0,5.3507,8.5636l5.8848,10.1927L16,16.0057V10.5072H27.766A12.99,12.99,0,0,0,16,3.0072Z" fill="#ea4435" />
      <path d="M27.2557,22.505a12.9772,12.9772,0,0,0,.5124-12H15.9986v5.5011l4.7619,2.7492-1.5875,2.75-1.1625,2.0135-3.1333,5.4269A12.99,12.99,0,0,0,27.2557,22.505Z" fill="#ffba00" />
      <circle cx="15.9995" cy="16.0072" fill="#fff" r="5.5" />
      <circle cx="15.9995" cy="16.0072" fill="#4285f4" r="4.25" />
    </svg>
  )
}

function SafariIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="safariGrad0" x1="50%" x2="50%" y1="100%" y2="0%">
          <stop offset="25%" stopColor="#DBDBDA" />
          <stop offset="100%" stopColor="#FFF" />
        </linearGradient>
        <radialGradient id="safariGrad1" cx="57.025%" cy="39.017%" r="61.032%" fx="57.025%" fy="39.017%">
          <stop offset="0%" stopColor="#2ABCE1" />
          <stop offset="11.363%" stopColor="#2ABBE1" />
          <stop offset="100%" stopColor="#3375F8" />
        </radialGradient>
      </defs>
      <g transform="translate(4 2)">
        <circle cx="124" cy="124" r="124" fill="url(#safariGrad0)" />
        <circle cx="124" cy="124" r="114.7" fill="url(#safariGrad1)" />
        <path fill="#CD151E" d="m202.372 45.628l-91.45 65.003l27.125 26.931l64.325-91.934" />
        <path fill="#FA5153" d="m111.019 110.438l13.66 13.465l77.693-78.275l-91.353 64.81Z" />
        <path fill="#ACACAC" d="m111.019 110.438l27.125 26.93l-91.45 65.004l64.325-91.935Z" />
        <path fill="#EEE" d="m46.694 202.372l77.984-78.469l-13.66-13.466l-64.324 91.935Z" />
      </g>
    </svg>
  )
}

function BraveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="braveGrad0" x1="6" y1="2956.93" x2="4885.78" y2="2956.93" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF5500" />
          <stop offset="0.409877" stopColor="#FF5500" />
          <stop offset="0.581981" stopColor="#FF2000" />
          <stop offset="1" stopColor="#FF2000" />
        </linearGradient>
        <linearGradient id="braveGrad1" x1="97.1642" y1="533.63" x2="4060.36" y2="533.63" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF452A" />
          <stop offset="1" stopColor="#FF2000" />
        </linearGradient>
      </defs>
      <path fillRule="evenodd" clipRule="evenodd" d="M53.0898 14.9845L54.4318 11.6287C54.4318 11.6287 52.7239 9.76431 50.65 7.65138C48.576 5.53845 44.1842 6.78135 44.1842 6.78135L39.1825 1H30.3989H21.6153L16.6135 6.78135C16.6135 6.78135 12.2217 5.53845 10.1478 7.65138C8.0739 9.76431 6.36598 11.6287 6.36598 11.6287L7.70792 14.9845L6 19.9561C6 19.9561 11.0231 39.3397 11.6117 41.7068C12.7707 46.3677 13.5637 48.1699 16.8575 50.5314C20.1514 52.8929 26.1291 56.9945 27.105 57.616C28.081 58.2374 29.3009 59.296 30.3989 59.296C31.4968 59.296 32.7168 58.2374 33.6927 57.616C34.6687 56.9945 40.6464 52.8929 43.9403 50.5314C47.2341 48.1699 48.0271 46.3677 49.186 41.7068C49.7745 39.3397 54.7978 19.9561 54.7978 19.9561L53.0898 14.9845Z" fill="url(#braveGrad0)" />
      <path fillRule="evenodd" clipRule="evenodd" d="M30.3989 37.2786C30.7333 37.2786 32.8757 38.0492 34.595 38.9555C36.3141 39.862 37.5601 40.5029 37.9584 40.7568C38.3566 41.0109 38.1137 41.4898 37.751 41.751C37.3882 42.0123 32.5132 45.8583 32.0401 46.2834C31.5669 46.7086 30.8716 47.4107 30.3989 47.4107C29.9262 47.4107 29.2308 46.7086 28.7577 46.2834C28.2845 45.8583 23.4096 42.0123 23.0468 41.751C22.684 41.4898 22.4412 41.0109 22.8394 40.7568C23.2377 40.5029 24.4836 39.862 26.2029 38.9555C27.9219 38.0492 30.0645 37.2786 30.3989 37.2786ZM30.425 9.88554C30.5892 9.89019 31.5143 9.93598 32.8388 10.3858C34.3027 10.8829 35.8887 11.5044 36.6206 11.5044C37.3526 11.5044 42.7813 10.4479 42.7813 10.4479C42.7813 10.4479 49.2148 18.3714 49.2148 20.0649C49.2148 21.7583 48.4055 22.2053 47.5918 23.0856C46.7781 23.966 43.2243 27.8108 42.7679 28.3044C42.3115 28.7982 41.3614 29.5468 41.9203 30.8943C42.4792 32.2417 43.3036 33.9563 42.3868 35.6953C41.4699 37.4344 39.8992 38.5951 38.8928 38.4032C37.8863 38.2112 35.5227 36.9528 34.6535 36.3779C33.7843 35.8031 31.0294 33.4883 31.0294 32.6026C31.0294 31.7171 33.8771 30.1269 34.4031 29.7656C34.9294 29.4044 37.329 28.006 37.3782 27.4571C37.4272 26.9082 37.4086 26.7472 36.7004 25.3909C35.9922 24.0346 34.7169 22.2247 34.9292 21.0204C35.1414 19.8163 37.1983 19.1901 38.6661 18.6253C40.1337 18.0607 42.9597 16.9942 43.3126 16.8284C43.6658 16.6624 43.5745 16.5045 42.505 16.4012C41.4357 16.2979 38.401 15.8875 37.0328 16.276C35.6647 16.6645 33.3273 17.2557 33.1379 17.5691C32.9486 17.8826 32.7816 17.8932 32.976 18.9745C33.1704 20.0558 34.1715 25.2444 34.2686 26.166C34.3658 27.0876 34.5559 27.6969 33.5805 27.9241C32.6051 28.1513 30.9631 28.5458 30.3989 28.5458C29.8347 28.5458 28.1926 28.1513 27.2173 27.9241C26.2418 27.6969 26.4319 27.0876 26.5291 26.166C26.6264 25.2444 27.6273 20.0558 27.8218 18.9745C28.0161 17.8932 27.8491 17.8826 27.6599 17.5691C27.4706 17.2557 25.133 16.6645 23.7649 16.276C22.3967 15.8875 19.3621 16.2979 18.2927 16.4012C17.2233 16.5045 17.132 16.6624 17.4851 16.8284C17.8381 16.9942 20.6641 18.0607 22.1317 18.6253C23.5994 19.1901 25.6564 19.8163 25.8686 21.0204C26.0809 22.2247 24.8055 24.0346 24.0974 25.3909C23.3892 26.7472 23.3704 26.9082 23.4196 27.4571C23.4686 28.006 25.8684 29.4044 26.3946 29.7656C26.9207 30.1269 29.7683 31.7171 29.7683 32.6026C29.7683 33.4883 27.0136 35.8031 26.1444 36.3779C25.2751 36.9528 22.9115 38.2112 21.905 38.4032C20.8986 38.5951 19.3279 37.4344 18.411 35.6953C17.4942 33.9563 18.3187 32.2417 18.8774 30.8943C19.4362 29.5468 18.4863 28.7982 18.0298 28.3044C17.5735 27.8108 14.0196 23.966 13.2059 23.0856C12.3922 22.2053 11.583 21.7583 11.583 20.0649C11.583 18.3714 18.0165 10.4479 18.0165 10.4479C18.0165 10.4479 23.4452 11.5044 24.1772 11.5044C24.9092 11.5044 26.4951 10.8829 27.959 10.3858C29.2835 9.93598 30.2086 9.89019 30.3728 9.88554H30.425Z" fill="white" />
      <path d="M44.1843 6.78138L39.1825 1.00003H30.3989H21.6153L16.6135 6.78138C16.6135 6.78138 12.2217 5.53848 10.1478 7.65141C10.1478 7.65141 16.0036 7.11286 18.0165 10.4479C18.0165 10.4479 23.4452 11.5044 24.1772 11.5044C24.9092 11.5044 26.4951 10.8829 27.959 10.3858C29.423 9.88863 30.3989 9.88502 30.3989 9.88502C30.3989 9.88502 31.3749 9.88863 32.8388 10.3858C34.3027 10.8829 35.8887 11.5044 36.6206 11.5044C37.3526 11.5044 42.7813 10.4479 42.7813 10.4479C44.7942 7.11286 50.65 7.65141 50.65 7.65141C48.5761 5.53848 44.1843 6.78138 44.1843 6.78138Z" fill="url(#braveGrad1)" />
    </svg>
  )
}

interface LandingPageProps {
  onRetry?: () => void
}

export function LandingPage({ onRetry }: LandingPageProps) {
  const port = new URLSearchParams(window.location.search).get('port') || '8787'

  return (
    <div className="h-screen overflow-hidden bg-kumo-base flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="font-semibold text-lg">Localflare</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://github.com/rohanprasadofficial/localflare" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-kumo-strong hover:text-kumo-default transition-colors">
            <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
          <a href="https://x.com/rohanpdofficial" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-kumo-strong hover:text-kumo-default transition-colors">
            <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Follow
          </a>
          <a href="https://localflare.dev" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-kumo-strong hover:text-kumo-default transition-colors">
            <LinkIcon size={16} />
            localflare.dev
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-4">
        {/* Animated Icons */}
        <div className="flex items-center gap-2.5 mb-5">
          {[
            { Icon: DatabaseIcon, color: "text-d1", delay: "0s" },
            { Icon: HardDriveIcon, color: "text-kv", delay: "0.1s" },
            { Icon: FolderIcon, color: "text-r2", delay: "0.2s" },
            { Icon: StackIcon, color: "text-do", delay: "0.3s" },
          ].map((item, i) => (
            <div
              key={i}
              className="p-2.5 rounded-xl bg-kumo-base border border-kumo-line shadow-sm animate-bounce"
              style={{ animationDelay: item.delay, animationDuration: "2s" }}
            >
              <item.Icon size={20} className={item.color} />
            </div>
          ))}
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Waiting for Localflare</h1>
        <p className="text-sm text-kumo-strong text-center max-w-md mb-5">
          Start Localflare in your Worker project to view and manage your Cloudflare bindings locally.
        </p>

        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-kumo-brand text-white rounded-lg hover:bg-kumo-brand-hover transition-colors font-medium text-sm"
          >
            <ArrowsClockwiseIcon size={16} />
            Check Connection
          </button>
          <span className="text-xs text-kumo-strong">
            <code className="px-1.5 py-0.5 bg-kumo-fill rounded">localhost:{port}</code>
          </span>
        </div>

        {/* Chrome Warning */}
        <div className="w-full max-w-2xl mb-4 bg-kumo-base border border-kumo-line rounded-xl p-3.5 flex items-start gap-3">
          <ChromeIcon className="size-7 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-kumo-strong">
              Recent Chrome/Chromium updates may block{" "}
              <a href="https://developer.chrome.com/blog/local-network-access" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                local network access
              </a>{" "}
              by default. Open "Site information" in the URL bar and make sure "Local network access" is enabled.
            </p>
          </div>
        </div>

        {/* Troubleshooting Cards */}
        <div className="w-full max-w-2xl grid md:grid-cols-2 gap-4">
          <div className="bg-kumo-base border border-kumo-line rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">L</span>
              </div>
              <span className="font-medium">Localflare CLI</span>
            </div>
            <p className="text-sm text-kumo-strong mb-2">Make sure Localflare is up and running</p>
            <ol className="text-sm space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-kumo-strong">1.</span>
                <span>Check out our{" "}
                  <a href="https://github.com/rohanprasadofficial/localflare#readme" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">installation guide</a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-kumo-strong">2.</span>
                <span>Run <code className="px-1.5 py-0.5 bg-kumo-fill rounded text-xs">npx localflare</code></span>
              </li>
            </ol>
            <div className="mt-3 pt-3 border-t border-kumo-line">
              <p className="text-xs text-kumo-strong">
                Still experiencing issues? Contact us on{" "}
                <a href="https://x.com/rohanpdofficial" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">X</a>
                {" "}or{" "}
                <a href="https://github.com/rohanprasadofficial/localflare/issues" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub</a>
              </p>
            </div>
          </div>

          <div className="bg-kumo-base border border-kumo-line rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <SafariIcon className="size-7" />
              <BraveIcon className="size-7" />
              <span className="font-medium">Using Safari or Brave?</span>
            </div>
            <p className="text-sm text-kumo-strong mb-2">
              These browsers block localhost by default. Install{" "}
              <a href="https://github.com/FiloSottile/mkcert" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">mkcert</a>:
            </p>
            <ol className="text-sm space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-kumo-strong">1.</span>
                <span>Follow the{" "}
                  <a href="https://github.com/FiloSottile/mkcert#installation" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">installation steps</a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-kumo-strong">2.</span>
                <span>Run <code className="px-1.5 py-0.5 bg-kumo-fill rounded text-xs">mkcert -install</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-kumo-strong">3.</span>
                <span>Restart your browser</span>
              </li>
            </ol>
            <p className="text-xs text-kumo-strong mt-2">On Brave you can also just disable Brave Shields.</p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-5 flex items-center gap-5">
          {[
            { label: "D1 Databases", Icon: DatabaseIcon, color: "text-d1" },
            { label: "KV Storage", Icon: HardDriveIcon, color: "text-kv" },
            { label: "R2 Buckets", Icon: FolderIcon, color: "text-r2" },
            { label: "Durable Objects", Icon: StackIcon, color: "text-do" },
          ].map((feature) => (
            <div key={feature.label} className="flex items-center gap-1.5 text-xs text-kumo-strong">
              <feature.Icon size={16} className={cn(feature.color)} />
              {feature.label}
            </div>
          ))}
        </div>
      </main>

      <footer className="px-6 py-3 flex items-center justify-center shrink-0">
        <p className="text-xs text-kumo-strong">Built with love for the Cloudflare community</p>
      </footer>
    </div>
  )
}

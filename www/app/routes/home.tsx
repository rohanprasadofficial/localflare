import { LandingPage } from "~/components/landing/landing-page";

export function meta() {
  return [
    { title: "Localflare - Local Development Dashboard for Cloudflare Workers" },
  ];
}

export default function Home() {
  return <LandingPage />;
}

import localFont from "next/font/local";
import "./globals.css";
import PixelField from "@/components/UI/PixelField";
import FX from "@/components/UI/FX";
import BgFlow from "@/components/UI/BgFlow";

// Self-hosted (OFL) and subset to Latin + Latin Extended-A for Czech.
const anton = localFont({
  src: "./fonts/Anton.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-anton",
});

const unbounded = localFont({
  src: "./fonts/Unbounded.woff2",
  weight: "200 900",
  display: "swap",
  variable: "--font-wide",
});

const inter = localFont({
  src: "./fonts/Inter.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-inter",
});

const TITLE = "DUPSCALED · All in one content & brand agency";
const DESC =
  "DUPSCALED is an all-in-one content & brand agency: content, brand, social and web under one roof. 5B+ views generated for creators, esports orgs and athletes.";
// Link preview card (iMessage, WhatsApp, Slack, X...): branded image instead
// of whatever photo the crawler finds first on the page.
const OG_IMAGE = {
  url: "https://d2ol7oe51mr4n9.cloudfront.net/user_3HPxrGsPuGeZcLUulgUMU2YDdgp/eb902d46-6d52-4fd5-bd1f-c9f6a73f700a.jpg",
  width: 1200,
  height: 630,
  alt: "We are DUPSCALED · All in one content & brand agency",
};

export const metadata = {
  metadataBase: new URL("https://dupscaled.com"),
  title: TITLE,
  description: DESC,
  openGraph: {
    type: "website",
    url: "https://dupscaled.com",
    siteName: "DUPSCALED",
    title: TITLE,
    description: DESC,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    site: "@dupscaled",
    title: TITLE,
    description: DESC,
    images: [OG_IMAGE.url],
  },
};

export const viewport = {
  themeColor: "#f4f1fa",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${anton.variable} ${unbounded.variable} ${inter.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=sessionStorage.getItem("dups-theme-s");if(t==="dark"||t==="light"){document.documentElement.dataset.theme=t;if(t==="dark"){var m=document.querySelector('meta[name="theme-color"]');if(m)m.content="#05050a"}}}catch(e){}`,
          }}
        />
      </head>
      <body>
        <BgFlow />
        <PixelField />
        {children}
        <FX />
      </body>
    </html>
  );
}

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

export const metadata = {
  title: "DUPSCALED · All in one content & brand agency",
  description:
    "DUPSCALED is an all-in-one content & brand agency: content, brand, social and web under one roof. 5B+ views generated for creators, esports orgs and athletes.",
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

import localFont from "next/font/local";
import "./globals.css";
import PixelField from "@/components/UI/PixelField";
import FX from "@/components/UI/FX";

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
  title: "DUPSCALED · Shortform content that scales",
  description:
    "DUPSCALED crafts standout brands through social mastery, expert editing, and stunning design. 5B+ views generated for gaming creators, esports orgs and athletes.",
};

export const viewport = {
  themeColor: "#05050a",
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
            __html: `try{var t=localStorage.getItem("dups-theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body>
        <PixelField />
        {children}
        <FX />
      </body>
    </html>
  );
}

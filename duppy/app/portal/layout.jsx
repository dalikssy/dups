import "../adminhub/hub.css";
import "../adminhub/hub-v2.css";

export const metadata = {
  title: "DUPSCALED Client Portal",
  robots: { index: false, follow: false },
};

export const viewport = { themeColor: "#000000" };

export default function PortalLayout({ children }) {
  return <div className="hub">{children}</div>;
}

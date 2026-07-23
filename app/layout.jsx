export const metadata = {
  title: "MIHub Recon",
  description: "MCR report reconciliation against Google Ads",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#f6f7f9",
          color: "#1a1a1a",
        }}
      >
        {children}
      </body>
    </html>
  );
}

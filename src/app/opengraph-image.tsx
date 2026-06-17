import { ImageResponse } from "next/og";
import { siteConfig } from "@/site.config";

export const alt = siteConfig.name;
export const dynamic = "force-static";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f8f5ef",
          color: "#1f2933",
          padding: "72px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            fontSize: 30,
            color: "#9f3a38",
          }}
        >
          <span>{siteConfig.url.replace(/^https?:\/\//, "")}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          <div style={{ fontSize: 82, lineHeight: 1.08, letterSpacing: 0 }}>
            {siteConfig.name}
          </div>
          <div style={{ width: "72%", fontSize: 34, lineHeight: 1.35, color: "#4f5b66" }}>
            {siteConfig.description}
          </div>
        </div>
        <div style={{ height: 8, width: 240, background: "#9f3a38" }} />
      </div>
    ),
    size
  );
}

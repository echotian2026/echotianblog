import { ImageResponse } from "next/og";

export const alt = "Echo Tian — Blog & Notes";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: 28,
          display: "flex",
          background:
            "linear-gradient(135deg, #1e1035 0%, #130a24 48%, #0c0714 100%)",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            padding: "76px 84px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            borderRadius: 32,
            boxShadow:
              "inset 0 0 80px rgba(168, 85, 247, 0.08), 0 0 40px rgba(168, 85, 247, 0.12)",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.045em",
            }}
          >
            Echo Tian
          </div>
          <div
            style={{
              marginTop: 30,
              fontSize: 32,
              fontWeight: 500,
              color: "#c084fc",
              letterSpacing: "-0.015em",
            }}
          >
            Blog &amp; Notes • echotianblog.com
          </div>
        </div>
      </div>
    ),
    size
  );
}

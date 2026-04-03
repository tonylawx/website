import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 18% 18%, rgba(96, 165, 250, 0.55) 0%, transparent 26%), radial-gradient(circle at 85% 12%, rgba(168, 85, 247, 0.22) 0%, transparent 24%), linear-gradient(180deg, #0b1220 0%, #14203a 48%, #0f172a 100%)"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 22,
            borderRadius: 116,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 28%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(255,255,255,0.16)",
            boxShadow:
              "0 34px 80px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -18px 40px rgba(15, 23, 42, 0.35)"
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 54,
            right: 54,
            top: 54,
            height: 118,
            borderRadius: 72,
            background: "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.02) 100%)",
            opacity: 0.75
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 58,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            opacity: 0.22,
            borderRadius: 92
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 92,
            right: 92,
            bottom: 116,
            height: 10,
            borderRadius: 999,
            background: "rgba(255,255,255,0.16)"
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 276,
            height: 144,
            borderRadius: 34,
            border: "16px solid rgba(45, 212, 191, 0.98)",
            borderTop: "16px solid transparent",
            borderLeft: "16px solid transparent",
            transform: "rotate(-8deg) skewX(-14deg) translate(-2px, 24px)",
            boxShadow:
              "0 0 30px rgba(45, 212, 191, 0.46), 0 0 70px rgba(45, 212, 191, 0.18)"
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 118,
            top: 130,
            width: 0,
            height: 0,
            borderTop: "30px solid transparent",
            borderBottom: "30px solid transparent",
            borderLeft: "48px solid rgba(45, 212, 191, 1)",
            transform: "rotate(-14deg)",
            filter: "drop-shadow(0 0 14px rgba(45, 212, 191, 0.48))"
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 228,
            transform: "translateY(10px)",
            textShadow: "0 18px 40px rgba(0,0,0,0.38)"
          }}
        >
          💹
        </div>
      </div>
    ),
    size
  );
}

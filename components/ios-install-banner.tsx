"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/shared/i18n";
import { uiCopy } from "@/shared/i18n";

type Props = {
  locale?: Locale;
};

function isStandalone() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(display-mode: standalone)").matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

export function IOSInstallBanner({ locale = "zh" }: Props) {
  const [visible, setVisible] = useState(false);
  const text = uiCopy[locale];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const ua = window.navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    setVisible(isIOS && !isStandalone());
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.copy}>
        <strong style={styles.title}>{text.installBannerTitle}</strong>
        <span style={styles.body}>{text.installBannerBody}</span>
      </div>
      <button type="button" onClick={() => setVisible(false)} style={styles.close}>
        {locale === "zh" ? "知道了" : "Close"}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    marginBottom: 10,
    borderRadius: 18,
    border: "1px solid rgba(201, 169, 106, 0.35)",
    background: "rgba(255, 250, 242, 0.92)",
    boxShadow: "var(--shadow)"
  },
  copy: {
    display: "grid",
    gap: 2
  },
  title: {
    fontSize: 13
  },
  body: {
    fontSize: 12,
    color: "var(--muted)"
  },
  close: {
    border: "none",
    background: "#1d2038",
    color: "#fff",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap"
  }
};

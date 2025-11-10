import { CSSProperties, useEffect, useRef } from "react";
import DOMPurify from "dompurify";

function ShadowEmail({ html }: { html: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // Always refresh sanitized HTML
    const sanitized = DOMPurify.sanitize(html,
      {
        ADD_TAGS: ['style'],
        FORCE_BODY: true,
        ADD_ATTR: ["target"],
      });

    // ✅ Attach shadow root only once
    if (!shadowRef.current) {
      shadowRef.current = host.attachShadow({ mode: "open" });

      const shadow = shadowRef.current!;
      shadow.replaceChildren(); // clears all nodes in one line

      if (!isColorSchemeAware(sanitized)) {
        const backgroundStyle = document.createElement("style");
        backgroundStyle.textContent = `
          .mail-container {
            background: white;
            color: black;
            }`;
        shadowRef.current.appendChild(backgroundStyle);
      }

      const baseStyle = document.createElement("style");
      baseStyle.textContent = `
        .mail-container {
          font-family: system-ui, -apple-system, sans-serif;
          overflow: hidden;
        }

        img {
          max-width: 100%;
          height: auto;
        }`;
      shadowRef.current.appendChild(baseStyle);
    }

    const wrapper = document.createElement("div");
    wrapper.classList = "mail-container";
    wrapper.innerHTML = sanitized;
    shadowRef.current!.appendChild(wrapper);
  }, [html]);

  const containerStyle =
    {
      all: "initial",
      overflow: "hidden",
    } as CSSProperties;
  return <div ref={hostRef} style={containerStyle} />;
}

export default ShadowEmail;

function isColorSchemeAware(html: string) {
  return html.includes("prefers-color-scheme");
}

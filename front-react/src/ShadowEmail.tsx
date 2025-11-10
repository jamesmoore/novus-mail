import { CSSProperties, useEffect, useMemo, useRef } from "react";
import DOMPurify from "dompurify";

function ShadowEmail({ html }: { html: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);

  // memoize sanitized content
  const sanitized = useMemo(() => {
    return DOMPurify.sanitize(html,
      {
        ADD_TAGS: ['style'],
        FORCE_BODY: true,
        ADD_ATTR: ["target"],
      });
  }, [html])

  const lastClientWidth = useRef<number | null>(null);
  
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !shadowRef.current) return;

    const shadow = shadowRef.current;
    const wrapper = shadow.querySelector(".mail-container") as HTMLElement | null;
    if (!wrapper) return;

    const checkOverflow = () => {
      const exceeds = wrapper.scrollWidth > host.clientWidth + 1; // +1 to avoid rounding blips
      if (host.clientWidth !== lastClientWidth.current || exceeds) {
        console.log(wrapper.scrollWidth, host.clientWidth, exceeds);
        shadow.host.classList.toggle("email-overflowing", exceeds);
        lastClientWidth.current = host.clientWidth;
      }
    };

    checkOverflow();

    // optional: keep checking when resized
    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(wrapper);
    resizeObserver.observe(host);

    return () => resizeObserver.disconnect();
  }, [sanitized]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

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
          max-width: 100%;
        }
         
        :host(.email-overflowing) table,
        :host(.email-overflowing) td,
        :host(.email-overflowing) th,
        :host(.email-overflowing) img {
            min-width: unset !important;
            width: unset !important;
            max-width: 100% !important;
            height: auto;
        }        
        `;

      shadowRef.current.appendChild(baseStyle);
    }

    const wrapper = document.createElement("div");
    wrapper.classList = "mail-container";
    wrapper.innerHTML = sanitized;
    shadowRef.current!.appendChild(wrapper);
  }, [sanitized]);

  const containerStyle =
    {
      all: "initial",
      display: "block",
      width: "100%",
      overflow: "hidden",
    } as CSSProperties;
  return <div ref={hostRef} style={containerStyle} />;
}

export default ShadowEmail;

function isColorSchemeAware(html: string) {
  return html.includes("prefers-color-scheme");
}

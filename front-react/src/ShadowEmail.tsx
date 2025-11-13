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
        RETURN_DOM_FRAGMENT: true,
      });
  }, [html])

  const lastClientWidth = useRef<number | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // ✅ Attach shadow root only once
    if (!shadowRef.current) {
      shadowRef.current = host.attachShadow({ mode: "open" });

      const shadow = shadowRef.current!;
      shadow.replaceChildren(); // clears all nodes in one line

      const colorSchemeAware = isColorSchemeAware(sanitized);
      shadowRef.current!.host.classList.toggle("email-light", !colorSchemeAware);
      const isUnStyled = isUnstyledEmail(sanitized);
      shadowRef.current!.host.classList.toggle("email-unstyled", isUnStyled);
      const baseStyle = document.createElement("style");
      baseStyle.textContent = GetStyles();

      shadowRef.current.appendChild(baseStyle);
    }

    const wrapper = document.createElement("div");
    wrapper.classList.add("mail-container");
    wrapper.appendChild(sanitized);
    shadowRef.current!.appendChild(wrapper);

    const checkOverflow = () => {
      const exceeds = wrapper.scrollWidth > host.clientWidth + 1; // +1 to avoid rounding blips
      if (host.clientWidth !== lastClientWidth.current || exceeds) {
        console.log(wrapper.scrollWidth, host.clientWidth, exceeds);
        shadowRef.current!.host.classList.toggle("email-overflowing", exceeds);
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

  const containerStyle =
    {
      all: "initial",
      display: "block",
    } as CSSProperties;
  return <div ref={hostRef} style={containerStyle} />;
}

export default ShadowEmail;


function GetStyles(): string {
  return `
  .mail-container {
    font-family: system-ui, -apple-system, sans-serif;
    overflow: hidden;
    max-width: 100%;
    border-radius: 4px;
  }

  :host(.email-unstyled) .mail-container {
    padding: 4px;
  }

  :host(.email-light) .mail-container {
    background: white;
    color: black;
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
}

function isColorSchemeAware(fragment: DocumentFragment) {
  const styles = fragment.querySelectorAll("style");

  for (const style of styles) {
    const css = style.textContent || "";
    if (css.includes("prefers-color-scheme") || css.includes("light-dark")) {
      return true;
    }
  }

  return false;
}

function isUnstyledEmail(fragment: DocumentFragment) {
  // 1. Check for any <style> tag
  if (fragment.querySelector("style")) return false;

  // 2. Check for tables (typical layout elements)
  if (fragment.querySelector("table")) return false;

  // 3. Check for inline style attributes that suggest layout
  if (fragment.querySelector("[style*='margin']") ||
    fragment.querySelector("[style*='width']") ||
    fragment.querySelector("[style*='max-width']")) return false;

  // 4. If it's mostly paragraphs and lists, treat as unstyled
  const meaningful = fragment.querySelectorAll("p, ul, ol, li, a, h1, h2, h3, hr, br, summary, details");
  const total = fragment.querySelectorAll("*");
  if (meaningful.length / total.length > 0.6) return true;

  return false;
}
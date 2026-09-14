import emailStyles from "./shadow-email.css?inline";
import { CSSProperties, useEffect, useMemo, useRef } from "react";
import DOMPurify from "dompurify";

function ShadowEmail({ html }: { html: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);

  const sanitized = useMemo(() => {
    return DOMPurify.sanitize(html,
      {
        ADD_TAGS: ['style'],
        FORCE_BODY: true,
        ADD_ATTR: ["target"],
        RETURN_DOM_FRAGMENT: true,
      });
  }, [html])

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const shadow = shadowRef.current ?? host.attachShadow({ mode: "open" });
    shadowRef.current = shadow;

    host.classList.toggle("email-light", !isColorSchemeAware(sanitized));
    host.classList.toggle("email-unstyled", isUnstyledEmail(sanitized));

    const baseStyle = document.createElement("style");
    baseStyle.textContent = emailStyles;
    const wrapper = document.createElement("div");
    wrapper.classList.add("mail-container");
    wrapper.appendChild(sanitized.cloneNode(true));

    // Replace the previous message rather than appending to it. Cloning the
    // fragment also keeps the memoized sanitized value reusable in Strict Mode.
    shadow.replaceChildren(baseStyle, wrapper);

    const checkOverflow = () => {
      const exceeds = wrapper.scrollWidth > host.clientWidth + 1; // +1 to avoid rounding blips
      host.classList.toggle("email-overflowing", exceeds);
    };

    checkOverflow();

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
  if (fragment.querySelector("style")) return false;

  const total = fragment.querySelectorAll("*").length;

  if (total === 0) return true;

  const styled = fragment.querySelectorAll<HTMLElement>("[style]").length;
  const ratio = styled / total;

  return ratio < 0.25;
}

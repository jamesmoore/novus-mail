import { CSSProperties, useEffect, useRef } from "react";
import DOMPurify from "dompurify";

DOMPurify.addHook("afterSanitizeElements", (node) => {
  if (node.nodeName === "IMG") {
    const img = node as HTMLImageElement;
    const w = parseInt(img.getAttribute("width") ?? "0", 10);
    const h = parseInt(img.getAttribute("height") ?? "0", 10);

    // read inline styles too
    const style = img.getAttribute("style") ?? "";
    const tinyByAttr = (w && w <= 1) || (h && h <= 1);
    const tinyByStyle = /\b(width|height)\s*:\s*1(px)?\b/i.test(style);
    const invisible = /display\s*:\s*none|opacity\s*:\s*0/i.test(style);

    const trackerBySrc =
      /pixel|track|open|beacon/i.test(img.src) ||
      /(mailtrack|mandrill|sendgrid|google-analytics)/i.test(img.src);

    if (tinyByAttr || tinyByStyle || invisible || trackerBySrc) {
      img.remove(); // strip it entirely
    }
  }
});

function ShadowEmail({ html }: { html: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // Always refresh sanitized HTML
    const sanitized = DOMPurify.sanitize(html, { ADD_TAGS: ['style'], FORCE_BODY: true});

    // ✅ Attach shadow root only once
    if (!shadowRef.current) {
      shadowRef.current = host.attachShadow({ mode: "open" });

      // base stylesheet for default look
      const baseStyle = document.createElement("style");
      baseStyle.textContent = isColorSchemeAware(sanitized) ? `
        #containerDiv {
          font-family: system-ui, -apple-system, sans-serif;
          overflow: hidden;
        }

        img {
          max-width: 100%;
          height: auto;
        }
      ` :
        `
        #containerDiv {
          font-family: system-ui, -apple-system, sans-serif;    
          background: white;
          color: black;
          overflow: hidden;
        }

        img {
          max-width: 100%;
          height: auto;
        }
      `;
      shadowRef.current.appendChild(baseStyle);
    }


    // Replace old content
    // Remove all nodes after the base <style>
    while (shadowRef.current!.childNodes.length > 1) {
      shadowRef.current!.removeChild(shadowRef.current!.lastChild!);
    }

    const wrapper = document.createElement("div");
    wrapper.id = "containerDiv";
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

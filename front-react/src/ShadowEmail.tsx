import { CSSProperties, useEffect, useRef } from "react";
import DOMPurify from "dompurify";

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

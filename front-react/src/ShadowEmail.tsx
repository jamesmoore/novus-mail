import { useEffect, useRef } from "react";
import DOMPurify from 'dompurify';

function ShadowEmail({ html }: { html: string }) {
    const hostRef = useRef<HTMLDivElement>(null);
    const shadowRef = useRef<ShadowRoot | null>(null);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;

        // ✅ Attach shadow root only once
        if (!shadowRef.current) {
            shadowRef.current = host.attachShadow({ mode: "open" });

            // base stylesheet for default look
            const baseStyle = document.createElement("style");
            baseStyle.textContent = `
        :host {
          all: initial;
            color: black;
            background: white;
            font-family: system-ui, sans-serif;
            display: block;
          }
          img { max-width: 100%; height: auto; }
          `;
          shadowRef.current.appendChild(baseStyle);
        }

        // Always refresh sanitized HTML
        const sanitized = DOMPurify.sanitize(html);

        // Replace old content
        // Remove all nodes after the base <style>
        while (shadowRef.current!.childNodes.length > 1) {
            shadowRef.current!.removeChild(shadowRef.current!.lastChild!);
        }

        const wrapper = document.createElement("div");
        wrapper.innerHTML = sanitized;
        shadowRef.current!.appendChild(wrapper);
    }, [html]);

    return <div ref={hostRef} style={{ width: "100%" }} />;
}

export default ShadowEmail;
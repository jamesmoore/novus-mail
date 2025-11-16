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
    else {
      img.loading = "lazy";         // improve perf
      img.referrerPolicy = "no-referrer"; // privacy
    }
  }

  if (node.nodeName === "A") {
    const anchor = node as HTMLAnchorElement;
    if (anchor.hasAttribute("href")) {
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
    }
  }
});

import { useEffect, useCallback } from "react";
import useUnreadCounts from "./use-unread-counts";
import { AppTitle } from "./app";

export default function PageTitle() {

    const { data: unreadCounts } = useUnreadCounts();

    const setFaviconBadge = useCallback((showBadge: boolean) => {
        const iconLinks = Array.from(
            document.querySelectorAll<HTMLLinkElement>("link[rel~='icon'], link[rel='shortcut icon']")
        );
        if (iconLinks.length === 0) return;

        if (!showBadge) {
            for (const link of iconLinks) {
                const originalHref = link.dataset.originalHref;
                if (originalHref) link.href = originalHref;
            }
            return;
        }

        for (const link of iconLinks) {
            if (!link.dataset.originalHref) link.dataset.originalHref = link.href;
        }
        const sourceLink = iconLinks.find(link => link.href.endsWith(".png")) ?? iconLinks[0];
        const img = new Image();
        img.onload = () => {
            const size = Math.max(img.naturalWidth || 0, img.naturalHeight || 0) || 96;
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.drawImage(img, 0, 0, size, size);
            const dotRadius = Math.max(16, Math.round(size * 0.16));
            const margin = Math.max(2, Math.round(size * 0.04));
            const cx = size - margin - dotRadius;
            const cy = size - margin - dotRadius;
            ctx.beginPath();
            ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = "#ef4444"; // bg-red-500
            ctx.fill();
            ctx.strokeStyle = "#ffffff"; // white outline
            ctx.lineWidth = Math.max(2, Math.round(size * 0.02));
            ctx.stroke();
            const dataUrl = canvas.toDataURL("image/png");
            for (const link of iconLinks) {
                link.href = dataUrl;
            }
        };
        img.src = sourceLink.href;
    }, []);

    // Update theme-color meta tag based on current theme
    useEffect(() => {
        const updateThemeColor = () => {
            const isDark = document.documentElement.classList.contains('dark');
            const themeColor = isDark ? '#171717' : '#fafafa';
            
            let metaThemeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
            if (!metaThemeColor) {
                metaThemeColor = document.createElement('meta');
                metaThemeColor.name = 'theme-color';
                document.head.appendChild(metaThemeColor);
            }
            metaThemeColor.content = themeColor;
        };

        // Initial update
        updateThemeColor();

        // Watch for theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    updateThemeColor();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    // update page titles
    useEffect(() => {
        const unreadCount = unreadCounts?.map(p => p.unread).reduce((p, q) => p + q, 0) ?? 0;
        const title = `${AppTitle}${import.meta.env.DEV ? ' [DEV]' : ''}${unreadCount > 0 ? ` (${unreadCount})` : ''}`;
        //document.title = ''; // https://stackoverflow.com/questions/72982365/setting-document-title-doesnt-change-the-tabs-text-after-pressing-back-in-the
        document.title = title;

        setFaviconBadge(unreadCount > 0);

        // Update Badge API for PWA
        if ('setAppBadge' in navigator) {
            if (unreadCount > 0) {
                navigator.setAppBadge(unreadCount).catch(() => {
                    // Ignore errors if Badge API is not supported
                });
            } else {
                navigator.clearAppBadge().catch(() => {
                    // Ignore errors if Badge API is not supported
                });
            }
        }

    }, [unreadCounts, setFaviconBadge]);

    return null;
}

import { useEffect } from "react";

type SeoProps = {
  title: string;
  description: string;
  canonicalPath: string;
  indexable?: boolean;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
};

function setMeta(selector: string, attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.content = content;
}

export function Seo({
  title,
  description,
  canonicalPath,
  indexable = true,
  structuredData,
}: SeoProps) {
  useEffect(() => {
    const url = `https://robiacopilot.site${canonicalPath}`;

    document.title = title;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:url"]', "property", "og:url", url);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
      description,
    );
    setMeta(
      'meta[name="robots"]',
      "name",
      "robots",
      indexable ? "index, follow" : "noindex, follow",
    );

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }

    canonical.href = url;

    const existingStructuredData = document.getElementById(
      "robia-route-structured-data",
    );
    if (!structuredData) {
      existingStructuredData?.remove();
      return;
    }
    const script = existingStructuredData ?? document.createElement("script");
    script.id = "robia-route-structured-data";
    script.setAttribute("type", "application/ld+json");
    script.textContent = JSON.stringify(structuredData);
    if (!existingStructuredData) document.head.appendChild(script);
  }, [canonicalPath, description, indexable, structuredData, title]);

  return null;
}

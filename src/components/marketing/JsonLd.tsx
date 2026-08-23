/**
 * Emits a JSON-LD block.
 *
 * Rendered as a plain script tag rather than through next/script, because
 * structured data has to be in the HTML the crawler receives. A deferred or
 * client-injected script is invisible to most of them.
 *
 * The payload is serialised with JSON.stringify and then has its `<` escaped.
 * Any string in a schema object (a plan tagline, an FAQ answer) could otherwise
 * contain `</script>` and close the tag early.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

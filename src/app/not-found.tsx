import { EmptyState, Button } from "@/components/ui";

// Root 404. Without this, an unmatched path rendered Next's unstyled default
// "404 | This page could not be found" — no nav, no branding, no way back.
export default function NotFound() {
  return (
    <div className="min-h-[70vh] grid place-items-center">
      <EmptyState
        icon="search_off"
        title="Page not found"
        body="This link doesn't lead anywhere. It may have moved, or the address might have a typo."
        action={
          <Button variant="primary" size="md" href="/">
            Back to home
          </Button>
        }
      />
    </div>
  );
}

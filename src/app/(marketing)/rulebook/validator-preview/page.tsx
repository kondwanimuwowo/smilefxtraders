// TEMPORARY review route for the UI/UX restyle. Delete once the Validator's
// styling is signed off.
//
// Mounted here rather than at /validator because the real page sits behind the
// (app) auth guard and the app shell's Prisma queries -- neither of which is
// reachable while local DATABASE_URL points at the 6543 pooler. Validator
// itself takes no props and keeps all its state client-side, so it renders
// standalone -- the only thing it needs from the app shell is the React Query
// provider, which is imported directly here.
import { Providers } from "@/lib/providers";
import { Validator } from "../../../(app)/validator/Validator";

export const metadata = {
  title: "Validator preview",
  robots: { index: false, follow: false },
};

export default function ValidatorPreviewPage() {
  return (
    // pt-28 clears the marketing layout's fixed nav, which the real /validator
    // page does not sit under.
    <div className="bg-app-bg min-h-screen">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 pt-28 pb-24">
        <Providers>
          <Validator />
        </Providers>
      </div>
    </div>
  );
}

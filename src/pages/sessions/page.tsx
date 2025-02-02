import Providers from "@/utils/providers";

import Sessions from "./_components/Sessions";

export default function SessionPage({ sessions, accounts, currentSessionId }: any) {
  return (
    <Providers>
      <Sessions sessions={sessions} accounts={accounts} currentSessionId={currentSessionId} />
    </Providers>
  );
}

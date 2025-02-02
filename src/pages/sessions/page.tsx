import Sessions from "./_components/Sessions";
import Providers from "@/utils/providers"

export default function SessionPage({sessions, accounts, currentSessionId}:any) {
  return (
    <Providers>
        <Sessions sessions={sessions} accounts={accounts} currentSessionId={currentSessionId}/>
    </Providers>
  )
}

// ÉQUIPE CAPTURE — parcours web
import { Entete } from "@/components/ui";
import SignalementFlow from "@/components/signalement/SignalementFlow";

export default function Signaler() {
  return (
    <>
      <Entete titre="Signaler" />
      <main className="flex-1">
        <SignalementFlow />
      </main>
    </>
  );
}

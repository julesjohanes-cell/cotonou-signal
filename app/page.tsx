import Link from "next/link";
import { Entete } from "@/components/ui";

export default function Accueil() {
  return (
    <>
      <Entete retour={null} />
      <main className="flex flex-1 flex-col gap-6 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-6">
        <section className="fond-marque rounded-2xl p-6">
          <h1 className="text-3xl font-extrabold leading-tight">
            Un problème dans ta rue ?<br />
            <span className="text-citron">Signale-le en 1 minute.</span>
          </h1>
          <p className="mt-2 text-sur-marque-doux">Photo sur place, position vérifiée, la mairie s&apos;en occupe.</p>
          <Link
            href="/signaler"
            className="mt-5 block rounded-xl bg-citron py-4 text-center text-lg font-bold text-sur-citron"
          >
            📷 Signaler un problème
          </Link>
        </section>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/carte" className="rounded-xl border border-filet bg-surface p-4 font-semibold">
            🗺️ Voir la carte
          </Link>
          <Link href="/suivi" className="rounded-xl border border-filet bg-surface p-4 font-semibold">
            🔎 Suivre un signalement
          </Link>
        </div>
        <p className="text-sm text-encre-pale">
          Pas de données mobiles ? Écris « Signaler » sur WhatsApp au numéro de la plateforme.
        </p>
        <Link href="/mairie" className="mt-auto flex min-h-11 items-center justify-center text-sm text-violet underline">
          Espace mairie (bonus)
        </Link>
      </main>
    </>
  );
}

import Link from "next/link";
import { Entete } from "@/components/ui";

export default function Accueil() {
  return (
    <>
      <Entete retour={null} />
      <main className="flex flex-1 flex-col gap-6 p-6">
        <section className="rounded-2xl bg-violet-950 p-6 text-white">
          <h1 className="text-3xl font-extrabold leading-tight">
            Un problème dans ta rue ?<br />
            <span className="text-lime-400">Signale-le en 1 minute.</span>
          </h1>
          <p className="mt-2 text-violet-200">Photo sur place, position vérifiée, la mairie s&apos;en occupe.</p>
          <Link
            href="/signaler"
            className="mt-5 block rounded-xl bg-lime-400 py-4 text-center text-lg font-bold text-violet-950"
          >
            📷 Signaler un problème
          </Link>
        </section>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/carte" className="rounded-xl border bg-white p-4 font-semibold">
            🗺️ Voir la carte
          </Link>
          <Link href="/suivi" className="rounded-xl border bg-white p-4 font-semibold">
            🔎 Suivre un signalement
          </Link>
        </div>
        <p className="text-sm text-gray-500">
          Pas de données mobiles ? Écris « Signaler » sur WhatsApp au numéro de la plateforme.
        </p>
        <Link href="/mairie" className="mt-auto text-center text-sm text-violet-900 underline">
          Espace mairie
        </Link>
      </main>
    </>
  );
}

"use client";
// BONUS — espace agent / élu en front (Ant Design). Par défaut, la mairie travaille dans Django admin.
// ÉQUIPE MAIRIE — espace agent / élu (Ant Design) : voir les points, changer le statut, ajouter la photo "après"
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloseOutlined } from "@ant-design/icons";
import { App, Button, Card, Segmented, Select, Statistic, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Entete, LibelleCategorie } from "@/components/ui";
import { dateCourte } from "@/lib/dates";
import { useAjouterPhotoApres, useChangerStatut, useSignalementsMairie } from "@/hooks/useSignalements";
import { MapView, type Marqueur } from "@/components/carte";
import CameraCapture from "@/components/CameraCapture";
import { abonnerSession, deconnexion, lireProfilBrut, ApiError } from "@/lib/api";
import { SERVICES, STATUTS, categorie } from "@/lib/categories";
import type { Profil, SignalementMairie, Statut } from "@/lib/types";

// Route protégée : proxy.ts redirige vers /connexion sans session, avant même d'afficher cette page.
export default function Mairie() {
  const router = useRouter();
  // undefined côté serveur, puis le profil lu dans le cookie (sans secret)
  const brut = useSyncExternalStore(abonnerSession, lireProfilBrut, () => undefined);
  const profil = useMemo<Profil | null>(() => (brut ? (JSON.parse(brut) as Profil) : null), [brut]);
  const quitter = useCallback(async () => {
    await deconnexion();
    router.replace("/connexion");
  }, [router]);

  if (brut === undefined) return null;
  return (
    <>
      <Entete titre="Espace mairie (bonus)" />
      {profil ? (
        <TableauDeBord session={profil} onDeconnexion={quitter} />
      ) : (
        <main className="p-6 text-center">
          Session expirée. <Link href="/connexion?suite=/mairie" className="text-violet underline">Se reconnecter</Link>
        </main>
      )}
    </>
  );
}

function TableauDeBord({ session, onDeconnexion }: { session: Profil; onDeconnexion: () => void }) {
  const { message } = App.useApp();
  const [statut, setStatut] = useState<Statut | undefined>();
  const [service, setService] = useState<string | undefined>(session.service ?? undefined);
  const [selection, setSelection] = useState<string | null>(null);

  // Rafraîchi toutes les 10 s par le hook : le signalement fait en direct apparaît pendant la démo
  const { data, error } = useSignalementsMairie({ statut, service });
  const liste = useMemo(() => data ?? [], [data]);
  const statutMaj = useChangerStatut();
  const photoApres = useAjouterPhotoApres();

  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) onDeconnexion();
  }, [error, onDeconnexion]);

  const marqueurs: Marqueur[] = useMemo(
    () =>
      liste.map((s) => ({
        id: s.numero_suivi, lat: s.lat, lng: s.lng, couleur: STATUTS[s.statut].couleur,
        contenu: categorie(s.categorie).icone, titre: categorie(s.categorie).libelle, badge: s.nb_confirmations,
      })),
    [liste],
  );
  const choisi = liste.find((s) => s.numero_suivi === selection) ?? null;

  const stats = useMemo(() => {
    const n = (st: Statut) => liste.filter((s) => s.statut === st).length;
    const total = liste.length;
    return { total, nouveau: n("nouveau"), encours: n("pris_en_charge"), resolu: n("resolu"), taux: total ? Math.round((n("resolu") / total) * 100) : 0 };
  }, [liste]);

  async function majStatut(st: Statut) {
    if (!choisi) return;
    try {
      await statutMaj.mutateAsync({ numero: choisi.numero_suivi, statut: st });
      message.success(`Statut : ${STATUTS[st].libelle}`);
    } catch (e) {
      message.error(e instanceof ApiError ? e.message : "Modification impossible");
    }
  }

  const colonnes: ColumnsType<SignalementMairie> = [
    {
      title: "Problème",
      key: "categorie",
      render: (_, s) => (
        <div>
          <div className="font-semibold"><LibelleCategorie code={s.categorie} /></div>
          <div className="text-xs text-encre-pale">
            {s.numero_suivi} · {dateCourte(s.cree_le)}{s.nb_confirmations > 1 ? ` · +${s.nb_confirmations - 1}` : ""}
          </div>
        </div>
      ),
    },
    {
      title: "Statut",
      key: "statut",
      width: 130,
      render: (_, s) => <Tag color={STATUTS[s.statut].couleur}>{STATUTS[s.statut].libelle}</Tag>,
    },
  ];

  return (
    <main className="flex flex-1 flex-col gap-3 p-3">
      <div className="flex items-center justify-between text-sm">
        <span>Connecté : <b>{session.nom}</b> ({session.role})</span>
        <Button type="link" onClick={onDeconnexion}>Déconnexion</Button>
      </div>

      {/* Chiffres pour l'élu */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Card size="small"><Statistic title="Total" value={stats.total} /></Card>
        <Card size="small"><Statistic title="Nouveaux" value={stats.nouveau} /></Card>
        <Card size="small"><Statistic title="En cours" value={stats.encours} /></Card>
        <Card size="small"><Statistic title="Résolus" value={stats.resolu} suffix={`(${stats.taux} %)`} /></Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          allowClear
          placeholder="Tous les statuts"
          value={statut}
          onChange={setStatut}
          className="min-w-44"
          options={Object.entries(STATUTS).map(([k, v]) => ({ value: k as Statut, label: v.libelle }))}
        />
        <Select
          allowClear
          placeholder="Tous les services"
          value={service}
          onChange={setService}
          className="min-w-56"
          options={SERVICES.map((s) => ({ value: s, label: s }))}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <MapView marqueurs={marqueurs} selection={selection} onSelection={setSelection} className="h-80 w-full rounded-xl md:h-[70dvh]" />
        <div className="flex flex-col gap-3 md:h-[70dvh] md:overflow-y-auto">
          {choisi && (
            <Card
              size="small"
              title={<LibelleCategorie code={choisi.categorie} />}
              extra={<Button type="text" onClick={() => setSelection(null)} aria-label="Fermer" icon={<CloseOutlined />} />}
            >
              <p className="text-xs text-encre-pale">
                {choisi.numero_suivi} · {choisi.source} · ± {choisi.precision_m} m · {choisi.service} · {dateCourte(choisi.cree_le)}
              </p>
              {choisi.description && <p className="text-sm">{choisi.description}</p>}
              <div className="my-2 grid grid-cols-2 gap-2">
                {choisi.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={choisi.photo_url} alt="Avant" className="h-32 w-full rounded-lg object-cover" />
                ) : <div className="flex h-32 items-center justify-center rounded-lg bg-teinte text-xs text-encre-pale">Pas de photo</div>}
                {choisi.photo_apres_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={choisi.photo_apres_url} alt="Après" className="h-32 w-full rounded-lg object-cover" />
                ) : <div className="flex h-32 items-center justify-center rounded-lg bg-teinte text-xs text-encre-pale">Photo après : à venir</div>}
              </div>
              <Segmented<Statut>
                block
                value={choisi.statut}
                onChange={majStatut}
                options={(["nouveau", "pris_en_charge", "resolu", "rejete"] as Statut[]).map((st) => ({ value: st, label: STATUTS[st].libelle }))}
              />
              {choisi.statut === "resolu" && !choisi.photo_apres_url && (
                <div className="mt-3">
                  <CameraCapture
                    libelle="Ajouter la photo après"
                    onPhoto={async (p) => {
                      try {
                        await photoApres.mutateAsync({ numero: choisi.numero_suivi, photo: p.blob });
                        message.success("Photo « après » ajoutée");
                      } catch (e) {
                        message.error(e instanceof ApiError ? e.message : "Envoi impossible");
                      }
                    }}
                  />
                </div>
              )}
            </Card>
          )}
          <Table<SignalementMairie>
            size="small"
            rowKey="numero_suivi"
            columns={colonnes}
            dataSource={liste}
            pagination={{ pageSize: 20, hideOnSinglePage: true }}
            onRow={(s) => ({ onClick: () => setSelection(s.numero_suivi), className: "cursor-pointer" })}
            rowClassName={(s) => (s.numero_suivi === selection ? "bg-teinte" : "")}
          />
        </div>
      </div>
    </main>
  );
}

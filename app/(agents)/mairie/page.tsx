"use client";
// BONUS — espace agents en front (Ant Design). Par défaut, la mairie travaille dans Django admin.
// Voir les signalements de ses services, les prendre en charge, les résoudre avec la photo « après ».
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloseOutlined } from "@ant-design/icons";
import { App, Button, Card, Select, Statistic, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Entete, LibelleCategorie } from "@/components/ui";
import { dateCourte } from "@/lib/dates";
import { useAjouterPhotoApres, useChangerStatut, useSignalementsAgent } from "@/hooks/useSignalements";
import { MapView, type Marqueur } from "@/components/carte";
import CameraCapture from "@/components/CameraCapture";
import { abonnerSession, deconnexion, lireProfilBrut, ApiError, SUIVANT } from "@/lib/api";
import { STATUTS, categorie, servicesDe } from "@/lib/categories";
import type { Profil, SignalementAgent, Statut, StatutAgent } from "@/lib/types";

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

const ACTION: Record<StatutAgent, string> = { in_progress: "Prendre en charge", resolved: "Marquer résolu" };

function TableauDeBord({ session, onDeconnexion }: { session: Profil; onDeconnexion: () => void }) {
  const { message } = App.useApp();
  const [statut, setStatut] = useState<Statut | undefined>();
  const [selection, setSelection] = useState<string | null>(null);

  // Rafraîchi toutes les 10 s par le hook : le signalement fait en direct apparaît pendant la démo.
  // Django ne renvoie que les catégories des services de l'agent.
  const { data, error } = useSignalementsAgent({ status: statut });
  const liste = useMemo(() => data ?? [], [data]);
  const statutMaj = useChangerStatut();
  const photoApres = useAjouterPhotoApres();

  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) onDeconnexion();
  }, [error, onDeconnexion]);

  const marqueurs: Marqueur[] = useMemo(
    () =>
      liste.map((s) => ({
        id: s.tracking_code, lat: s.lat, lng: s.lng, couleur: STATUTS[s.status].couleur,
        contenu: categorie(s.category).icone, titre: categorie(s.category).libelle, badge: s.support_count,
      })),
    [liste],
  );
  const choisi = liste.find((s) => s.tracking_code === selection) ?? null;
  const suivant = choisi ? SUIVANT[choisi.status] : undefined;

  const stats = useMemo(() => {
    const n = (st: Statut) => liste.filter((s) => s.status === st).length;
    const total = liste.length;
    return { total, nouveau: n("published"), encours: n("in_progress"), resolu: n("resolved"), taux: total ? Math.round((n("resolved") / total) * 100) : 0 };
  }, [liste]);

  async function avancer(code: string, st: StatutAgent) {
    try {
      await statutMaj.mutateAsync({ code, status: st });
      message.success(`Statut : ${STATUTS[st].libelle}`);
    } catch (e) {
      message.error(e instanceof ApiError ? e.message : "Modification impossible");
    }
  }

  const colonnes: ColumnsType<SignalementAgent> = [
    {
      title: "Problème",
      key: "category",
      render: (_, s) => (
        <div>
          <div className="font-semibold"><LibelleCategorie code={s.category} /></div>
          <div className="text-xs text-encre-pale">
            {s.tracking_code} · {dateCourte(s.created_at)}{s.support_count > 1 ? ` · +${s.support_count - 1}` : ""}
          </div>
        </div>
      ),
    },
    {
      title: "Statut",
      key: "status",
      width: 130,
      render: (_, s) => <Tag color={STATUTS[s.status].couleur}>{STATUTS[s.status].libelle}</Tag>,
    },
  ];

  return (
    <main className="flex flex-1 flex-col gap-3 p-3">
      <div className="flex items-center justify-between text-sm">
        <span>
          Connecté : <b>{session.username}</b> ({session.services.length ? session.services.join(", ") : "tous les services"})
        </span>
        <Button type="link" onClick={onDeconnexion}>Déconnexion</Button>
      </div>

      {/* Chiffres pour l'élu */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Card size="small"><Statistic title="Total" value={stats.total} /></Card>
        <Card size="small"><Statistic title="Publiés" value={stats.nouveau} /></Card>
        <Card size="small"><Statistic title="Pris en charge" value={stats.encours} /></Card>
        <Card size="small"><Statistic title="Résolus" value={stats.resolu} suffix={`(${stats.taux} %)`} /></Card>
      </div>

      <Select
        allowClear
        placeholder="Tous les statuts"
        value={statut}
        onChange={setStatut}
        className="min-w-44 self-start"
        options={Object.entries(STATUTS).map(([k, v]) => ({ value: k as Statut, label: v.libelle }))}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <MapView marqueurs={marqueurs} selection={selection} onSelection={setSelection} className="h-80 w-full rounded-xl md:h-[70dvh]" />
        <div className="flex flex-col gap-3 md:h-[70dvh] md:overflow-y-auto">
          {choisi && (
            <Card
              size="small"
              title={<LibelleCategorie code={choisi.category} />}
              extra={<Button type="text" onClick={() => setSelection(null)} aria-label="Fermer" icon={<CloseOutlined />} />}
            >
              <p className="text-xs text-encre-pale">
                {choisi.tracking_code} · {choisi.channel === "whatsapp" ? "WhatsApp" : "Web"} · {servicesDe(choisi.category)} · {dateCourte(choisi.created_at)}
              </p>
              {choisi.description && <p className="text-sm">{choisi.description}</p>}
              <div className="my-2 grid grid-cols-2 gap-2">
                {choisi.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={choisi.photo_url} alt="Avant" className="h-32 w-full rounded-lg object-cover" />
                ) : <div className="flex h-32 items-center justify-center rounded-lg bg-teinte text-xs text-encre-pale">Pas de photo</div>}
                {choisi.photo_after_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={choisi.photo_after_url} alt="Après" className="h-32 w-full rounded-lg object-cover" />
                ) : <div className="flex h-32 items-center justify-center rounded-lg bg-teinte text-xs text-encre-pale">Photo après : à venir</div>}
              </div>
              {/* Transitions contrôlées par Django : published → in_progress → resolved */}
              {suivant && (
                <Button type="primary" block loading={statutMaj.isPending} onClick={() => avancer(choisi.tracking_code, suivant)}>
                  {ACTION[suivant]}
                </Button>
              )}
              {(choisi.status === "in_progress" || (choisi.status === "resolved" && !choisi.photo_after_url)) && (
                <div className="mt-3">
                  <CameraCapture
                    libelle={choisi.status === "in_progress" ? "Résoudre avec la photo après" : "Ajouter la photo après"}
                    onPhoto={async (p) => {
                      try {
                        await photoApres.mutateAsync({ code: choisi.tracking_code, photo: p.blob });
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
          <Table<SignalementAgent>
            size="small"
            rowKey="tracking_code"
            columns={colonnes}
            dataSource={liste}
            pagination={{ pageSize: 20, hideOnSinglePage: true }}
            onRow={(s) => ({ onClick: () => setSelection(s.tracking_code), className: "cursor-pointer" })}
            rowClassName={(s) => (s.tracking_code === selection ? "bg-teinte" : "")}
          />
        </div>
      </div>
    </main>
  );
}

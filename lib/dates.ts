// Dates en français (dayjs : léger, et c'est la bibliothèque de dates d'Ant Design).
import dayjs from "dayjs";
import "dayjs/locale/fr";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.locale("fr");

/** « 15 oct., 21:04 » */
export const dateCourte = (iso: string) => dayjs(iso).format("D MMM, HH:mm");

/** « il y a 3 jours » */
export const depuis = (iso: string) => dayjs(iso).fromNow();

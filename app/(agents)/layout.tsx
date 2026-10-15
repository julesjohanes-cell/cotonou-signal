// Espace agents (bonus) : seule partie de l'app qui charge Ant Design.
// Les pages citoyennes restent légères pour les petits téléphones et les petits forfaits (mobile d'abord).
import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntdProvider from "@/components/AntdProvider";

export default function LayoutAgents({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <AntdProvider>{children}</AntdProvider>
    </AntdRegistry>
  );
}

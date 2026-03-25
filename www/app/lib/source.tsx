import { docs } from "collections/server";
import { loader } from "fumadocs-core/source";
import {
  Rocket,
  Download,
  Zap,
  Settings,
  Terminal,
  Database,
  Layers,
  FolderOpen,
  Cloud,
  MessageSquare,
  Globe,
  Wrench,
  AlertTriangle,
} from "lucide-react";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  icon(icon) {
    if (!icon) return;
    const icons: Record<string, React.ReactElement> = {
      rocket: <Rocket />,
      download: <Download />,
      zap: <Zap />,
      settings: <Settings />,
      terminal: <Terminal />,
      database: <Database />,
      layers: <Layers />,
      "folder-open": <FolderOpen />,
      cloud: <Cloud />,
      "message-square": <MessageSquare />,
      globe: <Globe />,
      wrench: <Wrench />,
      "alert-triangle": <AlertTriangle />,
    };
    return icons[icon];
  },
});

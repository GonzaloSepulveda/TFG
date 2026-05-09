// Esta página ha sido movida al Dashboard de administrador
// Solo los admins pueden acceder a los análisis de trastornos desde: /dashboard

import { useEffect } from "preact/hooks";

export default function AnalysisPage() {
  useEffect(() => {
    // Redirigir al login si no es admin
    const token = localStorage.getItem("token");
    const isAdmin = localStorage.getItem("admin") === "true";
    
    if (!token || !isAdmin) {
      window.location.href = "/";
    } else {
      window.location.href = "/dashboard";
    }
  }, []);

  return <div>Redirigiendo...</div>;
}

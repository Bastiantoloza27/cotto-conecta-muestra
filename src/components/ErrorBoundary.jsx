import React from "react";
import { AlertTriangle, RefreshCw, Home, Wifi, Trash2 } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, autoRetried: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);

    // Si es un error de carga de módulo (chunk), recargar automáticamente UNA vez
    const isChunkError =
      error?.message?.includes("Failed to fetch dynamically imported module") ||
      error?.message?.includes("Loading chunk") ||
      error?.message?.includes("Loading CSS chunk") ||
      error?.name === "ChunkLoadError";

    if (isChunkError && !sessionStorage.getItem("eb_auto_reloaded")) {
      sessionStorage.setItem("eb_auto_reloaded", "1");
      setTimeout(() => window.location.reload(), 1500);
    }
  }

  isChunkOrNetworkError() {
    const msg = this.state.error?.message || "";
    return (
      msg.includes("Failed to fetch") ||
      msg.includes("Loading chunk") ||
      msg.includes("ChunkLoadError") ||
      msg.includes("NetworkError")
    );
  }

  handleReload = () => {
    sessionStorage.removeItem("eb_auto_reloaded");
    window.location.reload();
  };

  handleGoHome = () => {
    sessionStorage.removeItem("eb_auto_reloaded");
    window.location.href = "/";
  };

  handleClearCacheAndReload = async () => {
    sessionStorage.clear();
    localStorage.clear();
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    }
    window.location.reload(true);
  };

  render() {
    if (this.state.hasError) {
      const isNetworkRelated = this.isChunkOrNetworkError();
      const autoRetrying =
        isNetworkRelated && !sessionStorage.getItem("eb_auto_reloaded") === false;

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
          <div className="max-w-md w-full bg-white rounded-2xl border shadow-lg p-8 text-center space-y-5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mx-auto">
              {isNetworkRelated
                ? <Wifi className="w-8 h-8 text-orange-500" />
                : <AlertTriangle className="w-8 h-8 text-orange-500" />
              }
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {isNetworkRelated ? "Error de conexión" : "Ocurrió un error inesperado"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isNetworkRelated
                  ? "Hubo un problema al cargar la página. Esto suele ocurrir con conexión lenta o al actualizar la plataforma. Recarga para continuar."
                  : "Algo salió mal al cargar esta sección. Recarga la página para solucionarlo."
                }
              </p>
            </div>

            {this.state.error && (
              <details className="text-left bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                <summary className="font-medium cursor-pointer">Ver detalle del error</summary>
                <pre className="whitespace-pre-wrap break-all mt-2 opacity-70">
                  {this.state.error?.message || String(this.state.error)}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Recargar página
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-input bg-white text-sm font-medium hover:bg-muted transition-colors"
              >
                <Home className="w-4 h-4" />
                Ir al inicio
              </button>
            </div>

            <div className="border-t pt-4 mt-1">
              <p className="text-xs text-muted-foreground mb-3">
                ¿El problema persiste? Limpia el caché del navegador y recarga:
              </p>
              <button
                onClick={this.handleClearCacheAndReload}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-orange-100 text-orange-700 text-sm font-medium hover:bg-orange-200 transition-colors w-full sm:w-auto"
              >
                <Trash2 className="w-4 h-4" />
                Limpiar caché y recargar
              </button>
              <p className="text-xs text-muted-foreground/50 mt-2">
                Esto borra los archivos guardados del navegador y carga la versión más reciente.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
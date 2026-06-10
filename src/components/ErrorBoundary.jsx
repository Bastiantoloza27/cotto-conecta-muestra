import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
          <div className="max-w-md w-full bg-white rounded-2xl border shadow-lg p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-100 mx-auto">
              <AlertTriangle className="w-7 h-7 text-orange-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Ocurrió un error inesperado
            </h2>
            <p className="text-sm text-muted-foreground">
              Algo salió mal al cargar esta sección. Puedes intentar recargar o volver al inicio.
            </p>
            {this.state.error && (
              <details className="text-left bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground cursor-pointer">
                <summary className="font-medium mb-1 cursor-pointer">Ver detalle del error</summary>
                <pre className="whitespace-pre-wrap break-all mt-1">
                  {this.state.error?.message || String(this.state.error)}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center pt-2">
              <Button variant="outline" onClick={this.handleReset} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </Button>
              <Button onClick={this.handleGoHome} className="gap-2">
                <Home className="w-4 h-4" />
                Ir al inicio
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
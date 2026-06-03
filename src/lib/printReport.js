import { createRoot } from "react-dom/client";

/**
 * Abre una ventana nueva, renderiza un componente React dentro y lanza el diálogo de impresión.
 * @param {React.ReactElement} element - El componente a imprimir
 * @param {string} title - Título de la ventana
 * @param {number} [delay=700] - Milisegundos antes de llamar window.print()
 */
export function printReport(element, title = "Informe", delay = 700) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Permite ventanas emergentes para generar el informe.");
    return;
  }
  printWindow.document.title = title;
  const div = printWindow.document.createElement("div");
  printWindow.document.body.appendChild(div);
  const root = createRoot(div);
  root.render(element);
  setTimeout(() => {
    printWindow.print();
  }, delay);
}
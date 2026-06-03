const BRISTOL = [
  { tipo: 1, label: "Tipo 1", desc: "Bolitas duras separadas", emoji: "⚫", color: "bg-red-100 border-red-400 text-red-800" },
  { tipo: 2, label: "Tipo 2", desc: "Con forma de salchicha pero grumosa", emoji: "🟤", color: "bg-orange-100 border-orange-400 text-orange-800" },
  { tipo: 3, label: "Tipo 3", desc: "Forma de salchicha con grietas", emoji: "🟫", color: "bg-amber-100 border-amber-400 text-amber-800" },
  { tipo: 4, label: "Tipo 4", desc: "Suave, lisa, como salchicha o serpiente", emoji: "🟢", color: "bg-green-100 border-green-400 text-green-800" },
  { tipo: 5, label: "Tipo 5", desc: "Trozos blandos con bordes definidos", emoji: "🟡", color: "bg-yellow-100 border-yellow-400 text-yellow-800" },
  { tipo: 6, label: "Tipo 6", desc: "Trozos esponjosos, deshilachados", emoji: "🔶", color: "bg-orange-100 border-orange-500 text-orange-900" },
  { tipo: 7, label: "Tipo 7", desc: "Líquida, sin partes sólidas", emoji: "🔴", color: "bg-red-100 border-red-500 text-red-900" },
];

export { BRISTOL };

export default function BristolScale({ value, onChange }) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {BRISTOL.map((b) => (
        <button
          key={b.tipo}
          type="button"
          onClick={() => onChange(value === b.tipo ? null : b.tipo)}
          className={`flex flex-col items-center p-1.5 rounded-lg border-2 transition-all text-center ${
            value === b.tipo
              ? b.color + " scale-105 shadow-md"
              : "border-border bg-background hover:bg-muted"
          }`}
          title={`${b.label}: ${b.desc}`}
        >
          <span className="text-lg">{b.emoji}</span>
          <span className="text-[10px] font-bold mt-0.5">{b.tipo}</span>
        </button>
      ))}
    </div>
  );
}
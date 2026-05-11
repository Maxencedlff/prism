"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type Mode = "document" | "client" | "contract";

const MODES = [
  {
    id: "document" as Mode,
    label: "Document",
    icon: "📄",
    description: "Extrait les informations clés de n'importe quel document non structuré",
    placeholder: "Collez du texte ou déposez une image de document ici...",
  },
  {
    id: "client" as Mode,
    label: "Situation client",
    icon: "💬",
    description: "Analyse un litige ou une situation client complexe et propose une résolution",
    placeholder: "Collez un échange email ou décrivez la situation client...",
  },
  {
    id: "contract" as Mode,
    label: "Contrat",
    icon: "⚖️",
    description: "Identifie les risques et clauses à négocier dans un contrat",
    placeholder: "Collez le texte d'un contrat ou déposez une image...",
  },
];

export default function Home() {
  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referrer: document.referrer }),
    }).catch(() => {});
  }, []);

  const [mode, setMode] = useState<Mode>("document");
  const [text, setText] = useState("");
  const [image, setImage] = useState<{ data: string; type: string; name: string } | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMode = MODES.find((m) => m.id === mode)!;

  const reset = () => { setResult(null); setError(""); };

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setError("Fichiers supportés : images (JPG, PNG, WEBP) et PDF");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      if (file.type === "application/pdf") {
        setImage({ data: base64, type: "application/pdf", name: file.name });
      } else {
        setImage({ data: base64, type: file.type, name: file.name });
      }
      setText("");
      reset();
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const analyze = async () => {
    if (!text.trim() && !image) return;
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const body = image
        ? image.type === "application/pdf"
          ? { mode, pdf: image.data }
          : { mode, image: image.data, imageType: image.type }
        : { mode, text };

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const canAnalyze = !loading && (text.trim().length > 0 || image !== null);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Prism</h1>
            <p className="text-sm text-gray-400 mt-0.5">Analyse intelligente de documents professionnels</p>
          </div>
          <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">Démo portfolio</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setResult(null); setText(""); setImage(null); setError(""); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === m.id
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              <span>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        <p className="text-gray-400 text-sm">{currentMode.description}</p>

        <div className="space-y-3">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !image && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer ${
              dragging
                ? "border-indigo-400 bg-indigo-900/20"
                : image
                ? "border-gray-600 cursor-default"
                : "border-gray-700 hover:border-gray-500"
            }`}
          >
            {image ? (
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🖼️</span>
                  <div>
                    <p className="text-sm text-white font-medium">{image.name}</p>
                    <p className="text-xs text-gray-400">Image prête à analyser</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setImage(null); reset(); }}
                  className="text-gray-500 hover:text-white text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
                >
                  Supprimer
                </button>
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-gray-500 text-xs">
                  📎 Glissez une image ou un PDF ici ou <span className="text-indigo-400 underline">cliquez pour choisir</span>
                </p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,application/pdf"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />

          {!image && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-xs text-gray-600">ou</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={currentMode.placeholder}
                rows={7}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </>
          )}

          <button
            onClick={analyze}
            disabled={!canAnalyze}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-xl transition-all text-sm"
          >
            {loading ? "Analyse en cours..." : "Analyser"}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {result && <ResultPanel mode={mode} data={result} />}
      </div>
    </main>
  );
}

function ResultPanel({ mode, data }: { mode: Mode; data: Record<string, unknown> }) {
  if (mode === "document") return <DocumentResult data={data} />;
  if (mode === "client") return <ClientResult data={data} />;
  return <ContractResult data={data} />;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-2">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  if (!items?.length) return <p className="text-gray-500 text-sm">Aucun</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-md">{item}</span>
      ))}
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    faible: "bg-green-900/40 text-green-400 border-green-700",
    moyen: "bg-yellow-900/40 text-yellow-400 border-yellow-700",
    élevé: "bg-red-900/40 text-red-400 border-red-700",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-md border font-medium ${colors[level] || colors["moyen"]}`}>
      Risque {level}
    </span>
  );
}

function DocumentResult({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">Type :</span>
        <span className="text-sm font-medium text-white">{data.type as string}</span>
      </div>
      <Card title="Résumé">
        <p className="text-sm text-gray-300">{data.resume as string}</p>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Card title="Parties"><TagList items={data.parties as string[]} /></Card>
        <Card title="Montants"><TagList items={data.montants as string[]} /></Card>
        <Card title="Dates"><TagList items={data.dates as string[]} /></Card>
        <Card title="Risques"><TagList items={data.risques as string[]} /></Card>
      </div>
      <Card title="Actions requises">
        <ul className="space-y-1">
          {((data.actions as string[]) || []).map((a, i) => (
            <li key={i} className="text-sm text-gray-300 flex gap-2">
              <span className="text-indigo-400">→</span>{a}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function ClientResult({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <RiskBadge level={data.niveau_risque as string} />
        <span className="text-xs text-gray-400">
          Responsabilité : <span className="text-white">{data.responsabilite as string}</span>
        </span>
      </div>
      <Card title="Résumé de la situation">
        <p className="text-sm text-gray-300">{data.resume as string}</p>
      </Card>
      <Card title="Problème central">
        <p className="text-sm text-gray-300">{data.probleme_principal as string}</p>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Card title="Arguments client"><TagList items={data.points_client as string[]} /></Card>
        <Card title="Arguments entreprise"><TagList items={data.points_entreprise as string[]} /></Card>
      </div>
      <Card title="Recommandation">
        <p className="text-sm text-gray-300">{data.recommandation as string}</p>
      </Card>
      <Card title="Brouillon de réponse">
        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">{data.brouillon_reponse as string}</pre>
      </Card>
    </div>
  );
}

function ContractResult({ data }: { data: Record<string, unknown> }) {
  const clauses = (data.clauses_risquees as Array<{ clause: string; detail: string }>) || [];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <RiskBadge level={data.score_risque as string} />
        <span className="text-xs text-gray-400">
          {data.type_contrat as string} · {data.duree as string}
        </span>
      </div>
      <Card title="Résumé">
        <p className="text-sm text-gray-300">{data.resume as string}</p>
      </Card>
      <Card title="Clauses risquées">
        {clauses.length ? (
          <ul className="space-y-2">
            {clauses.map((c, i) => (
              <li key={i} className="text-sm">
                <span className="text-red-400 font-medium">{c.clause}</span>
                <span className="text-gray-400"> — {c.detail}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">Aucune clause risquée identifiée</p>
        )}
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Card title="Protections manquantes">
          <TagList items={data.protections_manquantes as string[]} />
        </Card>
        <Card title="Points à négocier">
          <TagList items={data.points_a_negocier as string[]} />
        </Card>
      </div>
    </div>
  );
}

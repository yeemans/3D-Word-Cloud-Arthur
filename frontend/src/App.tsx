import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, OrbitControls } from "@react-three/drei";

// ── types ─────────────────────────────────────────────────────────────────────
interface WordData {
  word: string;
  weight: number;
}

interface Word3D extends WordData {
  position: [number, number, number];
  color: string;
  fontSize: number;
}

// ── helpers ───────────────────────────────────────────────────────────────────
const PALETTE = [
  "#e8f4f8", "#a8d8ea", "#7ec8e3", "#5bb8d4",
];

function spherePoint(index: number, total: number): [number, number, number] {
  const phi = Math.acos(1 - (2 * (index + 0.5)) / total);
  const theta = Math.PI * (1 + Math.sqrt(5)) * index;
  const r = 3.8;
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
  ];
}

function buildWords(data: WordData[]): Word3D[] {
  return data.map((d, i) => ({
    ...d,
    position: spherePoint(i, data.length),
    color: PALETTE[i % PALETTE.length],
    fontSize: 0.2 + d.weight * 0.5,
  }));
}

// ── cloud scene ───────────────────────────────────────────────────────────────
function CloudScene({ words }: { words: Word3D[] }) {
  const groupRef = useRef<any>(null);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.08;
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <OrbitControls enableZoom enablePan={false} />
      <group ref={groupRef}>
        {words.map((w) => (
          <Text
            key={w.word}
            position={w.position}
            fontSize={w.fontSize}
            color={w.color}
            anchorX="center"
            anchorY="middle"
          >
            {w.word}
          </Text>
        ))}
      </group>
    </>
  );
}

// ── sample urls ───────────────────────────────────────────────────────────────
const SAMPLES = [
  { label: "BBC – Climate", url: "https://www.bbc.com/news/science-environment-56901261" },
  { label: "Los Gatos Race", url: "https://losgatan.com/cats-hill-50th-anniversary-this-saturday/" },
];

// ── main app ──────────────────────────────────────────────────────────────────
export default function App() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [words, setWords] = useState<Word3D[]>([]);



  return (
    <div style={s.root}>
      {/* background grid */}
      <div style={s.grid} />

      {/* header */}
      <header style={s.header}>
        <div style={s.logo}>
          <span style={s.logoDot} />
          Word Globe
        </div>
        <p style={s.tagline}>Interactive Word Map</p>
      </header>

      {/* canvas */}
      <div style={s.canvasWrap}>
        <Canvas camera={{ position: [0, 0, 9], fov: 55 }} style={{ background: "transparent" }}>
          {status === "done" && <CloudScene words={words} />}
        </Canvas>
        {status === "idle" && (
          <p style={s.hint}>enter a url below to visualise its topics</p>
        )}
        {status === "loading" && (
          <div style={s.loader}>
            <span style={s.loaderDot} />
            <span style={{ ...s.loaderDot, animationDelay: "0.2s" }} />
            <span style={{ ...s.loaderDot, animationDelay: "0.4s" }} />
          </div>
        )}
      </div>

      {/* input panel */}
      <div style={s.panel}>
        <div style={s.inputRow}>
          <input
            style={s.input}
            type="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter"}
          />
          <button
            style={{ ...s.btn, ...(status === "loading" ? s.btnDisabled : {}) }}
            
            disabled={status === "loading"}
          >
            {status === "loading" ? "…" : "Analyse →"}
          </button>
        </div>

        {status === "error" && (
          <p style={s.error}>{errorMsg}</p>
        )}

        <div style={s.samples}>
          {SAMPLES.map((s2) => (
            <button key={s2.url} style={s.chip} onClick={() => setUrl(s2.url)}>
              {s2.label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080e17; }
        @keyframes pulse { 0%,100%{opacity:.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#080e17",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "'DM Sans', sans-serif",
    color: "#e0eaf4",
    position: "relative",
    overflow: "hidden",
  },
  grid: {
    position: "fixed",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
    backgroundSize: "48px 48px",
    pointerEvents: "none",
  },
  header: {
    textAlign: "center",
    paddingTop: "2.5rem",
    zIndex: 1,
    animation: "fadeUp 0.8s ease both",
  },
  logo: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "1.1rem",
    letterSpacing: "0.25em",
    color: "#7ec8e3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "6px",
  },
  logoDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#7ec8e3",
    display: "inline-block",
  },
  tagline: {
    fontSize: "0.78rem",
    color: "#4a6b80",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  canvasWrap: {
    width: "100%",
    maxWidth: "720px",
    height: "440px",
    position: "relative",
    zIndex: 1,
  },
  hint: {
    position: "absolute",
    bottom: "1.5rem",
    width: "100%",
    textAlign: "center",
    fontSize: "0.75rem",
    color: "#2a4a5e",
    letterSpacing: "0.1em",
    pointerEvents: "none",
  },
  loader: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    pointerEvents: "none",
  },
  loaderDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#7ec8e3",
    animation: "pulse 1.2s ease infinite",
    display: "inline-block",
  },
  panel: {
    width: "100%",
    maxWidth: "600px",
    padding: "0 1.5rem 3rem",
    zIndex: 1,
    animation: "fadeUp 0.9s 0.2s ease both",
    animationFillMode: "both",
  },
  inputRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "12px",
  },
  input: {
    flex: 1,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(126,200,227,0.2)",
    borderRadius: "8px",
    padding: "12px 16px",
    color: "#e0eaf4",
    fontSize: "0.88rem",
    fontFamily: "'Space Mono', monospace",
    outline: "none",
    transition: "border-color 0.2s",
  },
  btn: {
    background: "#7ec8e3",
    color: "#080e17",
    border: "none",
    borderRadius: "8px",
    padding: "12px 20px",
    fontFamily: "'Space Mono', monospace",
    fontSize: "0.82rem",
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontWeight: 700,
    transition: "opacity 0.15s",
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  error: {
    fontSize: "0.78rem",
    color: "#f4a7b9",
    marginBottom: "12px",
    fontFamily: "'Space Mono', monospace",
  },
  samples: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  chip: {
    background: "transparent",
    border: "1px solid rgba(126,200,227,0.18)",
    borderRadius: "999px",
    padding: "5px 14px",
    color: "#4a7a94",
    fontSize: "0.75rem",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s",
  },
};

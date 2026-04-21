const { useState, useEffect, useRef } = React;

const STEPS = [
  {
    num: "3",
    label: "Pensamiento",
    time: "Mañana",
    color: "#6366F1",
    bg: "#EEF2FF",
    border: "#C7D2FE",
    icon: "✦",
    duration: 180,
    instruction: "Escribe tu intención UNA vez. Con plena atención. Sin repetir mecánicamente.",
    placeholder: "Estoy construyendo una vida en la que…",
    tip: "Una sola frase clara vale más que cien repeticiones vacías.",
  },
  {
    num: "6",
    label: "Sentimiento",
    time: "Tarde",
    color: "#EC4899",
    bg: "#FDF2F8",
    border: "#FBCFE8",
    icon: "❋",
    duration: 60,
    instruction: "Cierra los ojos. No visualices lo que deseas — SIÉNTELO como si ya fuera real.",
    placeholder: null,
    tip: "¿Tranquilo? ¿Seguro? ¿Libre? Mantén esa sensación. Respira.",
  },
  {
    num: "9",
    label: "Acción",
    time: "Noche",
    color: "#10B981",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    icon: "◆",
    duration: 120,
    instruction: "¿Qué hiciste hoy que haría tu yo del futuro?",
    placeholder: "Hoy di un paso alineado cuando…",
    tip: "Una acción pequeña anclada en la realidad vale más que mil intenciones.",
  },
];

const today = () => new Date().toISOString().split("T")[0];

const loadData = () => {
  try {
    return JSON.parse(localStorage.getItem("m369") || "{}");
  } catch {
    return {};
  }
};

const saveData = (data) => {
  try {
    localStorage.setItem("m369", JSON.stringify(data));
  } catch {}
};

function Timer({ duration, onComplete, color }) {
  const [left, setLeft] = useState(duration);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (running && left > 0) {
      ref.current = setInterval(() => setLeft((l) => l - 1), 1000);
    } else if (left === 0) {
      clearInterval(ref.current);
      setRunning(false);
      onComplete?.();
    }
    return () => clearInterval(ref.current);
  }, [running, left]);

  const pct = ((duration - left) / duration) * 100;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div style={{ textAlign: "center", margin: "16px 0" }}>
      <svg width="96" height="96" viewBox="0 0 96 96" style={{ display: "block", margin: "0 auto 10px" }}>
        <circle cx="48" cy="48" r="42" fill="none" stroke="#E5E7EB" strokeWidth="6" />
        <circle
          cx="48" cy="48" r="42" fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={`${2 * Math.PI * 42}`}
          strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
        <text x="48" y="54" textAnchor="middle" fontSize="18" fontWeight="700" fill="#111827" fontFamily="'DM Mono', monospace">
          {mm}:{ss}
        </text>
      </svg>
      <button
        onClick={() => {
          if (left === 0) { setLeft(duration); setRunning(false); }
          else setRunning((r) => !r);
        }}
        style={{
          background: running ? "#F3F4F6" : color,
          color: running ? "#374151" : "#fff",
          border: "none", borderRadius: "999px",
          padding: "8px 28px", fontFamily: "'DM Sans', sans-serif",
          fontWeight: 600, fontSize: 14, cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        {left === 0 ? "Reiniciar" : running ? "Pausar" : "Iniciar"}
      </button>
    </div>
  );
}

function StepCard({ step, dayData, onSave, active, onActivate }) {
  const [text, setText] = useState(dayData?.text || "");
  const [done, setDone] = useState(dayData?.done || false);
  const [timerDone, setTimerDone] = useState(false);

  const canComplete = step.placeholder ? text.trim().length > 10 : timerDone;

  const handleSave = () => {
    if (!canComplete) return;
    setDone(true);
    onSave({ text, done: true });
  };

  return (
    <div
      onClick={() => !done && onActivate()}
      style={{
        borderRadius: 20,
        border: `2px solid ${done ? step.color : active ? step.border : "#E5E7EB"}`,
        background: done ? step.bg : "#FAFAFA",
        padding: "20px 24px",
        marginBottom: 16,
        cursor: done ? "default" : "pointer",
        transition: "all 0.3s ease",
        boxShadow: active ? `0 4px 24px ${step.color}22` : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <span style={{
        position: "absolute", right: 16, top: -8,
        fontSize: 80, fontFamily: "'DM Serif Display', serif",
        color: step.color, opacity: 0.08, fontWeight: 900, lineHeight: 1,
        userSelect: "none",
      }}>
        {step.num}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{
          background: step.color, color: "#fff",
          borderRadius: "50%", width: 32, height: 32,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, flexShrink: 0,
        }}>
          {done ? "✓" : step.icon}
        </span>
        <div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#111827", fontWeight: 700 }}>
            {step.label}
          </div>
          <div style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "'DM Sans', sans-serif" }}>
            {step.time} · {Math.floor(step.duration / 60)}m {step.duration % 60 > 0 ? `${step.duration % 60}s` : ""}
          </div>
        </div>
        {done && (
          <span style={{
            marginLeft: "auto", background: step.color, color: "#fff",
            borderRadius: 999, padding: "3px 12px", fontSize: 12,
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
          }}>
            Completado
          </span>
        )}
      </div>

      {active && !done && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <p style={{ fontSize: 14, color: "#374151", fontFamily: "'DM Sans', sans-serif", marginBottom: 12, lineHeight: 1.6 }}>
            {step.instruction}
          </p>

          <Timer duration={step.duration} color={step.color} onComplete={() => setTimerDone(true)} />

          {step.placeholder && (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={step.placeholder}
              onClick={(e) => e.stopPropagation()}
              rows={3}
              style={{
                width: "100%", border: `1.5px solid ${step.border}`,
                borderRadius: 12, padding: "10px 14px",
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: "#111827", background: "#fff", resize: "none",
                outline: "none", boxSizing: "border-box", marginBottom: 10,
              }}
            />
          )}

          <p style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "'DM Sans', sans-serif", marginBottom: 12, fontStyle: "italic" }}>
            {step.tip}
          </p>

          <button
            onClick={(e) => { e.stopPropagation(); handleSave(); }}
            disabled={!canComplete}
            style={{
              background: canComplete ? step.color : "#E5E7EB",
              color: canComplete ? "#fff" : "#9CA3AF",
              border: "none", borderRadius: 999, padding: "10px 24px",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
              fontSize: 14, cursor: canComplete ? "pointer" : "not-allowed",
              width: "100%", transition: "all 0.2s",
            }}
          >
            Marcar como completado →
          </button>
        </div>
      )}

      {done && dayData?.text && (
        <p style={{
          fontSize: 13, color: "#6B7280", fontFamily: "'DM Sans', sans-serif",
          fontStyle: "italic", marginTop: 8, borderLeft: `3px solid ${step.color}`,
          paddingLeft: 10, lineHeight: 1.5,
        }}>
          "{dayData.text}"
        </p>
      )}
    </div>
  );
}

function StreakBar({ data }) {
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().split("T")[0];
    const entry = data[key];
    const completed = entry ? STEPS.filter((_, idx) => entry[idx]?.done).length : 0;
    return { key, completed };
  });

  const streak = (() => {
    let s = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].completed === 3) s++;
      else break;
    }
    return s;
  })();

  return (
    <div style={{ background: "#FAFAFA", borderRadius: 16, padding: "16px 20px", marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: "#111827" }}>
          Racha
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 700, color: streak > 0 ? "#F59E0B" : "#9CA3AF" }}>
          {streak} {streak === 1 ? "día" : "días"} 🔥
        </span>
      </div>
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        {days.map((d) => (
          <div
            key={d.key}
            title={d.key}
            style={{
              width: 18, height: 18, borderRadius: 4,
              background: d.completed === 3 ? "#10B981" : d.completed === 2 ? "#6366F1" : d.completed === 1 ? "#EC4899" : "#E5E7EB",
              transition: "transform 0.2s",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
        {[["#10B981", "Completo"], ["#6366F1", "2/3"], ["#EC4899", "1/3"], ["#E5E7EB", "Vacío"]].map(([c, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
            <span style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'DM Sans', sans-serif" }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryView({ data, onBack }) {
  const entries = Object.entries(data)
    .filter(([, v]) => Object.values(v).some((s) => s?.done))
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 20);

  return (
    <div>
      <button onClick={onBack} style={{
        background: "none", border: "none", cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif", color: "#6366F1",
        fontSize: 14, fontWeight: 600, marginBottom: 16, padding: 0,
      }}>
        ← Volver
      </button>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, marginBottom: 20, color: "#111827" }}>
        Historial
      </h2>
      {entries.length === 0 && (
        <p style={{ color: "#9CA3AF", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
          Aún no hay entradas registradas.
        </p>
      )}
      {entries.map(([date, dayData]) => {
        const d = new Date(date + "T12:00:00");
        const label = d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
        const completed = STEPS.filter((_, i) => dayData[i]?.done).length;
        return (
          <div key={date} style={{
            borderRadius: 16, border: "1.5px solid #E5E7EB",
            padding: "16px 20px", marginBottom: 12, background: "#FAFAFA",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#111827", fontSize: 14, textTransform: "capitalize" }}>
                {label}
              </span>
              <span style={{
                fontSize: 12, fontFamily: "'DM Mono', monospace",
                color: completed === 3 ? "#10B981" : "#9CA3AF",
                background: completed === 3 ? "#ECFDF5" : "#F3F4F6",
                padding: "2px 10px", borderRadius: 999,
              }}>
                {completed}/3
              </span>
            </div>
            {STEPS.map((step, i) => dayData[i]?.done && (
              <div key={i} style={{ marginBottom: 6, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{
                  flexShrink: 0, width: 20, height: 20, borderRadius: "50%",
                  background: step.color, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700,
                }}>
                  {step.num}
                </span>
                <span style={{ fontSize: 13, color: "#6B7280", fontFamily: "'DM Sans', sans-serif", fontStyle: dayData[i]?.text ? "italic" : "normal" }}>
                  {dayData[i]?.text || `${step.label} completado`}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function App() {
  const [allData, setAllData] = useState(loadData);
  const [activeStep, setActiveStep] = useState(null);
  const [view, setView] = useState("home");

  const todayKey = today();
  const todayData = allData[todayKey] || {};
  const completedToday = STEPS.filter((_, i) => todayData[i]?.done).length;

  const handleSave = (stepIdx, stepData) => {
    const updated = {
      ...allData,
      [todayKey]: { ...todayData, [stepIdx]: stepData },
    };
    setAllData(updated);
    saveData(updated);
    setActiveStep(null);
  };

  if (view === "history") return (
    <Shell>
      <HistoryView data={allData} onBack={() => setView("home")} />
    </Shell>
  );

  if (view === "guide") return (
    <Shell>
      <button onClick={() => setView("home")} style={{
        background: "none", border: "none", cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif", color: "#6366F1",
        fontSize: 14, fontWeight: 600, marginBottom: 16, padding: 0,
      }}>← Volver</button>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, marginBottom: 8, color: "#111827" }}>
        Qué es el Método 369
      </h2>
      <p style={{ fontSize: 14, color: "#6B7280", fontFamily: "'DM Sans', sans-serif", marginBottom: 20, lineHeight: 1.7 }}>
        Tesla hablaba de patrones de frecuencia, no de escribir frases. El método real alinea los tres planos de la experiencia humana:
      </p>
      {STEPS.map((s) => (
        <div key={s.num} style={{
          borderRadius: 16, border: `1.5px solid ${s.border}`,
          background: s.bg, padding: "16px 20px", marginBottom: 14,
        }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
            <span style={{
              background: s.color, color: "#fff", borderRadius: "50%",
              width: 36, height: 36, display: "flex", alignItems: "center",
              justifyContent: "center", fontFamily: "'DM Serif Display', serif",
              fontSize: 20, fontWeight: 700, flexShrink: 0,
            }}>{s.num}</span>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: "#111827" }}>{s.label}</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "'DM Sans', sans-serif" }}>{s.time} · {Math.floor(s.duration / 60)}m</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#374151", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, margin: 0 }}>
            {s.instruction}
          </p>
          <p style={{ fontSize: 12, color: s.color, fontFamily: "'DM Sans', sans-serif", marginTop: 8, fontWeight: 600, margin: "8px 0 0" }}>
            💡 {s.tip}
          </p>
        </div>
      ))}
      <div style={{
        borderRadius: 16, background: "#111827", padding: "16px 20px", marginTop: 8,
      }}>
        <p style={{ color: "#F9FAFB", fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
          <strong style={{ color: "#10B981" }}>Resultado clave:</strong> Las personas que hicieron los 3 pasos mostraron cambios medibles — nuevos trabajos, ingresos inesperados, relaciones transformadas. <strong style={{ color: "#fff" }}>La acción fue el multiplicador en todos los casos.</strong>
        </p>
      </div>
    </Shell>
  );

  return (
    <Shell>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{
              fontFamily: "'DM Serif Display', serif", fontSize: 30,
              color: "#111827", margin: 0, lineHeight: 1.1,
            }}>
              Método<br /><span style={{ color: "#6366F1" }}>369</span>
            </h1>
            <p style={{ fontSize: 13, color: "#9CA3AF", fontFamily: "'DM Sans', sans-serif", margin: "6px 0 0" }}>
              {new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 32, fontWeight: 700,
              color: completedToday === 3 ? "#10B981" : "#111827",
            }}>
              {completedToday}/3
            </div>
            <div style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "'DM Sans', sans-serif" }}>
              hoy
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, background: "#E5E7EB", borderRadius: 999, height: 6, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 999,
            background: "linear-gradient(90deg, #6366F1, #EC4899, #10B981)",
            width: `${(completedToday / 3) * 100}%`,
            transition: "width 0.5s ease",
          }} />
        </div>
      </div>

      <StreakBar data={allData} />

      {completedToday === 3 && (
        <div style={{
          background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)",
          border: "1.5px solid #A7F3D0", borderRadius: 16,
          padding: "16px 20px", marginBottom: 16, textAlign: "center",
        }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🌟</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#065F46", marginBottom: 4 }}>
            ¡Día completo!
          </div>
          <div style={{ fontSize: 13, color: "#059669", fontFamily: "'DM Sans', sans-serif" }}>
            Pensamiento + Sentimiento + Acción. Los tres planos alineados.
          </div>
        </div>
      )}

      {STEPS.map((step, i) => (
        <StepCard
          key={i}
          step={step}
          dayData={todayData[i]}
          active={activeStep === i}
          onActivate={() => setActiveStep(activeStep === i ? null : i)}
          onSave={(data) => handleSave(i, data)}
        />
      ))}

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={() => setView("guide")} style={{
          flex: 1, background: "#F3F4F6", border: "none", borderRadius: 12,
          padding: "12px 0", fontFamily: "'DM Sans', sans-serif",
          fontWeight: 600, fontSize: 13, color: "#374151", cursor: "pointer",
        }}>
          📖 Guía
        </button>
        <button onClick={() => setView("history")} style={{
          flex: 1, background: "#F3F4F6", border: "none", borderRadius: 12,
          padding: "12px 0", fontFamily: "'DM Sans', sans-serif",
          fontWeight: 600, fontSize: 13, color: "#374151", cursor: "pointer",
        }}>
          📅 Historial
        </button>
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } body { background: #F9FAFB; } @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div style={{
        maxWidth: 440, margin: "0 auto", padding: "28px 16px 48px",
        minHeight: "100vh", fontFamily: "'DM Sans', sans-serif",
      }}>
        {children}
      </div>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

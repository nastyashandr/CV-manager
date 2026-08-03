import { useEffect, useRef, useState } from "react";

const OPTIONS = [
  { value: "High", color: "#e74c3c" },
  { value: "Average", color: "#f0a020" },
  { value: "Low", color: "#2ecc71" },
];

export default function PrioritySelect({ value, onChange, t }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = OPTIONS.find((o) => o.value === value) || OPTIONS[0];

  const select = (option) => {
    onChange(option.value);
    setOpen(false);
  };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.375rem 0.75rem",
          border: "1px solid var(--bs-border-color, #ced4da)",
          borderRadius: "0.375rem",
          background: "var(--bs-body-bg, #fff)",
          color: "inherit",
          cursor: "pointer",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: current.color,
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          {t(`supportTicketPriority${current.value}`)}
        </span>
        <span style={{ opacity: 0.6 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 1060,
            background: "var(--bs-body-bg, #fff)",
            border: "1px solid var(--bs-border-color, #ced4da)",
            borderRadius: "0.375rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            overflow: "hidden",
          }}
        >
          {OPTIONS.map((option) => (
            <div
              key={option.value}
              onClick={() => select(option)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "0.5rem 0.75rem",
                cursor: "pointer",
                background:
                  option.value === value
                    ? "rgba(108, 92, 231, 0.1)"
                    : "transparent",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(108, 92, 231, 0.15)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background =
                  option.value === value
                    ? "rgba(108, 92, 231, 0.1)"
                    : "transparent")
              }
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: option.color,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              {t(`supportTicketPriority${option.value}`)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

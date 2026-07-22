import React, { useState } from "react";

function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "Select...",
  className = "",
  wrapperClassName = "",
  disabled = false,
  style = {},
  size = "default",
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || placeholder;

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const getSizes = () => {
    if (size === "small") {
      return {
        height: "31px",
        minHeight: "31px",
        padding: "2px 8px",
        fontSize: "13px",
        optionPadding: "6px 12px",
        optionFontSize: "13px",
      };
    }
    return {
      height: "38px",
      minHeight: "38px",
      padding: "6px 12px",
      fontSize: "14px",
      optionPadding: "8px 16px",
      optionFontSize: "14px",
    };
  };

  const sizes = getSizes();

  return (
    <div className={`custom-select-wrapper ${wrapperClassName}`}>
      <div
        className={`custom-select ${isOpen ? "open" : ""} ${className}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          height: sizes.height,
          minHeight: sizes.minHeight,
          padding: sizes.padding,
          fontSize: sizes.fontSize,
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "4px",
          backgroundColor: "var(--bg-input, #ffffff)",
          border: "1px solid var(--border-color, #ced4da)",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          color: "var(--text-primary, #212529)",
          userSelect: "none",
          ...style,
        }}
      >
        <span
          className="custom-select-value"
          style={{
            flex: 1,
            fontSize: sizes.fontSize,
            color: "var(--text-primary, #212529)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {selectedLabel}
        </span>
        <span
          className="custom-select-arrow"
          style={{
            fontSize: "8px",
            color: "var(--text-secondary, #6c757d)",
            transition: "transform 0.2s ease",
            flexShrink: 0,
            transform: isOpen ? "rotate(180deg)" : "none",
          }}
        >
          ▼
        </span>
      </div>
      {isOpen && !disabled && (
        <div
          className="custom-select-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 2px)",
            left: 0,
            right: 0,
            backgroundColor: "var(--bg-dropdown, #ffffff)",
            border: "1px solid var(--border-color, #ced4da)",
            borderRadius: "4px",
            boxShadow: "0 4px 12px var(--shadow-color, rgba(0, 0, 0, 0.15))",
            overflow: "hidden",
            zIndex: 1000,
            padding: "4px 0",
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`custom-select-option ${value === opt.value ? "selected" : ""}`}
              onClick={() => handleSelect(opt.value)}
              style={{
                padding: sizes.optionPadding,
                cursor: "pointer",
                fontSize: sizes.optionFontSize,
                color: "var(--text-primary, #212529)",
                transition: "background-color 0.15s ease, color 0.15s ease",
                backgroundColor:
                  value === opt.value
                    ? "var(--bg-option-hover, #0d6efd)"
                    : "transparent",
                color:
                  value === opt.value
                    ? "#ffffff"
                    : "var(--text-primary, #212529)",
              }}
              onMouseEnter={(e) => {
                if (value !== opt.value) {
                  e.target.style.backgroundColor =
                    "var(--bg-option-hover, #0d6efd)";
                  e.target.style.color = "#ffffff";
                }
              }}
              onMouseLeave={(e) => {
                if (value !== opt.value) {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "var(--text-primary, #212529)";
                }
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;

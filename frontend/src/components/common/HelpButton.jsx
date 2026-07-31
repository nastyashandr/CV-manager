import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import SupportTicketModal from "./SupportTicketModal.jsx";

export default function HelpButton() {
  const [show, setShow] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setShow(true)}
        title={t("createSupportTicket")}
        style={{
          position: "fixed",
          right: "20px",
          bottom: "20px",
          zIndex: 1040,
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          border: "none",
          background: "#6c5ce7",
          color: "#fff",
          fontSize: "1.4rem",
          fontWeight: "bold",
          boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
          cursor: "pointer",
        }}
      >
        ?
      </button>
      <SupportTicketModal show={show} onHide={() => setShow(false)} />
    </>
  );
}

import ButtonToolbar from "react-bootstrap/ButtonToolbar";

export default function Toolbar({ children, className = "" }) {
  return (
    <ButtonToolbar
      className={`mb-3 gap-2 flex-wrap align-items-center ${className}`}
    >
      {children}
    </ButtonToolbar>
  );
}

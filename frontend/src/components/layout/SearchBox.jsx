import { useState, useRef, useEffect } from "react";
import Form from "react-bootstrap/Form";
import { useNavigate, useLocation } from "react-router-dom";

export default function SearchBox({ t }) {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const debounceTimer = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q) {
      setTerm(q);
    }
  }, [location.search]);

  const handleSearch = (value) => {
    setTerm(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      const trimmed = value.trim();
      if (trimmed) {
        navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      } else if (location.pathname === "/search") {
        navigate("/");
      }
    }, 400);
  };

  const submit = (e) => {
    e.preventDefault();
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    const trimmed = term.trim();
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <Form className="header-search-wrapper" onSubmit={submit}>
      <Form.Control
        type="search"
        className="header-search"
        placeholder={t("search")}
        value={term}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </Form>
  );
}

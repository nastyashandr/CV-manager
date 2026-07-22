import { useEffect, useState } from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import CustomSelect from "../common/CustomSelect.jsx";
import SearchBox from "./SearchBox.jsx";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ru", label: "Русский" },
];

function useCloseOnDesktop(menuOpen, setMenuOpen) {
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 992 && menuOpen) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [menuOpen, setMenuOpen]);
}

function NavLinks({ t, user, onNavigate }) {
  return (
    <Nav className="header-nav me-auto">
      <Nav.Link as={Link} to="/" className="header-link" onClick={onNavigate}>
        {t("home")}
      </Nav.Link>
      <Nav.Link
        as={Link}
        to="/positions"
        className="header-link"
        onClick={onNavigate}
      >
        {t("positions")}
      </Nav.Link>
      {user && (
        <Nav.Link
          as={Link}
          to={`/profile/${user.id}`}
          className="header-link"
          onClick={onNavigate}
        >
          {t("profile")}
        </Nav.Link>
      )}
      {user && (user.role === "recruiter" || user.role === "admin") && (
        <Nav.Link
          as={Link}
          to="/attributes"
          className="header-link"
          onClick={onNavigate}
        >
          {t("attributeLibrary")}
        </Nav.Link>
      )}
      {user?.role === "admin" && (
        <Nav.Link
          as={Link}
          to="/admin/users"
          className="header-link"
          onClick={onNavigate}
        >
          {t("admin")}
        </Nav.Link>
      )}
    </Nav>
  );
}

function AuthActions({ user, t, className, onAction }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  if (user) {
    return (
      <button
        type="button"
        className={`btn btn-outline-secondary ${className}`}
        onClick={() => {
          logout();
          navigate("/");
          onAction?.();
        }}
      >
        {t("logout")}
      </button>
    );
  }
  return (
    <>
      <button
        type="button"
        className={`btn btn-outline-primary ${className}`}
        onClick={() => {
          navigate("/login");
          onAction?.();
        }}
      >
        {t("login")}
      </button>
      <button
        type="button"
        className={`btn btn-primary ${className}`}
        onClick={() => {
          navigate("/register");
          onAction?.();
        }}
      >
        {t("register")}
      </button>
    </>
  );
}

export default function Header() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { locale, changeLocale, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  useCloseOnDesktop(menuOpen, setMenuOpen);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);
  const closeMenu = () => setMenuOpen(false);

  return (
    <Navbar className="header-navbar border-bottom" sticky="top">
      <Container className="header-container">
        <Navbar.Brand
          as={Link}
          to="/"
          className="header-brand"
          onClick={closeMenu}
        >
          {t("appName")}
        </Navbar.Brand>
        <NavLinks t={t} user={user} onNavigate={closeMenu} />
        <div className="d-flex align-items-center gap-2">
          <SearchBox t={t} />
          <div className="header-desktop-actions">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={toggleTheme}
            >
              {theme === "light" ? t("themeDark") : t("themeLight")}
            </button>
            <CustomSelect
              value={locale}
              options={LANGUAGES.map((l) => ({
                value: l.value,
                label: l.value.toUpperCase(),
              }))}
              onChange={changeLocale}
              wrapperClassName="header-lang-wrapper"
              selectClassName="header-lang-select"
            />
            <AuthActions user={user} t={t} className="" />
          </div>
          <button
            type="button"
            className="header-toggler"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M2 2L18 18M18 2L2 18"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                <path
                  d="M0 1H20M0 8H20M0 15H20"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
      </Container>

      {menuOpen && (
        <div className="header-overlay">
          <div className="header-overlay-content">
            <button
              type="button"
              className="btn btn-outline-secondary mobile-btn"
              onClick={toggleTheme}
            >
              {theme === "light" ? t("themeDark") : t("themeLight")}
            </button>
            <div className="w-100 d-flex justify-content-center">
              <CustomSelect
                value={locale}
                options={LANGUAGES.map((l) => ({
                  value: l.value,
                  label: l.label,
                }))}
                onChange={changeLocale}
                wrapperClassName="header-lang-wrapper"
                selectClassName="header-lang-select text-center"
                style={{ textAlign: "center" }}
              />
            </div>
            <AuthActions
              user={user}
              t={t}
              className="mobile-btn"
              onAction={closeMenu}
            />
          </div>
        </div>
      )}
    </Navbar>
  );
}

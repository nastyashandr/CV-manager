import { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useErrorHandler } from "../utils/errorHandler.js";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const { translateError } = useErrorHandler();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form);
      toast.success(t("welcomeBack"));
      navigate("/");
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto" style={{ maxWidth: 420 }}>
      <Card.Body>
        <Card.Title className="mb-3" style={{ textAlign: "center" }}>
          {t("login")}
        </Card.Title>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={submit}>
          <Form.Group className="mb-3">
            <Form.Label>{t("email")}</Form.Label>
            <Form.Control
              type="email"
              required
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label>{t("password")}</Form.Label>
            <Form.Control
              type="password"
              required
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
            />
          </Form.Group>
          <Button type="submit" className="w-100" disabled={loading}>
            {loading ? t("loggingIn") : t("login")}
          </Button>
        </Form>
        <p className="text-center mt-3 mb-0">
          {t("noAccount")} <Link to="/register">{t("register")}</Link>
        </p>
      </Card.Body>
    </Card>
  );
}

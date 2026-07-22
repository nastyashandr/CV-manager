import { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useErrorHandler } from "../utils/errorHandler.js";
import CustomSelect from "../components/common/CustomSelect.jsx";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "candidate",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useLanguage();
  const { translateError } = useErrorHandler();
  const navigate = useNavigate();

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const roleOptions = [
    { value: "candidate", label: t("candidate") },
    { value: "recruiter", label: t("recruiter") },
  ];

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(form);
      toast.success(t("registrationSuccess"));
      navigate("/");
    } catch (err) {
      const message = translateError(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto" style={{ maxWidth: 480 }}>
      <Card.Body>
        <Card.Title className="mb-3">{t("register")}</Card.Title>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={submit}>
          <Row>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>{t("firstName")}</Form.Label>
                <Form.Control
                  required
                  value={form.firstName}
                  onChange={set("firstName")}
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>{t("lastName")}</Form.Label>
                <Form.Control
                  required
                  value={form.lastName}
                  onChange={set("lastName")}
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>{t("email")}</Form.Label>
            <Form.Control
              type="email"
              required
              value={form.email}
              onChange={set("email")}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>{t("role")}</Form.Label>
            <CustomSelect
              value={form.role}
              options={roleOptions}
              onChange={(role) => setForm((f) => ({ ...f, role }))}
            />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label>{t("password")}</Form.Label>
            <Form.Control
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={set("password")}
            />
          </Form.Group>
          <Button type="submit" className="w-100" disabled={loading}>
            {loading ? t("registering") : t("register")}
          </Button>
        </Form>
        <p className="text-center mt-3 mb-0">
          {t("haveAccount")} <Link to="/login">{t("login")}</Link>
        </p>
      </Card.Body>
    </Card>
  );
}

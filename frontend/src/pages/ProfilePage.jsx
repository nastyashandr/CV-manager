import { useCallback, useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import { toast } from "react-toastify";
import {
  UsersApi,
  CvsApi,
  AttributesApi,
  PositionsApi,
} from "../api/resources.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useErrorHandler } from "../utils/errorHandler.js";
import { useAutoSave } from "../hooks/useAutoSave.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import Toolbar from "../components/common/Toolbar.jsx";
import DataTable from "../components/common/DataTable.jsx";
import AttributePicker from "../components/forms/AttributePicker.jsx";
import AttributeValueInput from "../components/common/AttributeValueInput.jsx";
import AttributeValueDisplay from "../components/common/AttributeValueDisplay.jsx";
import ImageDropzone from "../components/common/ImageDropzone.jsx";
import ProjectForm from "../components/forms/ProjectForm.jsx";
import MarkdownView from "../components/common/MarkdownView.jsx";
import { DateFormatter } from "../utils/formatters.js";

function toProfileForm(user) {
  return {
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    location: user.location || "",
    photoUrl: user.photoUrl || "",
  };
}

function MeTab({ user, editable, onUpdated }) {
  const [form, setForm] = useState(toProfileForm(user));
  const { t } = useLanguage();
  const { translateError } = useErrorHandler();

  useEffect(() => {
    setForm(toProfileForm(user));
  }, [user]);

  const saveProfile = useCallback(
    async (data) => {
      try {
        const updated = await UsersApi.update(user.id, data);
        onUpdated(updated);
      } catch (err) {
        if (err.response?.status === 409) {
          toast.warning(t("versionConflict"));
          const fresh = await UsersApi.get(user.id);
          onUpdated(fresh.user);
          return;
        }
        toast.error(translateError(err));
        throw err;
      }
    },
    [user.id, onUpdated, t, translateError],
  );

  const { triggerSave } = useAutoSave({
    value: form,
    onSave: saveProfile,
    delay: 1000,
    showToast: true,
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    triggerSave();
  };

  if (!editable) {
    return (
      <div>
        {user.photoUrl && (
          <img
            src={user.photoUrl}
            alt=""
            className="attribute-image-preview mb-3"
          />
        )}
        <p>
          <strong>
            {user.firstName} {user.lastName}
          </strong>
        </p>
        <p className="text-muted">{user.location}</p>
      </div>
    );
  }

  return (
    <Row className="g-3">
      <Col md={4}>
        <ImageDropzone
          value={form.photoUrl}
          onChange={(v) => handleChange("photoUrl", v)}
        />
      </Col>
      <Col md={8}>
        <Form.Group className="mb-3">
          <Form.Label>{t("firstName")}</Form.Label>
          <Form.Control
            value={form.firstName || ""}
            onChange={(e) => handleChange("firstName", e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>{t("lastName")}</Form.Label>
          <Form.Control
            value={form.lastName || ""}
            onChange={(e) => handleChange("lastName", e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>{t("location")}</Form.Label>
          <Form.Control
            value={form.location || ""}
            onChange={(e) => handleChange("location", e.target.value)}
          />
        </Form.Group>
      </Col>
    </Row>
  );
}

function InfoValueRow({ userId, row, editable }) {
  const [value, setValue] = useState(row.value);
  const { t } = useLanguage();
  const { translateError } = useErrorHandler();

  const saveAttribute = useCallback(
    async (newValue) => {
      try {
        const updated = await UsersApi.setAttributeValue(
          userId,
          row.attributeId,
          { value: newValue },
        );
        setValue(updated.value);
      } catch (err) {
        if (err.response?.status === 409) {
          toast.warning(t("versionConflict"));
          const fresh = await UsersApi.get(userId);
          const attr = fresh.attributeValues.find(
            (a) => a.attributeId === row.attributeId,
          );
          if (attr) {
            setValue(attr.value);
            return;
          }
          return;
        }
        toast.error(translateError(err));
        throw err;
      }
    },
    [userId, row.attributeId, t, translateError],
  );

  const { triggerSave } = useAutoSave({
    value,
    onSave: saveAttribute,
    delay: 1000,
    showToast: true,
  });

  const handleChange = (newValue) => {
    setValue(newValue);
    triggerSave();
  };

  if (!editable) {
    return (
      <AttributeValueDisplay
        name={row.attribute.name}
        type={row.attribute.type}
        value={row.value}
      />
    );
  }

  return (
    <div className="mb-2 p-2 border rounded">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <Form.Label className="mb-0 fw-semibold">
          {row.attribute.name}
        </Form.Label>
      </div>
      <AttributeValueInput
        type={row.attribute.type}
        value={value}
        options={row.attribute.options}
        onChange={handleChange}
      />
    </div>
  );
}

function InfoTab({ userId, values, editable, onChanged }) {
  const [showPicker, setShowPicker] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const { t } = useLanguage();
  const { translateError } = useErrorHandler();

  const addAttribute = async (attribute) => {
    try {
      await UsersApi.addAttribute(userId, attribute.id);
      setShowPicker(false);
      await onChanged();
    } catch (error) {
      toast.error(translateError(error));
    }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    try {
      for (const id of selected) {
        await UsersApi.removeAttribute(userId, id);
      }
      setSelected(new Set());
      toast.success(t("attributeDeleted"));
      await onChanged();
    } catch (error) {
      toast.error(translateError(error));
    }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  if (!editable) {
    return (
      <div>
        {values.map((row) => (
          <InfoValueRow
            key={row.id}
            userId={userId}
            row={row}
            editable={false}
          />
        ))}
        {!values.length && <p className="text-muted">{t("noData")}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 d-flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="primary"
          onClick={() => setShowPicker((s) => !s)}
        >
          {showPicker ? t("close") : t("addAttribute")}
        </Button>
        <Button
          size="sm"
          variant="outline-danger"
          disabled={selected.size === 0}
          onClick={deleteSelected}
        >
          {t("deleteSelected")}
        </Button>
      </div>

      {showPicker && (
        <div className="mt-2">
          <AttributePicker
            excludeIds={values.map((v) => v.attributeId)}
            onPick={addAttribute}
          />
        </div>
      )}

      {values.map((row) => (
        <div key={row.id} className="d-flex align-items-center gap-2 mb-2">
          <Form.Check
            type="checkbox"
            checked={selected.has(row.attributeId)}
            onChange={() => toggleSelect(row.attributeId)}
            style={{ width: "32px", flexShrink: 0 }}
          />
          <div className="flex-grow-1">
            <InfoValueRow userId={userId} row={row} editable />
          </div>
        </div>
      ))}
      {!values.length && <p className="text-muted">{t("noData")}</p>}
    </div>
  );
}

function ProjectsTabReadOnly({ projects, t }) {
  return (
    <div>
      {projects?.map((p) => (
        <div key={p.id} className="mb-3 pb-3 border-bottom">
          <h5>
            {p.name}{" "}
            <span className="text-muted small">
              {DateFormatter.period(p.periodStart, p.periodEnd)}
            </span>
          </h5>
          <div>
            {(p.tags || []).map((tag) => (
              <Badge key={tag} bg="secondary" className="me-1">
                {tag}
              </Badge>
            ))}
          </div>
          <MarkdownView content={p.description} />
        </div>
      ))}
      {!projects?.length && <p className="text-muted">{t("noData")}</p>}
    </div>
  );
}

function ProjectsTab({ userId, editable }) {
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [projects, setProjects] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const { t } = useLanguage();
  const { translateError } = useErrorHandler();

  const load = useCallback(async () => {
    if (loaded) return;
    try {
      setLoading(true);
      const data = await UsersApi.projects(userId);
      setProjects(data);
      setLoaded(true);
    } catch (error) {
      toast.error(translateError(error));
    } finally {
      setLoading(false);
    }
  }, [userId, translateError, loaded]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (data) => {
    try {
      if (modal?.project) {
        await UsersApi.updateProject(userId, modal.project.id, {
          ...data,
          version: modal.project.version,
        });
        toast.success(t("projectUpdated"));
      } else {
        await UsersApi.createProject(userId, data);
        toast.success(t("projectCreated"));
      }
      setModal(null);
      setLoaded(false);
      await load();
    } catch (error) {
      toast.error(translateError(error));
      throw error;
    }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    try {
      for (const id of selected) {
        await UsersApi.deleteProject(userId, id);
      }
      setSelected(new Set());
      toast.success(t("projectsDeleted"));
      setLoaded(false);
      await load();
    } catch (error) {
      toast.error(translateError(error));
    }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  if (loading && !projects) return <LoadingSpinner />;
  if (!editable) return <ProjectsTabReadOnly projects={projects} t={t} />;

  const columns = [
    { key: "name", header: t("name"), sortable: true },
    {
      key: "period",
      header: t("period"),
      render: (p) => DateFormatter.period(p.periodStart, p.periodEnd),
    },
    {
      key: "tags",
      header: t("tags"),
      render: (p) => (p.tags || []).join(", "),
    },
  ];

  return (
    <div>
      <Toolbar>
        <Button variant="primary" size="sm" onClick={() => setModal({})}>
          {t("add")}
        </Button>
        <Button
          variant="outline-danger"
          size="sm"
          disabled={selected.size === 0}
          onClick={deleteSelected}
        >
          {t("deleteSelected")}
        </Button>
      </Toolbar>
      {projects && (
        <DataTable
          columns={columns}
          data={projects}
          onRowClick={(p) => setModal({ project: p })}
          selectable
          selectedIds={selected}
          onSelectionChange={setSelected}
          keyField="id"
          emptyMessage={t("noData")}
        />
      )}
      {modal && (
        <ProjectForm
          show
          onHide={() => setModal(null)}
          onSubmit={save}
          initial={modal.project}
        />
      )}
    </div>
  );
}

function CvsTab({ userId }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [cvs, setCvs] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    CvsApi.mine().then((data) => {
      setCvs(data);
      setLoaded(true);
    });
  }, [loaded]);

  if (!cvs) return <LoadingSpinner />;

  const columns = [
    {
      key: "position",
      header: t("position"),
      render: (r) => r.position?.title || "Position",
    },
    { key: "status", header: t("status") },
  ];

  return (
    <DataTable
      columns={columns}
      data={cvs}
      onRowClick={(r) => navigate(`/cvs/${r.id}`)}
      emptyMessage={t("noData")}
    />
  );
}

function PositionsTab({ userId }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const { translateError } = useErrorHandler();
  const [positions, setPositions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await PositionsApi.list();
        const filtered = data.filter((p) => p.createdById === userId);
        setPositions(filtered);
        setLoaded(true);
      } catch (error) {
        toast.error(translateError(error));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId, translateError, loaded]);

  const canCreate = currentUser?.role === "admin" || currentUser?.id === userId;

  if (loading) return <LoadingSpinner />;
  if (!positions?.length) {
    return (
      <div>
        <p className="text-muted">{t("noPositions")}</p>
        {canCreate && (
          <Button variant="primary" as={Link} to="/positions">
            {t("createPosition")}
          </Button>
        )}
      </div>
    );
  }

  const columns = [
    { key: "title", header: t("title"), sortable: true },
    {
      key: "isPublic",
      header: t("public"),
      render: (r) => (r.isPublic ? "✓" : "—"),
    },
    {
      key: "createdAt",
      header: t("created"),
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <div className="d-flex gap-2 mb-3">
        {canCreate && (
          <Button variant="primary" as={Link} to="/positions">
            {t("createPosition")}
          </Button>
        )}
        <Button variant="outline-secondary" as={Link} to="/positions">
          {t("viewAll")}
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={positions}
        onRowClick={(r) => navigate(`/positions/${r.id}`)}
        emptyMessage={t("noData")}
      />
    </div>
  );
}

function AttributesTab({ userId }) {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const { translateError } = useErrorHandler();
  const [attributes, setAttributes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await AttributesApi.my();
        setAttributes(data);
        setLoaded(true);
      } catch (error) {
        toast.error(translateError(error));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [translateError, loaded]);

  const canCreate = currentUser?.role === "admin" || currentUser?.id === userId;

  if (loading) return <LoadingSpinner />;
  if (!attributes?.length) {
    return (
      <div>
        <p className="text-muted">{t("noAttributes")}</p>
        {canCreate && (
          <Button variant="primary" as={Link} to="/attributes">
            {t("createAttribute")}
          </Button>
        )}
      </div>
    );
  }

  const columns = [
    { key: "name", header: t("name"), sortable: true },
    { key: "category", header: t("category") },
    { key: "type", header: t("type") },
  ];

  return (
    <div>
      <div className="d-flex gap-2 mb-3">
        {canCreate && (
          <Button variant="primary" as={Link} to="/attributes">
            {t("createAttribute")}
          </Button>
        )}
        <Button variant="outline-secondary" as={Link} to="/attributes">
          {t("viewAll")}
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={attributes}
        emptyMessage={t("noData")}
      />
    </div>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("me");
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const { translateError } = useErrorHandler();

  const targetId = id || currentUser?.id;

  const load = useCallback(async () => {
    if (loaded) return;
    if (!targetId) return;
    try {
      setLoading(true);
      const profile = await UsersApi.get(targetId);
      setData(profile);
      setLoaded(true);
    } catch (error) {
      toast.error(translateError(error));
    } finally {
      setLoading(false);
    }
  }, [targetId, translateError, loaded]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshData = useCallback(async () => {
    if (!targetId) return;
    try {
      const profile = await UsersApi.get(targetId);
      setData(profile);
    } catch {}
  }, [targetId]);

  const onUserUpdated = useCallback((updatedUser) => {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, user: updatedUser };
    });
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <div className="text-center py-5">{t("userNotFound")}</div>;

  const { user, isOwnerView, attributeValues } = data;
  const isOwnCvsTab = currentUser?.id === user.id;
  const isCandidate = user.role === "candidate";
  const isRecruiter = user.role === "recruiter";

  return (
    <div>
      <h1>
        {user.firstName} {user.lastName}
      </h1>
      <Tabs
        defaultActiveKey="me"
        className="mb-3"
        activeKey={activeTab}
        onSelect={setActiveTab}
      >
        <Tab eventKey="me" title={t("me")}>
          <MeTab user={user} editable={isOwnerView} onUpdated={onUserUpdated} />
        </Tab>

        {isCandidate && (
          <Tab eventKey="info" title={t("info")}>
            <InfoTab
              userId={user.id}
              values={attributeValues || []}
              editable={isOwnerView}
              onChanged={refreshData}
            />
          </Tab>
        )}

        {isCandidate && (
          <Tab eventKey="projects" title={t("projects")}>
            <ProjectsTab userId={user.id} editable={isOwnerView} />
          </Tab>
        )}

        {isCandidate && isOwnCvsTab && (
          <Tab eventKey="cvs" title={t("cvs")}>
            <CvsTab userId={user.id} />
          </Tab>
        )}

        {isRecruiter && (
          <Tab eventKey="positions" title={t("myPositions")}>
            <PositionsTab userId={user.id} />
          </Tab>
        )}

        {isRecruiter && (
          <Tab eventKey="myAttributes" title={t("myAttributes")}>
            <AttributesTab userId={user.id} />
          </Tab>
        )}
      </Tabs>
    </div>
  );
}

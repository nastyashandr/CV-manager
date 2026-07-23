import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import ListGroup from "react-bootstrap/ListGroup";
import Badge from "react-bootstrap/Badge";
import Alert from "react-bootstrap/Alert";
import { toast } from "react-toastify";
import { PositionsApi, CvsApi } from "../api/resources.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useLoadData } from "../hooks/useApi.js";
import { useErrorHandler } from "../utils/errorHandler.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import Toolbar from "../components/common/Toolbar.jsx";
import DataTable from "../components/common/DataTable.jsx";
import LikeButton from "../components/common/LikeButton.jsx";
import DiscussionPanel from "../components/common/DiscussionPanel.jsx";
import PositionForm from "../components/forms/PositionForm.jsx";
import { fullName } from "../utils/formatters.js";

const OPERATOR_LABELS = {
  "=": "=",
  "!=": "!=",
  ">": ">",
  ">=": ">=",
  "<": "<",
  "<=": "<=",
  checked: "is checked",
  contains: "contains",
};

function formatRuleValue(rule) {
  if (rule.value === null || rule.value === undefined || rule.value === "")
    return "—";
  if (typeof rule.value === "boolean") return rule.value ? "Yes" : "No";
  if (typeof rule.value === "object") {
    if (rule.value.start || rule.value.end) {
      return `${rule.value.start || "?"} – ${rule.value.end || "?"}`;
    }
    return JSON.stringify(rule.value);
  }
  return String(rule.value);
}

function AttributesList({ position, t }) {
  if (!position.positionAttributes?.length) return null;
  const sorted = [...position.positionAttributes].sort(
    (a, b) => a.order - b.order,
  );
  return (
    <div className="mb-3">
      <h6 className="fw-bold">{t("attributes")}</h6>
      <ListGroup>
        {sorted.map((pa) => (
          <ListGroup.Item key={pa.id}>
            {pa.attribute.name}
            <span className="text-muted small"> ({pa.attribute.type})</span>
            {pa.required && (
              <Badge bg="danger" className="ms-2">
                {t("required")}
              </Badge>
            )}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
}

function AccessRuleItem({ rule, position }) {
  const attr = position.positionAttributes?.find(
    (pa) => pa.attributeId === rule.attributeId,
  );
  return (
    <li className="border-bottom py-1">
      <span className="fw-semibold">{attr?.attribute?.name || "Unknown"}</span>{" "}
      <span className="text-muted">
        {OPERATOR_LABELS[rule.operator] || rule.operator}
      </span>{" "}
      <span className="badge bg-secondary">{formatRuleValue(rule)}</span>
    </li>
  );
}

function AccessRulesList({ position, t }) {
  if (!position.accessRules?.length) {
    if (position.isPublic)
      return <p className="text-muted small">{t("accessRulesDescription")}</p>;
    return null;
  }
  return (
    <div className="mb-3">
      <h6 className="fw-bold">{t("accessRules")}</h6>
      <ul className="list-unstyled">
        {position.accessRules.map((rule, idx) => (
          <AccessRuleItem key={idx} rule={rule} position={position} />
        ))}
      </ul>
    </div>
  );
}

function OverviewTab({ position }) {
  const { t } = useLanguage();
  return (
    <div>
      <p>{position.shortDescription}</p>
      <AttributesList position={position} t={t} />
      <AccessRulesList position={position} t={t} />
    </div>
  );
}

function NotEligibleWarning({ show, t }) {
  if (!show) return null;
  return (
    <Alert variant="warning" className="w-100 mb-3">
      <strong>{t("notMatch")}</strong>
      <br />
      <small>{t("updateProfileToMatch")}</small>
    </Alert>
  );
}

function CandidateActions({ position, myCv, onCreated }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { translateError } = useErrorHandler();

  if (myCv) {
    return (
      <Button onClick={() => navigate(`/cvs/${myCv.id}`)}>
        {t("openMyCV")}
      </Button>
    );
  }

  const canCreateCV = position.canApply !== false && user?.role === "candidate";
  const isEligible = position.isPublic || position.matchesSkills !== false;

  const create = async () => {
    if (!canCreateCV || !isEligible) {
      toast.error(t("notEligible"));
      return;
    }
    try {
      const cv = await CvsApi.create(position.id);
      toast.success(t("cvCreated"));
      onCreated();
      navigate(`/cvs/${cv.id}`);
    } catch (error) {
      toast.error(translateError(error));
    }
  };

  return (
    <div>
      <NotEligibleWarning show={!isEligible && !position.isPublic} t={t} />
      <Button
        onClick={create}
        disabled={!canCreateCV || !isEligible}
        variant={canCreateCV && isEligible ? "primary" : "secondary"}
      >
        {canCreateCV && isEligible ? t("createCv") : t("notEligible")}
      </Button>
    </div>
  );
}

function cvColumns(t) {
  return [
    {
      key: "candidate",
      header: t("candidate"),
      render: (r) => fullName(r.candidate),
    },
    { key: "status", header: t("status") },
    {
      key: "likes",
      header: t("likes"),
      render: (r) => (
        <LikeButton
          cvId={r.id}
          likedByMe={false}
          likeCount={r.likesCount || r.likeCount || 0}
        />
      ),
    },
  ];
}

function CvListTab({ positionId }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    data: cvs,
    loading,
    load,
  } = useLoadData(() => PositionsApi.cvs(positionId));

  useEffect(() => {
    load();
  }, [positionId]);

  if (loading || !cvs) return <LoadingSpinner />;

  return (
    <DataTable
      columns={cvColumns(t)}
      data={cvs}
      onRowClick={(r) => navigate(`/cvs/${r.id}`)}
      emptyMessage={t("noData")}
    />
  );
}

function EditPositionModal({ show, position, onHide, onSubmit, t }) {
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{t("edit")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <PositionForm
          initial={position}
          onSubmit={onSubmit}
          onCancel={onHide}
        />
      </Modal.Body>
    </Modal>
  );
}

export default function PositionDetailPage() {
  const { id } = useParams();
  const [myCv, setMyCv] = useState(null);
  const [editing, setEditing] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { translateError } = useErrorHandler();
  const { data: position, load } = useLoadData(() => PositionsApi.get(id));

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (user?.role === "candidate") {
      CvsApi.mine().then((cvs) =>
        setMyCv(cvs.find((c) => c.positionId === id) || null),
      );
    }
  }, [id, user]);

  if (!position) return <LoadingSpinner />;

  const canManage =
    user && (user.role === "recruiter" || user.role === "admin");

  const saveEdit = async (data) => {
    try {
      await PositionsApi.update(position.id, {
        ...data,
        version: position.version,
      });
      setEditing(false);
      toast.success(t("positionUpdated"));
      load();
    } catch (error) {
      toast.error(translateError(error));
    }
  };

  return (
    <div>
      <h1>{position.title}</h1>

      <Toolbar>
        {canManage && (
          <Button variant="outline-secondary" onClick={() => setEditing(true)}>
            {t("edit")}
          </Button>
        )}
        {user?.role === "candidate" && (
          <CandidateActions position={position} myCv={myCv} onCreated={load} />
        )}
      </Toolbar>

      <Tabs defaultActiveKey="overview" className="mb-3">
        <Tab eventKey="overview" title={t("overview")}>
          <OverviewTab position={position} />
        </Tab>
        {canManage && (
          <Tab eventKey="cvs" title={t("cvs")}>
            <CvListTab positionId={position.id} />
          </Tab>
        )}
        <Tab eventKey="discussion" title={t("discussion")}>
          <DiscussionPanel
            positionId={position.id}
            linkAuthorToProfile={canManage}
          />
        </Tab>
      </Tabs>

      <EditPositionModal
        show={editing}
        position={position}
        onHide={() => setEditing(false)}
        onSubmit={saveEdit}
        t={t}
      />
    </div>
  );
}
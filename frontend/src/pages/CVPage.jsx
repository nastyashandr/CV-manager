import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";
import Form from "react-bootstrap/Form";
import { CvsApi } from "../api/resources.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useErrorHandler } from "../utils/errorHandler.js";
import { useAutoSave } from "../hooks/useAutoSave.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import LikeButton from "../components/common/LikeButton.jsx";
import MarkdownView from "../components/common/MarkdownView.jsx";
import { DateFormatter, fullName } from "../utils/formatters.js";
import { ATTRIBUTE_TYPE_LABELS } from "../utils/constants.js";
import AttributePicker from "../components/forms/AttributePicker.jsx";
import ImageDropzone from "../components/common/ImageDropzone.jsx";
import AttributeValueInput from "../components/common/AttributeValueInput.jsx";
import Toolbar from "../components/common/Toolbar.jsx";

function AttributeEditRow({
  cvId,
  attribute,
  onUpdate,
  isLocked,
  isRequired,
  isCandidateAdded,
  selected,
  onSelectChange,
}) {
  const [value, setValue] = useState(attribute.value);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { t } = useLanguage();
  const { translateError } = useErrorHandler();

  const saveAttribute = useCallback(
    async (newValue) => {
      try {
        const updated = await CvsApi.updateAttribute(
          cvId,
          attribute.attributeId,
          { value: newValue },
        );
        setValue(updated.value);
        setHasError(false);
        setErrorMessage("");
        onUpdate?.();
      } catch (error) {
        const message = translateError(error);
        setHasError(true);
        setErrorMessage(message);
        toast.error(message);
        throw error;
      }
    },
    [cvId, attribute.attributeId, onUpdate, translateError],
  );

  const { status, triggerSave } = useAutoSave({
    value,
    onSave: saveAttribute,
    delay: 1000,
    showToast: true,
  });

  const handleValueChange = (newValue) => {
    setValue(newValue);
    if (hasError) {
      setHasError(false);
      setErrorMessage("");
    }
    triggerSave();
  };

  const isEmpty = value === null || value === undefined || value === "";
  const isStatusSaving = status === "saving";

  const renderInput = () => {
    if (isLocked) {
      if (attribute.type === "image") {
        return (
          <div>
            {value ? (
              <img
                src={value}
                alt={attribute.name}
                style={{
                  maxWidth: "200px",
                  maxHeight: "200px",
                  objectFit: "contain",
                }}
              />
            ) : (
              <div className="text-muted">{t("noImage")}</div>
            )}
          </div>
        );
      }
      return <div className="text-muted">{isEmpty ? "—" : String(value)}</div>;
    }

    if (attribute.type === "image") {
      return <ImageDropzone value={value} onChange={handleValueChange} />;
    }

    return (
      <AttributeValueInput
        type={attribute.type}
        value={value}
        options={attribute.options}
        onChange={handleValueChange}
      />
    );
  };

  const canSelect = !isLocked && !isRequired && isCandidateAdded;

  return (
    <div
      className={`mb-3 p-2 border rounded ${hasError ? "border-danger" : ""}`}
    >
      <div className="d-flex align-items-start">
        {canSelect && (
          <Form.Check
            type="checkbox"
            checked={selected}
            onChange={(e) =>
              onSelectChange?.(attribute.attributeId, e.target.checked)
            }
            className="mt-1"
            style={{ flexShrink: 0, marginRight: "8px" }}
          />
        )}
        {!canSelect && <div style={{ width: "0px", flexShrink: 0 }} />}
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <div>
              <span className="fw-semibold">{attribute.name}</span>
              {attribute.required && (
                <span className="text-danger ms-1">*</span>
              )}
              {isLocked && (
                <Badge bg="warning" className="ms-2">
                  🔒 {t("accessRule")}
                </Badge>
              )}
              {isRequired && !isLocked && (
                <Badge bg="info" className="ms-2">
                  {t("positionRequired")}
                </Badge>
              )}
              {isCandidateAdded && !isRequired && (
                <Badge bg="secondary" className="ms-2">
                  {t("addedByCandidate")}
                </Badge>
              )}
              {isEmpty && !hasError && (
                <Badge bg="danger" className="ms-2">
                  {t("empty")}
                </Badge>
              )}
              {!isEmpty && status === "saved" && !hasError && (
                <Badge bg="success" className="ms-2">
                  ✓
                </Badge>
              )}
              {isStatusSaving && !hasError && (
                <Badge bg="secondary" className="ms-2">
                  ⌛
                </Badge>
              )}
              {hasError && (
                <Badge bg="danger" className="ms-2">
                  {t("error")}
                </Badge>
              )}
            </div>
            <span className="text-muted small">
              {t(ATTRIBUTE_TYPE_LABELS[attribute.type]) ||
                ATTRIBUTE_TYPE_LABELS[attribute.type] ||
                attribute.type}
            </span>
          </div>
          {renderInput()}
          {isLocked && !hasError && (
            <div className="text-warning small mt-1">
              🔒 {t("cannotChangeAccessRule")}
            </div>
          )}
          {hasError && errorMessage && (
            <div className="text-danger small mt-1">⚠️ {errorMessage}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function AttributeDisplayRow({ attribute }) {
  const { t } = useLanguage();
  const isEmpty =
    attribute.value === null ||
    attribute.value === undefined ||
    attribute.value === "";

  const formatValue = () => {
    if (isEmpty) return "—";
    if (attribute.type === "boolean") return attribute.value ? "Yes" : "No";
    if (attribute.type === "period") {
      const p = attribute.value;
      return `${p.start || "?"} – ${p.end || "present"}`;
    }
    if (attribute.type === "image") {
      return (
        <img
          src={attribute.value}
          alt={attribute.name}
          style={{
            maxWidth: "100px",
            maxHeight: "100px",
            objectFit: "contain",
          }}
        />
      );
    }
    return String(attribute.value);
  };

  return (
    <div className="mb-2 pb-2 border-bottom">
      <div className="d-flex justify-content-between">
        <span className="fw-semibold">{attribute.name}</span>
        <span className="text-muted small">
          {t(ATTRIBUTE_TYPE_LABELS[attribute.type]) ||
            ATTRIBUTE_TYPE_LABELS[attribute.type] ||
            attribute.type}
        </span>
      </div>
      <div className={isEmpty ? "text-danger fw-bold" : ""}>
        {isEmpty ? "⚠️ " + t("empty") : formatValue()}
      </div>
    </div>
  );
}

export default function CVPage() {
  const { id } = useParams();
  const [cv, setCv] = useState(null);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [updatingProjects, setUpdatingProjects] = useState(false);
  const [matchesRules, setMatchesRules] = useState(true);
  const [showAddAttribute, setShowAddAttribute] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { translateError } = useErrorHandler();

  const load = useCallback(async () => {
    if (loaded) return;
    try {
      const data = await CvsApi.get(id);
      setCv(data);
      setSelectedProjects(data.selectedProjects || []);
      setAllProjects(data.allProjects || []);
      setMatchesRules(data.matchesRules !== false);
      setSelectedAttributes(new Set());
      setLoaded(true);
    } catch (error) {
      toast.error(translateError(error));
    }
  }, [id, translateError, loaded]);

  useEffect(() => {
    load();
  }, [load]);

  const updateProjects = async (projectIds) => {
    if (updatingProjects) return;
    setUpdatingProjects(true);
    try {
      const result = await CvsApi.updateProjects(id, projectIds);
      setSelectedProjects(result.selectedProjects);
      if (result.warning) {
        toast.warning(t("projectsRemovedWarning"));
      } else {
        toast.success(t("projectsUpdated"));
      }
      setLoaded(false);
      await load();
    } catch (error) {
      toast.error(translateError(error));
    } finally {
      setUpdatingProjects(false);
    }
  };

  const handlePublish = async () => {
    try {
      await CvsApi.publish(id);
      toast.success(t("cvPublished"));
      setLoaded(false);
      await load();
    } catch (error) {
      toast.error(translateError(error));
    }
  };

  const handleDelete = async () => {
    try {
      await CvsApi.remove(id);
      toast.success(t("cvDeleted"));
      navigate("/profile");
    } catch (error) {
      toast.error(translateError(error));
    }
  };

  const handleAddAttribute = async (attribute) => {
    try {
      await CvsApi.addAttribute(id, attribute.id);
      setShowAddAttribute(false);
      toast.success(t("attributeAdded"));
      setLoaded(false);
      await load();
    } catch (error) {
      toast.error(translateError(error));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedAttributes.size === 0) {
      toast.warning(t("noAttributesSelected"));
      return;
    }

    const selectedArray = Array.from(selectedAttributes);
    const requiredSelected = cv.attributes.filter(
      (a) =>
        selectedArray.includes(a.attributeId) && (a.isAccessRule || a.required),
    );

    if (requiredSelected.length > 0) {
      toast.warning(
        t("cannotDeleteRequired", {
          names: requiredSelected.map((a) => a.name).join(", "),
        }),
      );
      return;
    }

    setDeleting(true);
    try {
      for (const attributeId of selectedAttributes) {
        await CvsApi.removeAttribute(id, attributeId);
      }
      setSelectedAttributes(new Set());
      toast.success(t("attributesDeleted", { count: selectedAttributes.size }));
      setLoaded(false);
      await load();
    } catch (error) {
      toast.error(translateError(error));
    } finally {
      setDeleting(false);
    }
  };

  const isComplete = cv?.attributes?.every(
    (a) => a.value !== null && a.value !== undefined && a.value !== "",
  );

  const isOwner = user?.id === cv?.candidate?.id;
  const isAdmin = user?.role === "admin";
  const isRecruiter = user?.role === "recruiter" || user?.role === "admin";

  const canEdit = isOwner || isAdmin;
  const canView = isRecruiter || isAdmin || isOwner;

  if (!cv) return <div className="text-center py-5">{t("noCV")}</div>;

  const maxProjects = cv.position?.maxProjects;

  const hasDeletableAttributes = cv.attributes.some(
    (a) => !a.isAccessRule && !a.required && a.isCandidateAdded,
  );

  return (
    <div className="cv-page">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1>{fullName(cv.candidate)}</h1>
          <div className="d-flex gap-2 align-items-center">
            <Badge bg={cv.status === "published" ? "success" : "secondary"}>
              {cv.status === "published" ? t("published") : t("draft")}
            </Badge>
            <span className="text-muted small">• {cv.candidate?.email}</span>
          </div>
          <div className="mt-3 d-flex gap-2 flex-wrap">
            {canView && (
              <LikeButton
                cvId={cv.id}
                likedByMe={cv.likedByMe}
                likeCount={cv.likeCount}
              />
            )}
            {canEdit && cv.status !== "published" && (
              <Button
                variant="success"
                size="sm"
                onClick={handlePublish}
                disabled={!isComplete}
                style={{ minWidth: "100px" }}
              >
                {isComplete ? t("publishCV") : t("fillAllFields")}
              </Button>
            )}
            {canEdit && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                style={{ minWidth: "100px" }}
              >
                {t("deleteCV")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {!matchesRules && cv.status === "published" && (
        <div className="alert alert-danger mb-3">{t("noLongerMeets")}</div>
      )}

      <Card className="mb-4">
        <Card.Body>
          <h5>{cv.position?.title}</h5>
          <p className="text-muted mb-0">{cv.position?.shortDescription}</p>
        </Card.Body>
      </Card>

      {canEdit && (
        <Toolbar className="mb-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddAttribute(!showAddAttribute)}
            disabled={deleting}
          >
            {showAddAttribute ? t("close") : t("addAttribute")}
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            disabled={
              selectedAttributes.size === 0 ||
              !hasDeletableAttributes ||
              deleting
            }
            onClick={handleDeleteSelected}
          >
            {deleting ? t("deleting") : t("deleteSelected")}
          </Button>
          {selectedAttributes.size > 0 && (
            <span className="text-muted small">
              {t("selectedCount", { count: selectedAttributes.size })}
            </span>
          )}
        </Toolbar>
      )}

      {canEdit && showAddAttribute && (
        <div className="mt-2 p-3 border rounded mb-3">
          <AttributePicker
            excludeIds={cv.attributes.map((a) => a.attributeId)}
            onPick={handleAddAttribute}
          />
        </div>
      )}

      <h5 className="mb-3">{t("attributes")}</h5>
      {canEdit
        ? cv.attributes
            .sort((a, b) => {
              if (a.required && !b.required) return -1;
              if (!a.required && b.required) return 1;
              if (a.isCandidateAdded && !b.isCandidateAdded) return 1;
              if (!a.isCandidateAdded && b.isCandidateAdded) return -1;
              return a.name.localeCompare(b.name);
            })
            .map((attr) => {
              const isLocked = attr.isAccessRule === true;
              const isRequired = attr.required === true;
              const isCandidateAdded = attr.isCandidateAdded === true;

              return (
                <AttributeEditRow
                  key={attr.attributeId}
                  cvId={cv.id}
                  attribute={attr}
                  onUpdate={load}
                  isLocked={isLocked}
                  isRequired={isRequired}
                  isCandidateAdded={isCandidateAdded}
                  selected={selectedAttributes.has(attr.attributeId)}
                  onSelectChange={(id, checked) => {
                    const newSelected = new Set(selectedAttributes);
                    if (checked) {
                      newSelected.add(id);
                    } else {
                      newSelected.delete(id);
                    }
                    setSelectedAttributes(newSelected);
                  }}
                />
              );
            })
        : cv.attributes.map((attr) => (
            <AttributeDisplayRow key={attr.attributeId} attribute={attr} />
          ))}

      {canEdit && cv.attributes.length === 0 && (
        <p className="text-muted text-center py-3">{t("noAttributesYet")}</p>
      )}

      {canEdit && allProjects.length > 0 && maxProjects !== 0 && (
        <div className="mt-4">
          <h5 className="mb-3">{t("selectProjects")}</h5>
          <p className="text-muted small">
            {maxProjects === null || maxProjects === undefined
              ? t("unlimitedProjects")
              : t("maximumProjects", { count: maxProjects })}
          </p>
          {cv.position?.projectTags && cv.position.projectTags.length > 0 && (
            <p className="text-muted small">
              {t("requiredTags")} {cv.position.projectTags.join(", ")}
            </p>
          )}
          <div className="d-flex flex-wrap gap-2">
            {allProjects.map((project) => {
              const isSelected = selectedProjects.includes(project.id);
              const matchesTags =
                !cv.position?.projectTags?.length ||
                (project.tags || []).some((tag) =>
                  cv.position.projectTags.includes(tag),
                );
              const isMaxReached =
                maxProjects !== null &&
                maxProjects !== undefined &&
                selectedProjects.length >= maxProjects &&
                !isSelected;
              const canSelect = matchesTags && !isMaxReached;

              return (
                <Button
                  key={project.id}
                  variant={isSelected ? "primary" : "outline-secondary"}
                  size="sm"
                  onClick={() => {
                    if (updatingProjects) return;
                    let newSelected;
                    if (isSelected) {
                      newSelected = selectedProjects.filter(
                        (id) => id !== project.id,
                      );
                    } else {
                      if (isMaxReached) {
                        toast.warning(
                          t("maximumProjects", { count: maxProjects }),
                        );
                        return;
                      }
                      newSelected = [...selectedProjects, project.id];
                    }
                    updateProjects(newSelected);
                  }}
                  disabled={updatingProjects || !canSelect}
                >
                  {project.name}
                  {project.tags && project.tags.length > 0 && (
                    <span className="ms-1 text-muted small">
                      ({project.tags.join(", ")})
                    </span>
                  )}
                  {!matchesTags && (
                    <span className="ms-1 text-warning small">⚠️</span>
                  )}
                  {isSelected && <span className="ms-1">✓</span>}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {maxProjects === 0 && canEdit && (
        <div className="mt-4">
          <h5 className="mb-3">{t("selectProjects")}</h5>
          <p className="text-muted">{t("noProjectsAllowed")}</p>
        </div>
      )}

      {cv.projects && cv.projects.length > 0 && (
        <>
          <h5 className="mt-4 mb-3">{t("projectsInCV")}</h5>
          {cv.projects.map((project) => (
            <Card key={project.id} className="mb-2">
              <Card.Body>
                <div className="d-flex justify-content-between">
                  <h6 className="mb-0">{project.name}</h6>
                  <span className="text-muted small">
                    {DateFormatter.period(
                      project.periodStart,
                      project.periodEnd,
                    )}
                  </span>
                </div>
                {project.tags && project.tags.length > 0 && (
                  <div className="mt-1">
                    {project.tags.map((tag) => (
                      <Badge key={tag} bg="secondary" className="me-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <MarkdownView content={project.description} />
              </Card.Body>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

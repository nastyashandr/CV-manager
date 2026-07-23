import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { toast } from "react-toastify";
import { PositionsApi } from "../api/resources.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useLoadData, useSelection } from "../hooks/useApi.js";
import { useBulkAction } from "../hooks/useBulkAction.js";
import { useErrorHandler } from "../utils/errorHandler.js";
import DataTable from "../components/common/DataTable.jsx";
import Toolbar from "../components/common/Toolbar.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import PositionForm from "../components/forms/PositionForm.jsx";

function AccessCell({ row, user, t }) {
  const isManager = user?.role === "recruiter" || user?.role === "admin";
  if (isManager) return row.isPublic ? t("public") : t("restricted");
  if (row.isPublic)
    return <span className="text-success">{t("available")}</span>;
  if (row.matchesSkills === false)
    return <span className="text-warning">{t("notMatch")}</span>;
  return <span className="text-success">{t("matches")}</span>;
}

function useColumns(t, user) {
  return useMemo(
    () => [
      { key: "title", header: t("title"), sortable: true },
      {
        key: "shortDescription",
        header: t("description"),
        render: (r) => r.shortDescription || "—",
      },
      {
        key: "isPublic",
        header: t("public"),
        sortable: true,
        render: (r) => (r.isPublic ? "✓" : "—"),
      },
      {
        key: "access",
        header: t("access"),
        render: (r) => <AccessCell row={r} user={user} t={t} />,
      },
      {
        key: "attrCount",
        header: t("attributes"),
        sortValue: (r) => r.positionAttributes?.length || 0,
        render: (r) => r.positionAttributes?.length || 0,
      },
    ],
    [t, user],
  );
}

function TagFilterBanner({ tag, onClear, t }) {
  if (!tag) return null;
  return (
    <div className="mb-3">
      <span className="text-muted">{t("filteredByTag")} </span>
      <span className="badge bg-primary">{tag}</span>
      <Button variant="link" size="sm" className="ms-2" onClick={onClear}>
        {t("clearFilter")}
      </Button>
    </div>
  );
}

function PositionsToolbar({
  count,
  onCreate,
  onDuplicate,
  onDelete,
  onEdit,
  selectedCount,
  t,
}) {
  return (
    <Toolbar>
      <Button variant="primary" onClick={onCreate}>
        {t("createPosition")}
      </Button>
      <Button
        variant="outline-secondary"
        disabled={count === 0}
        onClick={onDuplicate}
      >
        {t("duplicate")}
      </Button>
      <Button
        variant="outline-danger"
        disabled={count === 0}
        onClick={onDelete}
      >
        {t("delete")}
      </Button>
      <Button variant="outline-primary" disabled={count !== 1} onClick={onEdit}>
        {t("edit")}
      </Button>
    </Toolbar>
  );
}

function PositionFormModal({ show, editingPosition, onHide, onSubmit, t }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onHide();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {editingPosition ? t("edit") : t("createPosition")}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <PositionForm
          initial={editingPosition}
          onSubmit={handleSubmit}
          onCancel={onHide}
        />
      </Modal.Body>
    </Modal>
  );
}

export default function PositionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { translateError } = useErrorHandler();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tag = params.get("tag");

  const { data: positions, loading, load } = useLoadData(PositionsApi.list);
  const { selected, count, setSelected } = useSelection();

  useEffect(() => {
    load();
  }, []);

  const canManage =
    user && (user.role === "recruiter" || user.role === "admin");

  const visible = useMemo(() => {
    if (!positions) return [];
    if (!tag) return positions;
    return positions.filter((p) => (p.projectTags || []).includes(tag));
  }, [positions, tag]);

  const closeForm = () => {
    setShowForm(false);
    setEditingPosition(null);
  };

  const openCreateForm = () => {
    setEditingPosition(null);
    setShowForm(true);
  };

  const openEditForm = () => {
    if (selected.size !== 1) return;
    const id = Array.from(selected)[0];
    const position = positions?.find((p) => p.id === id);
    if (position) {
      setEditingPosition(position);
      setShowForm(true);
    }
  };

  const handleRowClick = (row) => {
    navigate(`/positions/${row.id}`);
  };

  const handleSubmit = async (data) => {
    try {
      if (editingPosition) {
        await PositionsApi.update(editingPosition.id, {
          ...data,
          version: editingPosition.version,
        });
        toast.success(t("positionUpdated"));
      } else {
        await PositionsApi.create(data);
        toast.success(t("positionCreated"));
      }
      await load();
      setSelected(new Set());
    } catch (error) {
      toast.error(translateError(error));
      throw error;
    }
  };

  const duplicateSelected = useBulkAction(PositionsApi.duplicate, load, {
    successMessage: "positionsDuplicated",
    errorMessage: "failedDuplicate",
  });

  const deleteSelected = useBulkAction(PositionsApi.remove, load, {
    successMessage: "positionsDeleted",
    errorMessage: "failedDelete",
  });

  const columns = useColumns(t, user);

  if (loading && !positions) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-3">{t("positions")}</h1>

      <TagFilterBanner tag={tag} onClear={() => navigate("/positions")} t={t} />

      {canManage && (
        <PositionsToolbar
          count={count}
          selectedCount={count}
          onCreate={openCreateForm}
          onDuplicate={() => duplicateSelected(selected)}
          onDelete={() => deleteSelected(selected)}
          onEdit={openEditForm}
          t={t}
        />
      )}

      {positions ? (
        <DataTable
          columns={columns}
          data={visible}
          onRowClick={handleRowClick}
          selectable={canManage}
          selectedIds={selected}
          onSelectionChange={setSelected}
          emptyMessage={t("noData")}
        />
      ) : (
        <LoadingSpinner />
      )}

      <PositionFormModal
        show={showForm}
        editingPosition={editingPosition}
        onHide={closeForm}
        onSubmit={handleSubmit}
        t={t}
      />
    </div>
  );
}

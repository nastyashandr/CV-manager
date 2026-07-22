import { useEffect } from "react";
import { ROLES } from "../utils/constants.js";
import { UsersApi } from "../api/resources.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useLoadData, useSelection } from "../hooks/useApi.js";
import { useBulkAction } from "../hooks/useBulkAction.js";
import { useErrorHandler } from "../utils/errorHandler.js";
import DataTable from "../components/common/DataTable.jsx";
import Toolbar from "../components/common/Toolbar.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";

function RoleBadge({ role, t }) {
  return <span className="badge bg-secondary">{t(role) || role}</span>;
}

function StatusBadge({ isBlocked, t }) {
  return (
    <span className={`badge ${isBlocked ? "bg-danger" : "bg-success"}`}>
      {isBlocked ? t("blocked") : t("active")}
    </span>
  );
}

function userColumns(t) {
  return [
    { key: "email", header: t("email"), sortable: true },
    { key: "firstName", header: t("firstName") },
    { key: "lastName", header: t("lastName") },
    {
      key: "role",
      header: t("role"),
      render: (row) => <RoleBadge role={row.role} t={t} />,
    },
    {
      key: "isBlocked",
      header: t("status"),
      render: (row) => <StatusBadge isBlocked={row.isBlocked} t={t} />,
    },
  ];
}

function RoleDropdown({ disabled, onPick, t }) {
  return (
    <Dropdown>
      <Dropdown.Toggle variant="outline-secondary" disabled={disabled}>
        {t("setRole")}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {ROLES.map((role) => (
          <Dropdown.Item key={role} onClick={() => onPick(role)}>
            {t(role) || role}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

function UsersToolbar({
  count,
  onDelete,
  onBlock,
  onUnblock,
  onSetRole,
  canDelete,
  t,
}) {
  return (
    <Toolbar className="mb-3">
      <Button
        variant="outline-danger"
        disabled={count === 0 || !canDelete}
        onClick={onDelete}
      >
        {t("deleteSelected")}
      </Button>
      <Button
        variant="outline-success"
        disabled={count === 0}
        onClick={onUnblock}
      >
        {t("unblockSelected")}
      </Button>
      <Button
        variant="outline-warning"
        disabled={count === 0}
        onClick={onBlock}
      >
        {t("blockSelected")}
      </Button>
      <RoleDropdown disabled={count === 0} onPick={onSetRole} t={t} />
      {count > 0 && (
        <span className="text-muted small">
          {t("selectedCount", { count })}
        </span>
      )}
    </Toolbar>
  );
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const { translateError } = useErrorHandler();

  const { data: users, loading, load } = useLoadData(UsersApi.listAll);
  const { selected, setSelected, count } = useSelection();

  useEffect(() => {
    load();
  }, []);

  const deleteSelected = useBulkAction(UsersApi.remove, load, {
    successMessage: "usersDeleted",
    errorMessage: "failedDeleteUsers",
    selfId: currentUser.id,
  });

  const changeRoleSelected = useBulkAction(
    (userId, { role }) => UsersApi.setRole(userId, role),
    load,
    {
      successMessage: "rolesChanged",
      errorMessage: "failedChangeRoles",
      selfId: currentUser.id,
      getSuccessParams: (params) => ({ role: t(params.role) || params.role }),
    },
  );

  const blockSelected = useBulkAction(
    (userId, { isBlocked }) => UsersApi.setBlocked(userId, isBlocked),
    load,
    {
      successMessage: "usersBlocked",
      errorMessage: "failedBlockUsers",
      selfId: currentUser.id,
      getSuccessParams: (params) => ({
        action: params.isBlocked ? t("blocked") : t("unblocked"),
      }),
    },
  );

  if (loading) return <LoadingSpinner />;

  const hasDeletableUsers = users?.some((u) => u.id !== currentUser.id);

  return (
    <div>
      <h1 className="mb-3">{t("users")}</h1>

      <UsersToolbar
        count={count}
        canDelete={hasDeletableUsers}
        onDelete={() => deleteSelected(selected)}
        onUnblock={() => blockSelected(selected, { isBlocked: false })}
        onBlock={() => blockSelected(selected, { isBlocked: true })}
        onSetRole={(role) => changeRoleSelected(selected, { role })}
        t={t}
      />

      <DataTable
        columns={userColumns(t)}
        data={users || []}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        keyField="id"
        emptyMessage={t("noUsers")}
      />
    </div>
  );
}

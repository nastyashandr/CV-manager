import { useEffect, useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import { toast } from "react-toastify";
import { AttributesApi } from "../api/resources.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useLoadData, useSelection } from "../hooks/useApi.js";
import { useBulkAction } from "../hooks/useBulkAction.js";
import { useErrorHandler } from "../utils/errorHandler.js";
import DataTable from "../components/common/DataTable.jsx";
import Toolbar from "../components/common/Toolbar.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import AttributeForm from "../components/forms/AttributeForm.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import {
  ATTRIBUTE_CATEGORIES,
  ATTRIBUTE_TYPE_LABELS,
} from "../utils/constants.js";

const BUILTIN_NAMES = ["First Name", "Last Name", "Location", "Personal Photo"];

export default function AttributeLibraryPage() {
  const [category, setCategory] = useState("");
  const [modal, setModal] = useState(null);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { translateError } = useErrorHandler();

  const {
    data: attributes,
    loading,
    load,
  } = useLoadData(() => AttributesApi.list(category ? { category } : {}));
  const { selected, setSelected } = useSelection();

  useEffect(() => {
    load();
  }, [category]);

  const canManage =
    user && (user.role === "recruiter" || user.role === "admin");

  const filteredAttributes = useMemo(() => {
    if (!attributes) return null;
    return attributes.filter((a) => !BUILTIN_NAMES.includes(a.name));
  }, [attributes]);

  const save = async (data) => {
    try {
      if (modal?.attribute) {
        await AttributesApi.update(modal.attribute.id, {
          ...data,
          version: modal.attribute.version,
        });
      } else {
        await AttributesApi.create(data);
      }
      setModal(null);
      toast.success("Saved");
      load();
    } catch (error) {
      toast.error(translateError(error));
    }
  };

  const deleteSelected = useBulkAction(AttributesApi.remove, load, {
    successMessage: "attributeDeleted",
    errorMessage: "failedDelete",
  });

  const columns = useMemo(
    () => [
      { key: "name", header: t("name"), sortable: true },
      {
        key: "category",
        header: t("category"),
        sortable: true,
        render: (row) => t(row.category) || row.category,
      },
      {
        key: "type",
        header: t("type"),
        sortable: true,
        render: (row) =>
          t(ATTRIBUTE_TYPE_LABELS[row.type]) ||
          ATTRIBUTE_TYPE_LABELS[row.type] ||
          row.type,
      },
    ],
    [t],
  );

  if (loading && !attributes) return <LoadingSpinner />;

  const categoryOptions = [
    { value: "", label: t("allCategories") },
    ...ATTRIBUTE_CATEGORIES.map((c) => ({ value: c, label: t(c) || c })),
  ];

  const count = selected.size;

  return (
    <div>
      <h1 className="mb-3">{t("attributeLibrary")}</h1>
      <Toolbar>
        {canManage && (
          <>
            <Button variant="primary" onClick={() => setModal({})}>
              {t("addAttribute")}
            </Button>
            <Button
              variant="outline-secondary"
              disabled={count !== 1}
              onClick={() =>
                setModal({
                  attribute: attributes?.find((a) => selected.has(a.id)),
                })
              }
            >
              {t("edit")}
            </Button>
            <Button
              variant="outline-danger"
              disabled={!count}
              onClick={() => deleteSelected(selected)}
            >
              {t("delete")}
            </Button>
          </>
        )}
        <CustomSelect
          value={category}
          options={categoryOptions}
          onChange={setCategory}
          wrapperClassName="flex-grow-1"
          style={{ maxWidth: 220 }}
        />
      </Toolbar>

      {filteredAttributes ? (
        <DataTable
          columns={columns}
          data={filteredAttributes}
          selectable={canManage}
          selectedIds={selected}
          onSelectionChange={setSelected}
        />
      ) : (
        <LoadingSpinner />
      )}

      {modal && (
        <AttributeForm
          show
          onHide={() => setModal(null)}
          onSubmit={save}
          initial={modal.attribute}
        />
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { SearchApi } from "../api/resources.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLoadData } from "../hooks/useApi.js";
import { useErrorHandler } from "../utils/errorHandler.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import DataTable from "../components/common/DataTable.jsx";
import LikeButton from "../components/common/LikeButton.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { fullName } from "../utils/formatters.js";

function likesCell(row) {
  const cv = row.cvs?.[0];
  if (!cv) return "—";
  return (
    <LikeButton cvId={cv.id} likedByMe={false} likeCount={cv.likeCount || 0} />
  );
}

function candidateColumns(t) {
  return [
    { key: "firstName", header: t("name"), render: fullName },
    { key: "email", header: t("email") },
    {
      key: "positionTitle",
      header: t("position"),
      render: (r) => r.cvs?.map((c) => c.positionTitle).join(", ") || "—",
    },
    {
      key: "status",
      header: t("status"),
      render: (r) => r.cvs?.map((c) => c.status).join(", ") || "—",
    },
    { key: "likes", header: t("likes"), render: likesCell },
  ];
}

function positionColumns(t) {
  return [
    { key: "title", header: t("title") },
    { key: "shortDescription", header: t("description") },
    {
      key: "projectTags",
      header: t("tags"),
      render: (r) => (r.projectTags || []).join(", "),
    },
  ];
}

function CandidateResults({ results, t, onRowClick }) {
  const candidates = results.candidates || [];
  return (
    <>
      <h5 className="mb-3">
        {t("cvs")} ({candidates.length})
      </h5>
      {candidates.length ? (
        <DataTable
          columns={candidateColumns(t)}
          data={candidates}
          onRowClick={onRowClick}
          keyField="id"
          emptyMessage={t("noData")}
        />
      ) : (
        <p className="text-muted">{t("noCVsFound")}</p>
      )}
    </>
  );
}

function PositionResults({ results, t, onRowClick }) {
  const positions = results.positions || [];
  return (
    <>
      <h5 className="mb-3">
        {t("positions")} ({positions.length})
      </h5>
      {positions.length ? (
        <DataTable
          columns={positionColumns(t)}
          data={positions}
          onRowClick={onRowClick}
          keyField="id"
          emptyMessage={t("noData")}
        />
      ) : (
        <p className="text-muted">{t("noPositionsFound")}</p>
      )}
    </>
  );
}

export default function SearchResultsPage() {
  const [params] = useSearchParams();
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { translateError } = useErrorHandler();
  const navigate = useNavigate();
  const query = params.get("q") || "";

  const {
    data: results,
    loading,
    load,
  } = useLoadData(() => SearchApi.search(query), {
    onError: () => setError(t("searchFailed")),
  });

  useEffect(() => {
    if (query) {
      setError(null);
      load();
    }
  }, [query]);

  const goToCandidate = (row) => {
    if (row.cvs?.length) {
      navigate(`/cvs/${row.cvs[0].id}`);
    } else {
      toast.info(t("noCVForCandidate"));
    }
  };

  const goToPosition = (row) => {
    if (row?.id) navigate(`/positions/${row.id}`);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center py-5 text-danger">{error}</div>;
  if (!query)
    return <div className="text-center py-5">{t("enterSearchTerm")}</div>;
  if (!results) return <div className="text-center py-5">{t("noResults")}</div>;

  const isRecruiter = user?.role === "recruiter" || user?.role === "admin";

  return (
    <div>
      <h1 className="mb-4">
        {t("searchResults")} "{query}"
      </h1>
      {isRecruiter ? (
        <CandidateResults results={results} t={t} onRowClick={goToCandidate} />
      ) : (
        <PositionResults results={results} t={t} onRowClick={goToPosition} />
      )}
    </div>
  );
}

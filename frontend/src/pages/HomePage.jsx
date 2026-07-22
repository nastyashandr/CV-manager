import { useEffect } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useNavigate } from "react-router-dom";
import { PositionsApi, StatsApi } from "../api/resources.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useLoadData } from "../hooks/useApi.js";
import DataTable from "../components/common/DataTable.jsx";
import StatCard from "../components/common/StatCard.jsx";
import TagCloud from "../components/common/TagCloud.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";

const POSITION_COLUMNS = (t) => [
  { key: "title", header: t("title"), sortable: true },
  {
    key: "isPublic",
    header: t("public"),
    render: (r) => (r.isPublic ? "✓" : "—"),
  },
];

function StatsSection({ stats, t }) {
  if (!stats) return null;
  return (
    <Row className="g-3 mb-4">
      <Col md={3}>
        <StatCard label={t("totalPositions")} value={stats.positions || 0} />
      </Col>
      <Col md={3}>
        <StatCard label={t("totalCandidates")} value={stats.candidates || 0} />
      </Col>
      <Col md={3}>
        <StatCard label={t("totalCvs")} value={stats.cvs || 0} />
      </Col>
      <Col md={3}>
        <StatCard label={t("cvsLast24h")} value={stats.cvsLast24h || 0} />
      </Col>
    </Row>
  );
}

export default function HomePage() {
  const {
    data: stats,
    loading: statsLoading,
    load: loadStats,
  } = useLoadData(StatsApi.summary);
  const {
    data: latest,
    loading: latestLoading,
    load: loadLatest,
  } = useLoadData(PositionsApi.latest);
  const {
    data: popular,
    loading: popularLoading,
    load: loadPopular,
  } = useLoadData(PositionsApi.popular);
  const {
    data: tags,
    loading: tagsLoading,
    load: loadTags,
  } = useLoadData(StatsApi.tagCloud);
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
    loadLatest();
    loadPopular();
    loadTags();
  }, []);

  const goToPosition = (row) => navigate(`/positions/${row.id}`);

  const goToTag = (tag) => {
    if (user?.role === "recruiter" || user?.role === "admin") {
      navigate(`/search?q=${tag}`);
    } else {
      navigate(`/positions?tag=${tag}`);
    }
  };

  const isLoading =
    statsLoading || latestLoading || popularLoading || tagsLoading;

  if (isLoading) return <LoadingSpinner />;

  const safeLatest = Array.isArray(latest) ? latest : [];
  const safePopular = Array.isArray(popular) ? popular : [];
  const safeTags = Array.isArray(tags) ? tags : [];

  return (
    <div>
      <h1 className="mb-4">{t("appName")}</h1>
      <StatsSection stats={stats} t={t} />
      <Row className="g-4 mb-4">
        <Col md={6}>
          <h4>{t("latestPositions")}</h4>
          <DataTable
            columns={POSITION_COLUMNS(t)}
            data={safeLatest}
            onRowClick={goToPosition}
            emptyMessage={t("noData")}
          />
        </Col>
        <Col md={6}>
          <h4>{t("popularPositions")}</h4>
          <DataTable
            columns={POSITION_COLUMNS(t)}
            data={safePopular}
            onRowClick={goToPosition}
            emptyMessage={t("noData")}
          />
        </Col>
      </Row>
      <h4>{t("tagCloud")}</h4>
      <TagCloud tags={safeTags} />
    </div>
  );
}

import { useState } from "react";
import Button from "react-bootstrap/Button";
import { toast } from "react-toastify";
import { CvsApi } from "../../api/resources.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

export default function LikeButton({
  cvId,
  likedByMe: initialLikedByMe,
  likeCount: initialLikeCount,
  onLikeChange,
}) {
  const [liked, setLiked] = useState(initialLikedByMe || false);
  const [count, setCount] = useState(initialLikeCount || 0);
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  const isRecruiter = user?.role === "recruiter" || user?.role === "admin";

  const applyResult = (result) => {
    setLiked(result.liked);
    setCount(result.likeCount);
    onLikeChange?.(cvId, result.likeCount, result.liked);
  };

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await CvsApi.like(cvId);
      applyResult(result);
    } catch (error) {
      toast.error(error.response?.data?.message || t("errorOccurred"));
    } finally {
      setBusy(false);
    }
  };

  if (!isRecruiter) return null;

  return (
    <Button
      size="sm"
      variant={liked ? "primary" : "outline-primary"}
      disabled={busy}
      onClick={toggle}
      className="d-flex align-items-center gap-1"
    >
      <span>❤</span> {count}
    </Button>
  );
}

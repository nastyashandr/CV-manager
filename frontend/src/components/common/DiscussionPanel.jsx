import { useEffect, useRef, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DiscussionsApi } from '../../api/resources.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import useSocket from '../../hooks/useSocket.js';
import MarkdownView from './MarkdownView.jsx';
import { fullName, DateFormatter } from '../../utils/formatters.js';

function PostItem({ post, linkAuthor }) {
  const author = linkAuthor
    ? <Link to={`/profile/${post.author.id}`}>{fullName(post.author)}</Link>
    : fullName(post.author);

  return (
    <div className="discussion-post mb-3">
      <div className="d-flex justify-content-between">
        <strong>{author}</strong>
        <span className="text-muted small">{DateFormatter.dateTime(post.createdAt)}</span>
      </div>
      <MarkdownView content={post.content} />
    </div>
  );
}

function PostList({ posts, linkAuthor, emptyLabel, bottomRef }) {
  return (
    <div className="discussion-list mb-3" style={{ maxHeight: 400, overflowY: 'auto' }}>
      {posts.map((post) => (
        <PostItem key={post.id} post={post} linkAuthor={linkAuthor} />
      ))}
      {!posts.length && <p className="text-muted">{emptyLabel}</p>}
      <div ref={bottomRef} />
    </div>
  );
}

function ComposeForm({ draft, setDraft, sending, onSubmit }) {
  const { t } = useLanguage();
  return (
    <Form onSubmit={onSubmit} className="d-flex gap-2">
      <Form.Control
        as="textarea"
        rows={2}
        value={draft}
        placeholder={t('writeMessage')}
        onChange={(e) => setDraft(e.target.value)}
        disabled={sending}
      />
      <Button type="submit" disabled={sending || !draft.trim()}>
        {sending ? t('sending') : t('send')}
      </Button>
    </Form>
  );
}

export default function DiscussionPanel({ positionId, linkAuthorToProfile }) {
  const [posts, setPosts] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const bottomRef = useRef(null);

  useEffect(() => {
    DiscussionsApi.list(positionId).then(setPosts);
  }, [positionId]);

  useSocket(positionId, (post) => setPosts((prev) => [...prev, post]));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [posts.length]);

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      await DiscussionsApi.create(positionId, draft);
      setDraft('');
    } catch (error) {
      toast.error(error.response?.data?.message || t('errorOccurred'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PostList posts={posts} linkAuthor={linkAuthorToProfile} emptyLabel={t('noPosts')} bottomRef={bottomRef} />
      {user && <ComposeForm draft={draft} setDraft={setDraft} sending={sending} onSubmit={submit} />}
    </div>
  );
}

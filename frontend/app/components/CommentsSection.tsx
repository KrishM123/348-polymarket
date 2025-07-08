import React, { useEffect, useState } from "react";
import { marketsAPI, Comment } from "@/lib/markets";
import { useAuth } from "@/app/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface CommentsSectionProps {
  marketId: number;
  expanded: boolean;
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600)
    return `${Math.floor(diff / 60)} min${
      Math.floor(diff / 60) === 1 ? "" : "s"
    } ago`;
  if (diff < 86400)
    return `${Math.floor(diff / 3600)} hour${
      Math.floor(diff / 3600) === 1 ? "" : "s"
    } ago`;
  return `${Math.floor(diff / 86400)} day${
    Math.floor(diff / 86400) === 1 ? "" : "s"
  } ago`;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  marketId,
  expanded,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line
  }, [marketId]);

  const fetchComments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await marketsAPI.getMarketComments(marketId);
      setComments(res.comments.filter((c) => c.level === 0));
    } catch (err: any) {
      setError(err.message || "Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    setSubmitting(true);
    try {
      await marketsAPI.postMarketComment(marketId, user.id, newComment.trim());
      setNewComment("");
      fetchComments();
    } catch (err: any) {
      setError(err.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  if (!expanded) return null;

  return (
    <div>
      {/* New Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-4 flex gap-2 items-center">
          <input
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={submitting}
            maxLength={500}
          />
          <Button type="submit" disabled={submitting || !newComment.trim()}>
            Post
          </Button>
        </form>
      ) : (
        <div className="mb-4 text-sm text-gray-500">
          Log in to post a comment.
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-gray-500 py-4">Loading comments...</div>
      ) : error ? (
        <div className="text-red-500 py-4">{error}</div>
      ) : comments.length === 0 ? (
        <div className="text-gray-500 py-4">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <ul>
          {comments.map((comment) => (
            <li
              key={comment.cId}
              className="px-2 py-3 rounded-md transition-colors hover:bg-gray-50"
            >
              <div className="mb-1 text-sm text-gray-800">
                {comment.content}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="font-semibold">{comment.uname}</span>
                <span>·</span>
                <span>{formatRelativeTime(comment.created_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CommentsSection;

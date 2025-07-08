import React, { useEffect, useState } from "react";
import { marketsAPI, Comment } from "@/lib/markets";
import { useAuth } from "@/app/contexts/AuthContext";
import { Button } from "@/components/ui/button";

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

interface CommentNode extends Comment {
  children: CommentNode[];
}

export default function CommentsSection({ marketId }: { marketId: number }) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await marketsAPI.getMarketComments(marketId);
      setComments(response.comments || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  };

  const buildCommentTree = (flatComments: Comment[]): CommentNode[] => {
    const commentMap = new Map<number, CommentNode>();
    const rootComments: CommentNode[] = [];

    // Create all comment nodes
    flatComments.forEach((comment) => {
      commentMap.set(comment.cId, {
        ...comment,
        children: [],
      });
    });

    // Build the tree structure
    flatComments.forEach((comment) => {
      const node = commentMap.get(comment.cId)!;
      if (comment.parent_id === null || comment.parent_id === undefined) {
        rootComments.push(node);
      } else {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      }
    });

    return rootComments;
  };

  useEffect(() => {
    fetchComments();
  }, [marketId]);

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

  const handleReply = async (parentId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyContent.trim()) return;
    setSubmittingReply(true);
    try {
      await marketsAPI.postMarketReply(
        marketId,
        parentId,
        user.id,
        replyContent.trim()
      );
      setReplyContent("");
      setReplyingTo(null);
      fetchComments();
    } catch (err: any) {
      setError(err.message || "Failed to post reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  const renderCommentTree = (
    commentNodes: CommentNode[],
    depth: number = 0
  ) => {
    return commentNodes.map((comment) => (
      <div key={comment.cId}>
        <li
          className="py-3 px-2 rounded-md rounded-l-none transition-colors hover:bg-gray-50"
          style={{
            marginLeft: `${depth * 20}px`,
            borderLeft: depth > 0 ? "2px solid #e5e7eb" : "none",
            paddingLeft: depth > 0 ? "12px" : "8px",
            borderTopLeftRadius: depth > 0 ? "0" : "8px",
            borderBottomLeftRadius: depth > 0 ? "0" : "8px",
          }}
        >
          <div className="mb-1 text-sm text-gray-800">{comment.content}</div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="font-semibold">{comment.uname}</span>
            <span>·</span>
            <span>{formatRelativeTime(comment.created_at)}</span>
            {isAuthenticated && (
              <>
                <span>·</span>
                <Button
                  onClick={() =>
                    setReplyingTo(
                      replyingTo === comment.cId ? null : comment.cId
                    )
                  }
                  variant="link"
                  size="sm"
                  className="text-blue-600 hover:text-blue-800 text-xs font-normal px-0"
                >
                  Reply
                </Button>
              </>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === comment.cId && (
            <form
              onSubmit={(e) => handleReply(comment.cId, e)}
              className="mt-3 flex gap-2 items-center"
            >
              <input
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                type="text"
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                disabled={submittingReply}
                maxLength={500}
              />
              <Button
                type="submit"
                disabled={submittingReply || !replyContent.trim()}
              >
                Reply
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent("");
                }}
              >
                Cancel
              </Button>
            </form>
          )}
        </li>

        {/* Render children recursively */}
        {comment.children.length > 0 && (
          <ul>{renderCommentTree(comment.children, depth + 1)}</ul>
        )}
      </div>
    ));
  };

  const commentTree = buildCommentTree(comments);

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
      ) : commentTree.length === 0 ? (
        <div className="text-gray-500 py-0 mx-auto text-center w-full text-sm">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <ul>{renderCommentTree(commentTree)}</ul>
      )}
    </div>
  );
}

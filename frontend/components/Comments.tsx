'use client';

import { useState } from 'react';
import { Comment } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface CommentsProps {
    marketId: number;
    initialComments?: Comment[];
}

export default function Comments({ marketId, initialComments = [] }: CommentsProps) {
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<number | null>(null);
    const { user } = useAuth();

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/markets/${marketId}/comments`);
            if (!res.ok) throw new Error('Failed to fetch comments');
            const data = await res.json();
            setComments(data.comments);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent, parentId?: number) => {
        e.preventDefault();
        if (!user) {
            alert('Please log in to comment');
            return;
        }

        try {
            const endpoint = parentId 
                ? `/api/markets/${marketId}/comments/${parentId}/replies`
                : `/api/markets/${marketId}/comments`;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    user_id: user.id,
                    content: newComment
                })
            });

            if (!res.ok) throw new Error('Failed to post comment');
            
            setNewComment('');
            setReplyTo(null);
            fetchComments(); // Refresh comments
        } catch (error) {
            console.error('Error posting comment:', error);
        }
    };

    const CommentItem = ({ comment }: { comment: Comment }) => (
        <div 
            className="border-l-2 border-gray-200 pl-4 mb-4"
            style={{ marginLeft: `${comment.level * 20}px` }}
        >
            <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-gray-900">{comment.uname}</div>
                    <div className="text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                    </div>
                </div>
                <p className="text-gray-700 mb-2">{comment.content}</p>
                <button
                    onClick={() => setReplyTo(comment.cId)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                >
                    Reply
                </button>
                
                {replyTo === comment.cId && (
                    <form onSubmit={(e) => handleSubmit(e, comment.cId)} className="mt-4">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="w-full p-2 border rounded-lg mb-2"
                            placeholder="Write a reply..."
                            rows={2}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setReplyTo(null)}
                                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Reply
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments</h2>
            
            {/* New Comment Form */}
            <form onSubmit={handleSubmit} className="mb-8">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full p-4 border rounded-lg mb-2"
                    placeholder="Write a comment..."
                    rows={3}
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    disabled={!user}
                >
                    {user ? 'Post Comment' : 'Login to Comment'}
                </button>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
                {comments.map((comment) => (
                    <CommentItem key={comment.cId} comment={comment} />
                ))}
                
                {comments.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        No comments yet. Be the first to comment!
                    </div>
                )}
            </div>
        </div>
    );
} 
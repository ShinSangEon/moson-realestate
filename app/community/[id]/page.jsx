"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  Eye,
  UserCircle,
  MessageCircle,
  SendHorizonal,
} from "lucide-react";
import { motion } from "framer-motion";

export default function CommunityDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/post/${id}`);
        const data = await res.json();
        if (data.success) setPost(data.post);
      } catch (err) {
        console.error("게시글 조회 실패", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchUser = async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();
      if (res.ok && data.user) setUser(data.user);
    };

    const fetchComments = async () => {
      const res = await fetch(`/api/comment/${id}`);
      const data = await res.json();
      if (res.ok) setComments(data.comments);
    };

    fetchPost();
    fetchUser();
    fetchComments();
  }, [id]);

  const handleSubmit = async (parentId = null) => {
    const content = parentId ? replyText : commentText;
    if (!content.trim()) return;

    const res = await fetch("/api/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content, postId: id, parentId }),
    });

    const data = await res.json();
    if (data.success) {
      setComments((prev) => [data.comment, ...prev]);
      parentId ? setReplyText("") : setCommentText("");
      setReplyingTo(null);
    }
  };

  const handleDelete = async (commentId) => {
    const res = await fetch(`/api/comment/${commentId}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json();
    if (data.success) {
      setComments((prev) =>
        prev.filter((c) => c.id !== commentId && c.parentId !== commentId)
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-green-500 mr-2" />
        불러오는 중...
      </div>
    );
  }

  if (!post) {
    return (
      <p className="text-center text-gray-500 mt-10">
        게시글을 찾을 수 없습니다.
      </p>
    );
  }

  return (
    <motion.div
      className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6">
        <div className="text-xs text-green-600 font-semibold mb-1">
          #{post.category}
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{post.title}</h1>
        <div className="text-sm text-gray-500 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <UserCircle size={16} /> 작성자:{" "}
            {post.author?.name || post.author?.email || "알 수 없음"}
          </div>
          <div className="flex items-center gap-2">
            <Eye size={16} /> {post.views} views ·{" "}
            {new Date(post.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="게시글 이미지"
          className="rounded-lg mb-6 w-full max-h-[500px] object-cover"
        />
      )}

      <div className="text-base leading-relaxed text-gray-700 whitespace-pre-line mb-10">
        {post.content}
      </div>

      {/* 댓글 섹션 */}
      <div className="border-t pt-6 mt-10">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-green-600 mb-4">
          <MessageCircle /> 댓글 {comments.length}
        </h3>

        {user ? (
          <div className="flex gap-2 mb-6">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글을 입력하세요"
              className="flex-1 border px-4 py-2 rounded-md"
            />
            <button
              onClick={() => handleSubmit()}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
            >
              <SendHorizonal size={16} />
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            로그인 후 댓글을 작성할 수 있습니다.
          </p>
        )}

        <div className="space-y-4">
          {comments
            .filter((c) => !c.parentId)
            .map((c) => (
              <div key={c.id} className="border rounded-md p-4 bg-gray-50">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{c.author?.name || c.author?.email || "익명"}</span>
                  <span>{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm">{c.content}</p>

                <div className="flex justify-end gap-2 mt-2 text-xs text-gray-500">
                  {user &&
                    (user.id === c.authorId || user.role === "admin") && (
                      <button
                        className="hover:text-red-500"
                        onClick={() => handleDelete(c.id)}
                      >
                        삭제
                      </button>
                    )}
                  {user && (
                    <button
                      onClick={() =>
                        setReplyingTo((prev) => (prev === c.id ? null : c.id))
                      }
                      className="hover:text-green-500"
                    >
                      답글 달기
                    </button>
                  )}
                </div>

                {replyingTo === c.id && (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="답글을 입력하세요"
                      className="flex-1 border px-3 py-1 rounded-md text-sm"
                    />
                    <button
                      onClick={() => handleSubmit(c.id)}
                      className="bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600"
                    >
                      등록
                    </button>
                  </div>
                )}

                <div className="mt-4 pl-4 border-l space-y-2">
                  {comments
                    .filter((reply) => reply.parentId === c.id)
                    .map((reply) => (
                      <div
                        key={reply.id}
                        className="bg-white rounded-md p-3 border text-sm"
                      >
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>
                            {reply.author?.name ||
                              reply.author?.email ||
                              "익명"}
                          </span>
                          <span>
                            {new Date(reply.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p>{reply.content}</p>
                        {user &&
                          (user.id === reply.authorId ||
                            user.role === "admin") && (
                            <button
                              className="text-xs text-red-500 mt-1"
                              onClick={() => handleDelete(reply.id)}
                            >
                              삭제
                            </button>
                          )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </motion.div>
  );
}

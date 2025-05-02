"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  Eye,
  UserCircle,
  MessageCircle,
  SendHorizonal,
  Heart,
  Bookmark,
  CheckCircle2,
  Share2,
  BadgeCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";

export default function CommunityDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [viewCounted, setViewCounted] = useState(false);
  const [showBadgeAlert, setShowBadgeAlert] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postRes, userRes] = await Promise.all([
          fetch(`/api/post/${id}`),
          fetch("/api/auth/me", { credentials: "include" }),
        ]);

        const postData = await postRes.json();
        if (postData.success) setPost(postData.post);

        const userData = await userRes.json();
        if (userData.user) setUser(userData.user);
      } catch (err) {
        console.error("데이터 조회 실패", err);
      } finally {
        setLoading(false);
      }
    };

    // 조회수 증가를 한 번만 실행
    if (!viewCounted) {
      fetchData();
      setViewCounted(true);
    }
  }, [id, viewCounted]);

  const handleLike = async () => {
    if (!user) {
      alert("좋아요를 누르시려면 로그인이 필요합니다.");
      return;
    }

    try {
      const response = await fetch(`/api/post/${post.id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          alert("로그인이 필요합니다.");
          return;
        }
        throw new Error(data.message || "좋아요 처리에 실패했습니다.");
      }

      setPost((prev) => ({
        ...prev,
        isLiked: !prev.isLiked,
        _count: {
          ...prev._count,
          likes: prev.isLiked ? prev._count.likes - 1 : prev._count.likes + 1,
        },
      }));
    } catch (error) {
      console.error("좋아요 처리 오류:", error);
      alert(error.message);
    }
  };

  const handleBookmark = async () => {
    if (!user) return;

    try {
      const res = await fetch(`/api/post/${id}/bookmark`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        setPost((prev) => ({
          ...prev,
          isBookmarked: data.isBookmarked,
        }));
      }
    } catch (err) {
      console.error("북마크 처리 실패", err);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("링크가 복사되었습니다!");
    } catch (err) {
      console.error("링크 복사 실패", err);
      alert("링크 복사에 실패했습니다.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("댓글을 작성하시려면 로그인이 필요합니다.");
      return;
    }
    if (!commentText.trim()) {
      toast.error("댓글 내용을 입력해주세요.");
      return;
    }

    console.log("현재 사용자 정보:", { id: user.id, role: user.role });

    try {
      console.log("댓글 작성 요청 시작:", { postId: id, content: commentText });

      const response = await fetch("/api/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          content: commentText,
          postId: id,
        }),
      });

      const data = await response.json();
      console.log("API 응답 데이터:", data);

      if (!response.ok || !data.success) {
        console.log("에러 발생:", { status: response.status, data });

        if (data.error === "AGENT_ONLY") {
          toast.error(
            "공인중개사 전용 게시글입니다.\n공인중개사로 등록하시면 답변하실 수 있습니다.",
            {
              duration: 5000,
              icon: "🔒",
              style: {
                background: "#fff",
                color: "#333",
                border: "1px solid #e5e7eb",
                padding: "1rem",
                borderRadius: "0.5rem",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                whiteSpace: "pre-line",
              },
            }
          );
          return;
        }

        if (response.status === 401) {
          toast.error("로그인이 필요합니다.");
          return;
        }

        toast.error(data.message || "댓글 작성에 실패했습니다.");
        return;
      }

      console.log("댓글 작성 성공:", data);
      setPost((prev) => ({
        ...prev,
        comments: [data.comment, ...prev.comments],
      }));
      setCommentText("");
      toast.success("댓글이 작성되었습니다.");

      // 뱃지 획득 시 알림 표시
      if (data.earnedBadges && data.earnedBadges.length > 0) {
        setEarnedBadges(data.earnedBadges);
        setShowBadgeAlert(true);

        // 마이페이지 데이터 갱신
        const userRes = await fetch("/api/auth/me", { credentials: "include" });
        const userData = await userRes.json();
        if (userData.user) setUser(userData.user);

        setTimeout(() => {
          setShowBadgeAlert(false);
          setEarnedBadges([]);
        }, 5000);
      }
    } catch (error) {
      console.error("댓글 작성 오류:", error);
      toast.error("댓글 작성 중 오류가 발생했습니다.");
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("정말로 게시글을 삭제하시겠습니까?")) return;

    try {
      console.log("게시글 삭제 요청 시작:", id);
      const res = await fetch(`/api/post/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      console.log("게시글 삭제 응답 상태:", res.status);
      const data = await res.json();
      console.log("게시글 삭제 응답 데이터:", data);

      if (!res.ok) {
        console.error("게시글 삭제 실패:", { status: res.status, data });
        if (res.status === 403) {
          toast.error("게시글을 삭제할 권한이 없습니다.");
        } else if (res.status === 400) {
          if (data.error === "ACCEPTED_COMMENT_EXISTS") {
            toast.error(
              "채택된 답변이 있어 게시글을 삭제할 수 없습니다.\n채택된 답변을 취소한 후 다시 시도해주세요.",
              {
                duration: 5000,
                icon: "⚠️",
                style: {
                  background: "#fff",
                  color: "#333",
                  border: "1px solid #e5e7eb",
                  padding: "1rem",
                  borderRadius: "0.5rem",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  whiteSpace: "pre-line",
                },
              }
            );
          } else {
            toast.error(data.message || "게시글 삭제에 실패했습니다.");
          }
        } else if (res.status === 500) {
          if (data.error === "FOREIGN_KEY_CONSTRAINT") {
            toast.error("게시글 삭제 중 오류가 발생했습니다.");
          } else {
            toast.error("게시글 삭제 중 오류가 발생했습니다.");
          }
        } else {
          toast.error("게시글 삭제 중 오류가 발생했습니다.");
        }
        return;
      }

      if (data.success) {
        toast.success("게시글이 삭제되었습니다.");
        window.location.href = "/community";
      } else {
        console.error("게시글 삭제 실패:", data);
        toast.error(data.message || "게시글 삭제에 실패했습니다.");
      }
    } catch (err) {
      console.error("게시글 삭제 오류:", err);
      toast.error("게시글 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    const comment = post.comments.find((c) => c.id === commentId);

    if (comment?.isAccepted) {
      toast.error(
        "채택된 답변은 삭제할 수 없습니다.\n채택을 취소한 후 삭제해주세요.",
        {
          duration: 5000,
          icon: "⚠️",
          style: {
            background: "#fff",
            color: "#333",
            border: "1px solid #e5e7eb",
            padding: "1rem",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            whiteSpace: "pre-line",
          },
        }
      );
      return;
    }

    if (!confirm("정말로 댓글을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/comment/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        setPost((prev) => ({
          ...prev,
          comments: prev.comments.filter((c) => c.id !== commentId),
        }));
        toast.success("댓글이 삭제되었습니다.");
      } else {
        toast.error(data.message || "댓글 삭제에 실패했습니다.");
      }
    } catch (err) {
      console.error("댓글 삭제 실패:", err);
      toast.error("댓글 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleAcceptClick = (commentId) => {
    setSelectedCommentId(commentId);
    setShowAcceptModal(true);
  };

  const handleAcceptConfirm = async () => {
    try {
      const response = await fetch(
        `/api/post/${id}/comment/${selectedCommentId}/accept`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();
      if (data.success) {
        setPost((prev) => ({
          ...prev,
          isAccepted: true,
          comments: prev.comments.map((comment) =>
            comment.id === selectedCommentId
              ? { ...comment, isAccepted: true }
              : comment
          ),
        }));
        toast.success("답변이 채택되었습니다.");
      } else {
        toast.error(data.message || "답변 채택에 실패했습니다.");
      }
    } catch (error) {
      console.error("답변 채택 오류:", error);
      toast.error("답변 채택 중 오류가 발생했습니다.");
    } finally {
      setShowAcceptModal(false);
      setSelectedCommentId(null);
    }
  };

  const handleReplySubmit = async (parentId) => {
    if (!user) {
      toast.error("답글을 작성하시려면 로그인이 필요합니다.");
      return;
    }
    if (!replyText.trim()) {
      toast.error("답글 내용을 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("/api/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: replyText,
          postId: id,
          parentId: parentId,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "답글 작성에 실패했습니다.");
        return;
      }

      setPost((prev) => ({
        ...prev,
        comments: prev.comments.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [data.comment, ...(comment.replies || [])],
            };
          }
          return comment;
        }),
      }));
      setReplyText("");
      setReplyingTo(null);
    } catch (err) {
      console.error("답글 작성 실패:", err);
      toast.error("답글 작성 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500">게시글을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 뱃지 획득 알림 */}
        <AnimatePresence>
          {showBadgeAlert && earnedBadges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
            >
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="font-bold text-lg text-green-600 mb-2">
                  축하합니다! 🎉
                </h3>
                <div className="space-y-4">
                  {earnedBadges.map((badge) => (
                    <div key={badge.id} className="flex items-center gap-4">
                      <img
                        src={badge.imageUrl}
                        alt={badge.name}
                        className="w-12 h-12"
                      />
                      <div>
                        <p className="text-gray-700">
                          {badge.name} 뱃지를 획득했습니다!
                        </p>
                        <p className="text-sm text-gray-500">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 게시글 내용 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          {/* 게시글 헤더 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  post.category === "매물 질문"
                    ? "bg-green-100 text-green-800"
                    : post.category === "계약/법률"
                    ? "bg-purple-100 text-purple-800"
                    : post.category === "신축/분양"
                    ? "bg-orange-100 text-orange-800"
                    : post.category === "동네 이야기"
                    ? "bg-yellow-100 text-yellow-800"
                    : post.category === "공인중개사에게 묻기"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {post.category}
              </span>
              {post.isAgentOnly && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  공인중개사 전용
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>

            {/* 게시글 메타 정보 */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {post.author?.profileImage ? (
                    <img
                      src={post.author.profileImage}
                      alt={post.author.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <UserCircle className="w-8 h-8 text-gray-400" />
                  )}
                  <div>
                    <span className="font-medium text-gray-900">
                      {post.author?.nickname || post.author?.name || "익명"}
                    </span>
                    <span className="ml-2 text-gray-500">
                      [레벨:{post.author?.rank || 1}]
                    </span>
                  </div>
                </div>
                <span>
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{post.views}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post._count?.comments || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{post._count?.likes || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 게시글 내용 */}
          <div className="prose max-w-none mb-6">{post.content}</div>

          {/* 게시글 푸터 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  post.isLiked
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <span>좋아요</span>
                <span>{post._count.likes}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm">링크복사</span>
              </button>
            </div>
            {user && post.author && user.id === post.author.id && (
              <button
                onClick={handleDeletePost}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                삭제
              </button>
            )}
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">
            댓글 {post._count?.comments || 0}
          </h2>

          {/* 댓글 작성 폼 */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">댓글</h3>
            {user ? (
              <form onSubmit={handleSubmit} className="mb-8">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="댓글을 입력해주세요"
                  className="w-full p-4 border rounded-lg mb-4"
                  rows={4}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  댓글 작성
                </button>
              </form>
            ) : (
              <div className="p-4 bg-gray-100 rounded-lg mb-8">
                <p className="text-gray-600">
                  댓글을 작성하시려면{" "}
                  <Link href="/login" className="text-blue-600 hover:underline">
                    로그인
                  </Link>
                  이 필요합니다.
                </p>
              </div>
            )}
          </div>

          {/* 댓글 목록 */}
          <div className="space-y-6">
            {post.comments.map((comment) => (
              <div
                key={comment.id}
                className={`bg-white rounded-xl shadow-sm p-6 ${
                  comment.isAccepted ? "border-2 border-green-500" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {comment.author?.profileImage ? (
                        <img
                          src={comment.author.profileImage}
                          alt={comment.author.name}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <UserCircle className="w-6 h-6 text-gray-400" />
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {comment.author?.role === "AGENT"
                            ? comment.author?.agent?.officeName
                            : comment.author?.nickname || comment.author?.name}
                        </span>
                        {comment.author?.role === "AGENT" ? (
                          <BadgeCheck className="w-4 h-4 text-blue-500" />
                        ) : (
                          <span
                            className={`text-sm ${
                              comment.author?.rank === "DIAMOND"
                                ? "text-purple-500"
                                : comment.author?.rank === "PLATINUM"
                                ? "text-blue-400"
                                : comment.author?.rank === "GOLD"
                                ? "text-yellow-500"
                                : comment.author?.rank === "SILVER"
                                ? "text-gray-400"
                                : "text-amber-600"
                            }`}
                          >
                            {comment.author?.rank === "DIAMOND"
                              ? "💎"
                              : comment.author?.rank === "PLATINUM"
                              ? "✨"
                              : comment.author?.rank === "GOLD"
                              ? "⭐"
                              : comment.author?.rank === "SILVER"
                              ? "⚪"
                              : "🟤"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                    {user && user.id === comment.authorId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-gray-700">{comment.content}</div>

                {/* 채택 버튼 */}
                {user &&
                  user.id === post.authorId &&
                  !post.isAccepted &&
                  !comment.isAccepted && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleAcceptClick(comment.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>답변 채택하기</span>
                      </button>
                    </div>
                  )}

                {/* 채택된 경우 표시 */}
                {comment.isAccepted && (
                  <div className="mt-4 flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">채택된 답변</span>
                  </div>
                )}

                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 pl-8 border-l-2 border-gray-200">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="mb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {reply.author?.profileImage ? (
                              <img
                                src={reply.author.profileImage}
                                alt={reply.author.name}
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <UserCircle className="w-6 h-6 text-gray-400" />
                            )}
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {reply.author?.role === "AGENT"
                                  ? reply.author?.agent?.officeName
                                  : reply.author?.nickname ||
                                    reply.author?.name}
                              </span>
                              {reply.author?.role === "AGENT" ? (
                                <BadgeCheck className="w-4 h-4 text-blue-500" />
                              ) : (
                                <span
                                  className={`text-sm ${
                                    reply.author?.rank === "DIAMOND"
                                      ? "text-purple-500"
                                      : reply.author?.rank === "PLATINUM"
                                      ? "text-blue-400"
                                      : reply.author?.rank === "GOLD"
                                      ? "text-yellow-500"
                                      : reply.author?.rank === "SILVER"
                                      ? "text-gray-400"
                                      : "text-amber-600"
                                  }`}
                                >
                                  {reply.author?.rank === "DIAMOND"
                                    ? "💎"
                                    : reply.author?.rank === "PLATINUM"
                                    ? "✨"
                                    : reply.author?.rank === "GOLD"
                                    ? "⭐"
                                    : reply.author?.rank === "SILVER"
                                    ? "⚪"
                                    : "🟤"}
                                </span>
                              )}
                            </div>
                          </div>
                          {user && user.id === reply.authorId && (
                            <button
                              onClick={() => handleDeleteComment(reply.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                        <div className="text-gray-700 mt-2">
                          {reply.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {user && (
                  <div className="mt-4">
                    {replyingTo === comment.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="답글을 입력하세요..."
                          className="flex-1 p-2 border rounded"
                        />
                        <button
                          onClick={() => handleReplySubmit(comment.id)}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          작성
                        </button>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        답글 작성
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 채택 확인 모달 */}
        {showAcceptModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4">답변 채택</h3>
              <p className="text-gray-600 mb-6">
                이 답변을 채택하시겠습니까? 채택 후에는 취소할 수 없습니다.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAcceptModal(false);
                    setSelectedCommentId(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  취소
                </button>
                <button
                  onClick={handleAcceptConfirm}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  채택하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

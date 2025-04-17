"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ImagePlus, PencilLine, UploadCloud } from "lucide-react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

export default function CommunityWritePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!title || !content) {
      Swal.fire({
        icon: "warning",
        title: "입력 누락",
        text: "제목과 내용을 모두 입력해주세요.",
      });
      return;
    }

    try {
      // 로그인 유저 정보 가져오기
      const authRes = await fetch("/api/auth/me", { credentials: "include" });
      const authData = await authRes.json();

      if (!authRes.ok || !authData.user) {
        Swal.fire({
          icon: "info",
          title: "로그인이 필요합니다.",
          text: "글 작성은 로그인 후 이용하실 수 있습니다.",
        });
        return;
      }

      const res = await fetch("/api/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          imageUrl: "", // 이미지 업로드 기능 미구현
          category: "잡담",
          authorId: authData.user.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("🎉 게시글이 등록되었습니다!");
        router.push("/community");
      } else {
        Swal.fire({
          icon: "error",
          title: "저장 실패",
          text: data.message || "서버 오류가 발생했습니다.",
        });
      }
    } catch (err) {
      console.error("저장 오류:", err);
      Swal.fire({
        icon: "error",
        title: "요청 실패",
        text: "서버와 연결에 실패했습니다.",
      });
    }
  };

  return (
    <motion.div
      className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-lg space-y-6 border"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="bg-green-50 text-green-800 px-6 py-4 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <PencilLine /> 글을 남겨주세요
        </h2>
        <p className="text-sm mt-1 text-gray-600">
          소소한 집 이야기부터 동네 자랑까지 💬
          <br />
          진주 부동산과 관련된 이야기를 자유롭게 남겨주세요.
        </p>
      </div>

      <input
        type="text"
        placeholder="제목을 입력해주세요"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-300"
      />

      <textarea
        placeholder="내용을 따뜻하게 적어주세요 ✍️"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-48 border rounded-md p-4 resize-none focus:outline-none focus:ring-2 focus:ring-green-300"
      ></textarea>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-gray-700 font-medium">
          <ImagePlus size={18} /> 사진 업로드 (선택)
        </label>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {preview && (
          <img
            src={preview}
            alt="미리보기"
            className="w-full rounded-lg mt-2 shadow"
          />
        )}
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition"
      >
        <UploadCloud className="inline-block mr-2" size={18} /> 게시글 등록
      </button>
    </motion.div>
  );
}

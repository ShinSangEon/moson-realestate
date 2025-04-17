"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ReportViewer from "@/components/ReportViewer";

export default function ReportPageClient({ apt }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkReport = async () => {
      try {
        // 보고서 정보 조회
        const reportRes = await fetch(
          `/api/reports?complexUniqueId=${apt.complexUniqueId}`
        );

        if (reportRes.status === 404) {
          setError("보고서가 아직 준비되지 않았습니다.");
          return;
        }

        if (!reportRes.ok) {
          throw new Error("보고서를 불러올 수 없습니다.");
        }

        const reportData = await reportRes.json();

        if (!reportData) {
          setError("보고서 데이터가 없습니다.");
          return;
        }

        setReport(reportData);

        // 결제 여부 확인
        const paymentRes = await fetch(
          `/api/payments?reportId=${reportData.id}`
        );
        if (paymentRes.ok) {
          const paymentData = await paymentRes.json();
          setIsPurchased(paymentData.status === "completed");
        }
      } catch (error) {
        console.error("보고서 조회 오류:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    checkReport();
  }, [apt.complexUniqueId]);

  const handlePurchase = async () => {
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportId: report.id,
          amount: report.price,
          method: "card", // 실제로는 결제 수단 선택 UI가 필요
        }),
      });

      if (!response.ok) {
        throw new Error("결제에 실패했습니다.");
      }

      toast.success("결제가 완료되었습니다!");
      setIsPurchased(true);
    } catch (error) {
      console.error("결제 오류:", error);
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{error}</h1>
          <p className="text-gray-600">
            해당 아파트의 분석 보고서가 아직 준비되지 않았습니다.
            <br />
            조금만 기다려주세요.
          </p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            보고서가 아직 준비되지 않았습니다.
          </h1>
          <p className="text-gray-600">
            해당 아파트의 분석 보고서가 아직 준비되지 않았습니다.
            <br />
            조금만 기다려주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {apt.complexNameBuilding} 분석 보고서
        </h1>
        <p className="text-gray-600">{apt.address}</p>
      </div>

      {!isPurchased ? (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            보고서 구매하기
          </h2>
          <p className="text-gray-600 mb-4">
            이 보고서는 전문가가 작성한 상세 분석 자료입니다.
            <br />
            가격: {report.price.toLocaleString()}원
          </p>
          <button
            onClick={handlePurchase}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            구매하기
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            보고서 내용
          </h2>
          <ReportViewer fileUrl={report.fileUrl} />
        </div>
      )}
    </div>
  );
}

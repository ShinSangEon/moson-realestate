import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyLicenseFromAPI } from "@/lib/verifyLicense";
import bcrypt from "bcryptjs";

export async function POST(request) {
  let matchedLicenseData = null;

  try {
    const body = await request.json();
    console.log("회원가입 요청 데이터:", body);

    const {
      officeName,
      agentName,
      licenseNumber,
      email,
      password,
      confirmPassword,
      name,
      phoneNumber,
      profileImage,
      role,
      officeAddress,
    } = body;

    // 입력값 검증
    if (email.length < 5 || password.length < 8) {
      return NextResponse.json(
        { error: "아이디는 5자 이상, 비밀번호는 8자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    // 비밀번호 확인 검사
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "비밀번호와 비밀번호 확인이 일치하지 않습니다." },
        { status: 400 }
      );
    }

    // 공인중개사인 경우 추가 검증
    if (role === "agent") {
      // 1. 자격번호 유효성 검사 (공인중개사 API 조회)
      const licenseData = await verifyLicenseFromAPI(officeName, agentName);
      console.log("자격증 검증 결과:", licenseData);

      // 디버깅용 로그 추가
      console.log("입력값:", {
        agentName,
        officeName,
        licenseNumber,
      });
      console.log("API 응답 첫 항목:", licenseData[0]);

      // 정확하게 일치하는 항목 찾기 (공백과 대소문자 무시)
      matchedLicenseData = licenseData.find(
        (item) =>
          item.agentName.trim().toLowerCase() ===
            agentName.trim().toLowerCase() &&
          item.officeName.trim().toLowerCase() ===
            officeName.trim().toLowerCase() &&
          item.licenseNumber.trim().toLowerCase() ===
            licenseNumber.trim().toLowerCase()
      );

      if (!matchedLicenseData) {
        console.log("매칭된 자격증 정보 없음");
        return NextResponse.json(
          { error: "자격증 정보가 확인되지 않습니다." },
          { status: 400 }
        );
      }

      console.log("매칭된 자격증 정보:", matchedLicenseData);

      // 2. 자격번호 중복 검사
      const existingAgent = await prisma.agent.findUnique({
        where: { licenseNumber },
      });

      if (existingAgent) {
        return NextResponse.json(
          { error: "이미 등록된 자격번호입니다. 다른 번호를 입력해주세요." },
          { status: 400 }
        );
      }
    }

    // 3. 이메일 중복 검사
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "이미 등록된 이메일입니다." },
        { status: 400 }
      );
    }

    // 공인중개사인 경우 Agent 테이블에서도 이메일 중복 검사
    if (role === "agent") {
      const existingAgent = await prisma.agent.findUnique({
        where: { email },
      });

      if (existingAgent) {
        return NextResponse.json(
          { error: "해당 이메일은 이미 공인중개사로 등록되어 있습니다." },
          { status: 400 }
        );
      }
    }

    // 4. 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. 가입 진행
    try {
      console.log("사용자 생성 시작:", {
        email,
        name,
        phoneNumber,
        profileImage: profileImage || "/default-profile.png",
        role,
      });

      // User 생성
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phoneNumber,
          profileImage: profileImage || "/default-profile.png",
          role,
        },
      });

      console.log("사용자 생성 완료:", newUser);

      // 공인중개사인 경우 Agent 정보도 생성
      if (role === "agent") {
        const agent = await prisma.agent.create({
          data: {
            email: newUser.email,
            officeName,
            officeAddress: matchedLicenseData.officeAddress,
            licenseNumber,
            user: {
              connect: { id: newUser.id },
            },
          },
        });

        console.log("Agent 생성 완료:", agent);
      }

      return NextResponse.json({
        message: "가입 완료",
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      });
    } catch (error) {
      console.error("사용자 생성 오류:", error);
      if (error.code === "P2002") {
        // Prisma unique constraint violation
        return NextResponse.json(
          { error: "이미 등록된 이메일 또는 자격번호입니다." },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("회원가입 오류:", error);
    return NextResponse.json(
      { error: "회원가입 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

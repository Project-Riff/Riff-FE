import { GoogleGenAI } from "@google/genai";
import { getJob, patchJob, pushJobLog } from "./job-store";

export async function generateInstagramCaption(jobId: string): Promise<string> {
  console.log(`[InstagramCaption] Starting for job=${jobId}`);

  try {
    return await runInstagramCaption(jobId);
  } catch (error) {
    await pushJobLog(
      jobId,
      "done",
      100,
      `인스타그램 본문 생성 실패: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    throw error;
  }
}

async function runInstagramCaption(jobId: string): Promise<string> {
  const job = await getJob(jobId);
  if (!job) throw new Error("Job not found");

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY가 없습니다.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const menuName = job.artifacts?.menuName?.trim() || "맛집";
  const address = job.storeInfo?.address?.trim() || "";
  const subtitle = job.storeInfo?.subtitle?.trim() || "";
  const strengths = job.storeInfo?.strengths?.trim() || "";
  const narration = job.analysis?.narration?.trim() || "";

  const promptText = `
당신은 한국의 맛집 인스타그램 인플루언서입니다. 아래 매장 정보와 영상 내레이션을 바탕으로, 예시 포맷과 똑같은 톤·구조·이모지 사용으로 인스타그램 본문을 작성하세요.

[매장 정보]
- 메뉴/음식: ${menuName}
- 주소: ${address || "(미입력)"}
- 컨셉/부제: ${subtitle || "(미입력)"}
- 가게 특장점: ${strengths || "(미입력)"}

[영상 내레이션]
${narration || "(없음)"}

[예시 포맷 — 이 흐름/톤/이모지 사용/문장 길이를 그대로 모방]

누가 참치 사준다고 하면 무조건 여기입니다. 🐟
친구 반응 제대로 터지는 참치 맛집

📍#참치

입안에서 사르르 녹는 참치 뱃살에 소주 한 잔 걸치니까 미쳤다 .. 🤤
해동 완벽하고 기름기 꽉 찬 참치 퀄리티가 진짜 미친놈입니다. 신선함이 남달라요.
저는 김에 참치 싸서 제대로 조졌는데, 혀에 감기는 녹진한 맛 때문에 술을 안 시킬 수가 없는 맛임 ..

참치 한 점에 소주 한 잔? 이건 못 참지 🍶
오늘 제대로 된 고급 안주 때리고 싶은 형들은 당장 여기로 달려가세요! 🫶🏻

최고급 부위만 엄선해 내어주는 사장님의 자부심이 담긴 곳 🇰🇷
지친 퇴근길에 힐링을 선물할 아지트 같은 공간입니다!

📍(상세 주소 입력)
⏰ (영업 시간 및 휴무일)

#참치 #참치맛집 #참치회 #강서구참치 #화곡동참치 #술집추천 #안주맛집 #먹스타그램 #소주도둑

[작성 규칙]
- 위 예시와 동일한 단락 구조를 그대로 유지:
  (1) 첫 훅 한 문장 + 캐치프레이즈 한 문장
  (2) "📍#${menuName.replace(/\s+/g, "")}" 한 줄
  (3) 맛/식감/경험 묘사 단락 (2~3문장)
  (4) 짧은 권유 + CTA 단락 (2문장)
  (5) 매장/공간 분위기 묘사 단락 (2문장)
  (6) "📍(상세 주소 입력)" 줄 + "⏰ (영업 시간 및 휴무일)" 줄
  (7) 해시태그 한 줄
- 단락 사이는 빈 줄로 구분. 줄바꿈은 예시 그대로 모방.
- 한국어 인스타 구어체. 짧은 문장. 친구한테 추천하듯 친근하게. 슬랭/감탄("미쳤다", "조졌다", "녹진한", "사르르", "꽉 찬", "이건 못 참지" 등) 적절히 사용.
- 이모지 6~10개 적절히 배치 (음식/감정/공간 어울리는 것).
- 메뉴 "${menuName}"을 본문 곳곳에 자연스럽게 녹여서 반복.
- 주소·영업시간 줄은 반드시 "(상세 주소 입력)", "(영업 시간 및 휴무일)" placeholder 그대로 출력. 실제 주소/시간을 채우지 말 것.
- 마지막 해시태그 줄은 8~10개. 메뉴/카테고리/지역 조합. 지역 해시태그는 주소에서 시·구·동을 뽑아 "#XX구${menuName}", "#XX동${menuName}" 형태로. 주소가 없으면 일반 해시태그만.
- 출력은 본문 텍스트만. 머리말, 설명, 코드블록, 따옴표 감싸기 금지.
`;

  let caption = "";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ text: promptText }],
    });

    caption = (response.text || "").trim();
  } catch (error) {
    console.error("[InstagramCaption] Gemini call failed:", error);
    throw error;
  }

  if (!caption) {
    throw new Error("Gemini returned empty caption");
  }

  const cleaned = caption
    .replace(/^```[a-zA-Z]*\n?/g, "")
    .replace(/```$/g, "")
    .trim();

  console.log(
    `[InstagramCaption] Generated (${cleaned.length} chars): ${cleaned.slice(0, 80)}...`,
  );

  await patchJob(jobId, {
    artifacts: {
      instagramCaption: cleaned,
    },
  });

  await pushJobLog(jobId, "done", 100, "인스타그램 본문 생성 완료");

  return cleaned;
}

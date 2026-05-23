export type DiagnosisTopic = {
  id: string;
  trigger: string;
  title: string;
  summary: string;
  likelyCauses: string[];
  firstChecks: string[];
  whenToCall: string;
  ctaLabel: string;
  ctaHref: string;
};

export const diagnosisTopics: DiagnosisTopic[] = [
  {
    id: "stiff-door",
    trigger: "문이 좀 뻑뻑해요",
    title: "문이 뻑뻑하거나 잘 안 닫힐 때",
    summary: "문 자체보다 문틀, 경첩, 바닥 쓸림, 잠금장치 정렬 문제인 경우가 많습니다.",
    likelyCauses: ["경첩 처짐", "문틀 변형", "바닥 쓸림", "도어락 또는 래치 정렬 문제"],
    firstChecks: ["문이 닿는 위치가 한쪽인지 확인", "경첩 나사가 풀렸는지 확인", "바닥과 문 하단 간격을 확인"],
    whenToCall: "문을 억지로 닫아야 하거나 문틀이 벌어져 보이면 조정이 필요합니다.",
    ctaLabel: "문수리 상담으로 이어가기",
    ctaHref: "/service/door"
  },
  {
    id: "leak-stain",
    trigger: "물이 샌다",
    title: "물자국이나 누수가 보일 때",
    summary: "보이는 위치와 실제 원인이 다른 경우가 많아 배관, 방수, 마감 상태를 함께 봐야 합니다.",
    likelyCauses: ["배관 누수", "욕실 방수 손상", "실리콘 틈", "상부/인접 세대 영향"],
    firstChecks: ["물자국이 번지는 방향 확인", "비 온 뒤인지, 샤워 후인지 확인", "전기기구 주변이면 사용을 멈춤"],
    whenToCall: "천장이나 벽지가 젖거나 계속 번지면 즉시 상담이 필요합니다.",
    ctaLabel: "누수 수리 상담으로 이어가기",
    ctaHref: "/service/leak"
  },
  {
    id: "peeling-wallpaper",
    trigger: "벽지가 들뜬다",
    title: "벽지 들뜸이나 얼룩이 보일 때",
    summary: "습기나 누수, 오래된 접착력 약화가 원인일 수 있어 바탕면부터 확인해야 합니다.",
    likelyCauses: ["누수 후 건조 불량", "습기", "기존 벽지 접착력 약화", "바탕면 손상"],
    firstChecks: ["들뜬 범위가 한 군데인지 확인", "벽이 차갑거나 축축한지 확인", "최근 누수/결로 여부를 기억"],
    whenToCall: "얼룩이 다시 올라오거나 냄새가 나면 원인 점검이 우선입니다.",
    ctaLabel: "도배 상담으로 이어가기",
    ctaHref: "/service/wallpaper"
  },
  {
    id: "broken-tile",
    trigger: "타일이 깨졌다",
    title: "타일 파손이나 줄눈 문제가 있을 때",
    summary: "타일만 교체하면 끝나는 경우도 있지만, 아래 방수층이나 접착 상태까지 봐야 할 때가 있습니다.",
    likelyCauses: ["충격 파손", "하자 발생", "줄눈 손상", "방수층 문제"],
    firstChecks: ["파손된 조각이 더 흔들리는지 확인", "줄눈이 같이 갈라졌는지 확인", "주변 타일도 들뜨는지 확인"],
    whenToCall: "깨진 조각이 날카롭거나 물이 스며들면 빠르게 보수해야 합니다.",
    ctaLabel: "욕실 수리 상담으로 이어가기",
    ctaHref: "/service/bathroom"
  },
  {
    id: "mold-smell",
    trigger: "곰팡이가 생겼다",
    title: "곰팡이와 냄새가 반복될 때",
    summary: "단순 청소로 끝나지 않고 환기, 결로, 방수, 누수 여부를 같이 봐야 재발을 줄일 수 있습니다.",
    likelyCauses: ["결로", "환기 부족", "잔수/배수 문제", "숨은 누수"],
    firstChecks: ["생기는 계절과 시간을 기록", "창문 주변과 욕실 천장을 확인", "냄새가 강해지는 곳을 체크"],
    whenToCall: "같은 위치에 반복되면 표면 문제가 아니라 원인 해결이 필요합니다.",
    ctaLabel: "방수/수리 상담으로 이어가기",
    ctaHref: "/estimate"
  },
  {
    id: "drain-trouble",
    trigger: "수전·배수가 불편하다",
    title: "수전이나 배수가 답답할 때",
    summary: "수전, 배수 부속, 호스, 하부장 상태를 같이 봐야 냄새와 물 고임을 줄일 수 있습니다.",
    likelyCauses: ["배수 부속 노후", "호스/트랩 문제", "수전 누수", "하부장 습기"],
    firstChecks: ["물 빠지는 속도 확인", "하부장 내부가 젖었는지 확인", "악취가 배수구에서 나는지 확인"],
    whenToCall: "냄새가 나거나 하부장 안쪽이 젖으면 부속 점검이 필요합니다.",
    ctaLabel: "주방/배수 상담으로 이어가기",
    ctaHref: "/estimate"
  }
];

export function getDiagnosisTopicByTrigger(trigger?: string | null) {
  if (!trigger) return diagnosisTopics[0];
  const normalized = trigger.trim();
  return diagnosisTopics.find((topic) => topic.trigger === normalized || topic.id === normalized) ?? diagnosisTopics[0];
}


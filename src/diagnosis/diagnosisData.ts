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
  // 문·창문
  {
    id: "stiff-door",
    trigger: "문이 뻑뻑해요",
    title: "문이 뻑뻑하거나 잘 안 닫힐 때",
    summary: "문 자체보다 문틀, 경첩, 바닥 쓸림, 잠금장치 정렬 문제인 경우가 많습니다.",
    likelyCauses: ["경첩 처짐", "문틀 변형", "바닥 쓸림", "도어락 또는 래치 정렬 문제"],
    firstChecks: ["문이 닿는 위치가 한쪽인지 확인", "경첩 나사가 풀렸는지 확인", "바닥과 문 하단 간격을 확인"],
    whenToCall: "문을 억지로 닫아야 하거나 문틀이 벌어져 보이면 조정이 필요합니다.",
    ctaLabel: "문 수리 상담으로 이어가기",
    ctaHref: "/service/door"
  },
  {
    id: "door-squeak",
    trigger: "삐걱 소리가 나요",
    title: "문을 열고 닫을 때 삐걱 소리가 날 때",
    summary: "경첩 마모나 윤활 부족이 원인인 경우가 많아 간단한 조치로 해결되기도 합니다.",
    likelyCauses: ["경첩 윤활 부족", "경첩 핀 마모", "문틀·문짝 틀어짐"],
    firstChecks: ["소리가 나는 경첩 위치를 특정", "경첩 나사가 헐거운지 확인", "문을 천천히 열어 어느 각도에서 소리 나는지 확인"],
    whenToCall: "윤활 후에도 소리가 반복되거나 경첩이 흔들리면 교체가 필요합니다.",
    ctaLabel: "문 수리 상담으로 이어가기",
    ctaHref: "/service/door"
  },
  {
    id: "door-draft",
    trigger: "틈으로 바람이 들어와요",
    title: "문·창문 틈으로 바람이나 빛이 새어 들어올 때",
    summary: "문틀 뒤틀림이나 도어 실(seal) 노후화가 원인인 경우가 많습니다.",
    likelyCauses: ["도어 패킹·실 마모", "문틀 뒤틀림", "경첩 느슨함으로 인한 문 처짐"],
    firstChecks: ["빛이 새는 위치(위·아래·옆)를 확인", "문을 닫고 손으로 바람 방향 확인", "창호 잠금 레버가 단단히 잠기는지 확인"],
    whenToCall: "단열재 보강이나 문틀 조정이 필요한 경우 전문가 점검이 빠릅니다.",
    ctaLabel: "문 수리 상담으로 이어가기",
    ctaHref: "/service/door"
  },
  {
    id: "doorlock",
    trigger: "도어락이 오작동해요",
    title: "도어락이 잘 안 열리거나 오류가 반복될 때",
    summary: "배터리 방전, 오염, 모터 고장 순서로 원인을 확인하는 게 빠릅니다.",
    likelyCauses: ["배터리 방전", "버튼·센서 오염", "내부 모터 또는 래치 고장"],
    firstChecks: ["배터리를 먼저 교체해 보기", "키패드 표면을 마른 천으로 닦기", "비상키로 작동 여부 확인"],
    whenToCall: "배터리 교체 후에도 오류가 반복되면 도어락 교체 시점입니다.",
    ctaLabel: "문 수리 상담으로 이어가기",
    ctaHref: "/service/door"
  },

  // 물·누수
  {
    id: "leak-stain",
    trigger: "천장·벽에 물자국이 생겼어요",
    title: "물자국이나 누수가 보일 때",
    summary: "보이는 위치와 실제 원인이 다른 경우가 많아 배관, 방수, 마감 상태를 함께 봐야 합니다.",
    likelyCauses: ["배관 누수", "욕실 방수 손상", "실리콘 틈", "상부·인접 세대 영향"],
    firstChecks: ["물자국이 번지는 방향 확인", "비 온 뒤인지, 샤워 후인지 확인", "전기기구 주변이면 사용을 멈춤"],
    whenToCall: "천장이나 벽지가 젖거나 계속 번지면 즉시 상담이 필요합니다.",
    ctaLabel: "누수 수리 상담으로 이어가기",
    ctaHref: "/service/leak"
  },
  {
    id: "pipe-leak",
    trigger: "배관에서 물이 새요",
    title: "배관에서 물이 떨어지거나 젖어 있을 때",
    summary: "눈에 보이는 누수는 빠르게 조치해야 2차 피해(곰팡이, 전기)를 막을 수 있습니다.",
    likelyCauses: ["연결부 패킹 손상", "배관 노후·균열", "진동으로 인한 이음새 느슨함"],
    firstChecks: ["어느 배관인지(급수·온수·배수) 확인", "물이 떨어지는 속도 파악", "하부장 내부나 천장 점검구 확인"],
    whenToCall: "물이 뚝뚝 떨어지거나 바닥이 젖기 시작하면 바로 연락하세요.",
    ctaLabel: "누수 상담으로 이어가기",
    ctaHref: "/service/leak"
  },
  {
    id: "toilet-run",
    trigger: "변기 물이 계속 흘러요",
    title: "변기에서 물이 저절로 계속 내려갈 때",
    summary: "수도요금이 올라가는 원인 1순위입니다. 대부분 내부 부품 교체로 해결됩니다.",
    likelyCauses: ["플래퍼(볼탑) 밸브 마모", "수위 조절 부속 고장", "변기 내부 부속 노후"],
    firstChecks: ["탱크 뚜껑을 열어 물 흐르는 위치 확인", "수면이 오버플로 파이프를 넘는지 확인"],
    whenToCall: "흐름이 멈추지 않으면 수도 요금이 급격히 올라가므로 빠른 점검이 필요합니다.",
    ctaLabel: "설비 수리 상담으로 이어가기",
    ctaHref: "/service/plumbing"
  },
  {
    id: "low-pressure",
    trigger: "수압이 갑자기 약해졌어요",
    title: "샤워나 수전 수압이 갑자기 약해졌을 때",
    summary: "필터 막힘, 밸브 잠김, 배관 문제 순으로 확인하면 대부분 원인을 찾을 수 있습니다.",
    likelyCauses: ["샤워헤드·수전 필터 이물질", "지수 밸브 부분 잠김", "배관 내 스케일 퇴적", "세대 전체 배관 문제"],
    firstChecks: ["샤워헤드를 분리해 필터 청소", "세면대·주방 등 다른 곳도 수압 약한지 비교", "이웃 세대도 같은 상황인지 확인"],
    whenToCall: "집 전체 수압이 낮고 이웃도 정상이면 배관 점검이 필요합니다.",
    ctaLabel: "설비 수리 상담으로 이어가기",
    ctaHref: "/service/plumbing"
  },

  // 벽·바닥·천장
  {
    id: "peeling-wallpaper",
    trigger: "벽지가 들뜨거나 얼룩이 생겼어요",
    title: "벽지 들뜸이나 얼룩이 보일 때",
    summary: "습기나 누수, 오래된 접착력 약화가 원인일 수 있어 바탕면부터 확인해야 합니다.",
    likelyCauses: ["누수 후 건조 불량", "습기", "기존 벽지 접착력 약화", "바탕면 손상"],
    firstChecks: ["들뜬 범위가 한 군데인지 확인", "벽이 차갑거나 축축한지 확인", "최근 누수·결로 여부를 기억"],
    whenToCall: "얼룩이 다시 올라오거나 냄새가 나면 원인 점검이 우선입니다.",
    ctaLabel: "도배 상담으로 이어가기",
    ctaHref: "/service/wallpaper"
  },
  {
    id: "broken-tile",
    trigger: "타일이 깨지거나 줄눈이 갈라졌어요",
    title: "타일 파손이나 줄눈 문제가 있을 때",
    summary: "타일만 교체하면 끝나는 경우도 있지만, 아래 방수층이나 접착 상태까지 봐야 할 때가 있습니다.",
    likelyCauses: ["충격 파손", "하자 발생", "줄눈 손상", "방수층 문제"],
    firstChecks: ["파손된 조각이 더 흔들리는지 확인", "줄눈이 같이 갈라졌는지 확인", "주변 타일도 들뜨는지 확인"],
    whenToCall: "깨진 조각이 날카롭거나 물이 스며들면 빠르게 보수해야 합니다.",
    ctaLabel: "타일 수리 상담으로 이어가기",
    ctaHref: "/service/tile"
  },
  {
    id: "floor-creak",
    trigger: "바닥재가 들뜨거나 삐걱거려요",
    title: "바닥재가 들뜨거나 걸을 때 소리가 날 때",
    summary: "접착 불량, 습기 유입, 마루 수축·팽창이 주요 원인입니다.",
    likelyCauses: ["습기로 인한 마루 팽창", "접착제 노후", "하부 구조 문제"],
    firstChecks: ["소리 나는 위치를 특정", "들뜬 가장자리가 있는지 확인", "주변에 누수 흔적 여부 확인"],
    whenToCall: "범위가 넓거나 하부에 습기가 있으면 전면 교체가 필요할 수 있습니다.",
    ctaLabel: "바닥재 수리 상담으로 이어가기",
    ctaHref: "/service/wallpaper-floor"
  },
  {
    id: "ceiling-crack",
    trigger: "천장에 금이 가거나 내려앉아요",
    title: "천장에 균열이 생기거나 마감재가 처질 때",
    summary: "위층 누수, 건물 침하, 마감재 노후 등 원인이 다양하며 방치하면 낙하 위험이 생깁니다.",
    likelyCauses: ["위층 누수로 인한 팽창·처짐", "건물 자체 침하·균열", "천장 마감재 접착 노후"],
    firstChecks: ["균열이 직선인지 방사형인지 확인", "천장을 눌러 탄력 여부 확인", "위층 화장실·욕실 위치와 겹치는지 확인"],
    whenToCall: "마감재가 내려앉거나 물이 맺히면 즉시 상담이 필요합니다.",
    ctaLabel: "누수·수리 상담으로 이어가기",
    ctaHref: "/service/leak"
  },

  // 전기
  {
    id: "light-flicker",
    trigger: "조명이 깜빡이거나 안 켜져요",
    title: "조명이 깜빡이거나 켜지지 않을 때",
    summary: "전구 수명, 접촉 불량, 배선 문제 순서로 확인하면 대부분 원인을 찾을 수 있습니다.",
    likelyCauses: ["전구 수명 종료", "소켓 접촉 불량", "스위치 내부 접점 문제", "배선 노후"],
    firstChecks: ["전구를 먼저 교체해 보기", "다른 조명도 같은 증상인지 확인", "스위치를 껐다 켰을 때 변화 확인"],
    whenToCall: "여러 조명이 동시에 깜빡이거나 차단기가 함께 내려가면 배선 점검이 필요합니다.",
    ctaLabel: "전기 수리 상담으로 이어가기",
    ctaHref: "/service/electric"
  },
  {
    id: "breaker-trip",
    trigger: "차단기가 자꾸 내려가요",
    title: "차단기가 반복해서 내려갈 때",
    summary: "과부하·누전·단락 중 원인을 빠르게 파악해야 안전하게 복구할 수 있습니다.",
    likelyCauses: ["과부하 (고전력 가전 동시 사용)", "누전", "배선 단락", "차단기 자체 노후"],
    firstChecks: ["어느 회로 차단기가 내려가는지 확인", "고전력 기기(에어컨·전기레인지 등) 일부 분리 후 복구 시도", "차단기 복구 후 냄새 여부 확인"],
    whenToCall: "복구해도 바로 내려가거나 탄 냄새가 나면 즉시 전기 점검이 필요합니다.",
    ctaLabel: "전기 수리 상담으로 이어가기",
    ctaHref: "/service/electric"
  },
  {
    id: "outlet-fail",
    trigger: "콘센트·스위치가 작동 안 해요",
    title: "콘센트나 스위치가 작동하지 않을 때",
    summary: "접촉 불량이나 내부 소손이 원인인 경우가 많으며 겉으로는 멀쩡해 보일 수 있습니다.",
    likelyCauses: ["접촉 불량·내부 소손", "해당 회로 차단기 내려감", "오래된 콘센트 마모"],
    firstChecks: ["분전반에서 해당 회로 차단기 상태 확인", "다른 기기를 꽂아 콘센트 자체 문제인지 확인", "스위치 여러 번 작동해 보기"],
    whenToCall: "콘센트가 뜨겁거나 타는 냄새가 나면 즉시 사용을 중단하고 연락하세요.",
    ctaLabel: "전기 수리 상담으로 이어가기",
    ctaHref: "/service/electric"
  },
  {
    id: "electric-smell",
    trigger: "전기 타는 냄새가 나요",
    title: "전기 타는 냄새나 플라스틱 냄새가 날 때",
    summary: "화재 전조 증상일 수 있어 즉시 해당 회로를 끄고 전문가 점검을 받아야 합니다.",
    likelyCauses: ["배선 피복 손상·과열", "콘센트·스위치 내부 과열", "차단기 접점 소손"],
    firstChecks: ["냄새가 나는 콘센트·스위치·분전반 위치 특정", "해당 회로 차단기를 내리기", "주변 기기 전원을 차단"],
    whenToCall: "타는 냄새는 화재 위험 신호입니다. 즉시 사용을 중단하고 연락하세요.",
    ctaLabel: "전기 긴급 상담",
    ctaHref: "/service/electric"
  },

  // 욕실
  {
    id: "bath-drain",
    trigger: "욕실 배수가 잘 안 돼요",
    title: "욕실 바닥 배수가 느리거나 막혔을 때",
    summary: "머리카락·이물질 막힘이 대부분이지만, 배관 자체 문제일 때는 반복됩니다.",
    likelyCauses: ["머리카락·이물질 막힘", "배수 트랩 이물질", "배관 내 스케일"],
    firstChecks: ["배수구 커버를 열어 이물질 제거", "물을 부어 빠지는 속도 확인", "냄새가 함께 나는지 확인"],
    whenToCall: "청소 후에도 반복되거나 역류하면 배관 점검이 필요합니다.",
    ctaLabel: "설비 수리 상담으로 이어가기",
    ctaHref: "/service/plumbing"
  },
  {
    id: "toilet-clog",
    trigger: "변기가 잘 안 내려가요",
    title: "변기 물이 잘 내려가지 않거나 막혔을 때",
    summary: "이물질 막힘부터 확인하고, 반복되면 배관 트러블을 의심해야 합니다.",
    likelyCauses: ["이물질 투입으로 인한 막힘", "배관 내 스케일", "변기 자체 결함"],
    firstChecks: ["변기 내부에 이물질 여부 확인", "뚫어뻥으로 기압 반복 시도", "물 내릴 때 부글거리는 소리 여부 확인"],
    whenToCall: "물이 역류하거나 뚫어뻥으로도 해결이 안 되면 바로 연락하세요.",
    ctaLabel: "설비 수리 상담으로 이어가기",
    ctaHref: "/service/plumbing"
  },
  {
    id: "mold-smell",
    trigger: "곰팡이가 반복해서 생겨요",
    title: "곰팡이와 냄새가 반복될 때",
    summary: "단순 청소로 끝나지 않고 환기, 결로, 방수, 누수 여부를 같이 봐야 재발을 줄일 수 있습니다.",
    likelyCauses: ["결로", "환기 부족", "잔수·배수 문제", "숨은 누수"],
    firstChecks: ["생기는 계절과 시간을 기록", "창문 주변과 욕실 천장을 확인", "냄새가 강해지는 곳을 체크"],
    whenToCall: "같은 위치에 반복되면 표면 문제가 아니라 원인 해결이 필요합니다.",
    ctaLabel: "방수·타일 서비스 보기",
    ctaHref: "/service/waterproofing-tile"
  },
  {
    id: "shower-pressure",
    trigger: "샤워기 수압이 약해요",
    title: "샤워기 수압이 유독 약할 때",
    summary: "샤워헤드 필터 막힘이 원인인 경우가 많아 간단한 청소로 해결되기도 합니다.",
    likelyCauses: ["샤워헤드 필터 스케일·이물질", "호스 꺾임", "해당 배관 밸브 잠김"],
    firstChecks: ["샤워헤드를 분리해 필터 청소", "호스에 꺾인 부분이 있는지 확인", "세면대 수압과 비교"],
    whenToCall: "세면대도 같이 약하면 배관 전체 점검이 필요합니다.",
    ctaLabel: "설비 수리 상담으로 이어가기",
    ctaHref: "/service/plumbing"
  },

  // 주방·설비
  {
    id: "drain-trouble",
    trigger: "수전에서 물이 새요",
    title: "수전이나 배수가 답답할 때",
    summary: "수전, 배수 부속, 호스, 하부장 상태를 같이 봐야 냄새와 물 고임을 줄일 수 있습니다.",
    likelyCauses: ["배수 부속 노후", "호스·트랩 문제", "수전 누수", "하부장 습기"],
    firstChecks: ["물 빠지는 속도 확인", "하부장 내부가 젖었는지 확인", "악취가 배수구에서 나는지 확인"],
    whenToCall: "냄새가 나거나 하부장 안쪽이 젖으면 부속 점검이 필요합니다.",
    ctaLabel: "설비 서비스 보기",
    ctaHref: "/service/plumbing"
  },
  {
    id: "kitchen-drain",
    trigger: "주방 배수가 막혔어요",
    title: "주방 싱크대 배수가 막히거나 느릴 때",
    summary: "기름때와 음식 찌꺼기가 쌓이면 배관 전체가 막히는 경우가 생깁니다.",
    likelyCauses: ["기름때·음식 찌꺼기 누적", "트랩 막힘", "배관 내 스케일"],
    firstChecks: ["싱크대 트랩(S자 파이프) 분리해 이물질 확인", "뜨거운 물을 천천히 부어 보기", "주방 세정제로 트랩 주변 청소"],
    whenToCall: "청소 후에도 물이 역류하거나 냄새가 심하면 배관 고압 세척이 필요합니다.",
    ctaLabel: "설비 수리 상담으로 이어가기",
    ctaHref: "/service/plumbing"
  },
  {
    id: "sink-wet",
    trigger: "싱크대 하부장이 젖어 있어요",
    title: "싱크대 하부장 안쪽이 습하거나 젖어 있을 때",
    summary: "수전 호스, 트랩 연결부, 배수관 등 여러 곳에서 소량 누수가 쌓이는 경우가 많습니다.",
    likelyCauses: ["수전 호스 연결부 누수", "배수 트랩 느슨함", "냉온수 밸브 패킹 마모"],
    firstChecks: ["하부장 안에 손전등 비춰 물기 위치 특정", "수전 사용 중 물기가 늘어나는지 확인", "배수구 주변 고무 패킹 상태 확인"],
    whenToCall: "하부장 바닥재나 목재가 젖었으면 곰팡이 전에 빠르게 수리해야 합니다.",
    ctaLabel: "설비 서비스 보기",
    ctaHref: "/service/plumbing"
  }
];

export function getDiagnosisTopicById(id?: string | null): DiagnosisTopic {
  if (!id) return diagnosisTopics[0];
  return diagnosisTopics.find((t) => t.id === id) ?? diagnosisTopics[0];
}

export function getDiagnosisTopicByTrigger(trigger?: string | null): DiagnosisTopic {
  if (!trigger) return diagnosisTopics[0];
  const normalized = trigger.trim();
  return diagnosisTopics.find((t) => t.trigger === normalized || t.id === normalized) ?? getDiagnosisTopicById(normalized);
}

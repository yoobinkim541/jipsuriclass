export type ServiceBlogProfile = {
  fetchTerms: string[];
  matchTerms: string[];
  categoryNos: number[];
  queryTerms?: string[];
  excludeTerms?: string[];
};

const serviceBlogProfiles: Record<string, ServiceBlogProfile> = {
  "/service/leak": {
    fetchTerms: ["천장누수", "욕실누수", "배관누수", "누수", "누수복구", "물샘", "아랫집", "누수피해", "천장석고보드"],
    matchTerms: ["누수", "천장누수", "욕실누수", "배관누수", "누수복구", "물샘", "아랫집"],
    categoryNos: [45, 38]
  },
  "/service/bathroom": {
    fetchTerms: ["욕실", "화장실", "세면대", "샤워부스", "환풍기", "타일", "줄눈", "욕조", "곰팡이", "백시멘트", "실리콘"],
    matchTerms: ["욕실", "화장실", "타일", "줄눈", "실리콘", "세면대", "샤워부스"],
    categoryNos: [40, 31, 38]
  },
  "/service/wallpaper": {
    fetchTerms: ["부분도배", "실크도배", "합지도배", "도배", "벽지", "원상복구", "천장도배", "석고보드", "오염"],
    matchTerms: ["도배", "벽지", "실크도배", "합지도배", "부분도배", "원상복구"],
    categoryNos: [30, 43]
  },
  "/service/door": {
    fetchTerms: ["중문", "문수리", "문틀", "경첩", "도어락", "현관문", "방문", "레일", "로라", "안닫힘"],
    matchTerms: ["문", "문틀", "중문", "경첩", "도어락", "레일", "로라"],
    categoryNos: [39, 24]
  },
  "/service/carpentry": {
    fetchTerms: ["목공", "걸레받이", "몰딩", "선반", "서랍", "붙박이", "수납", "벽구멍", "쫄대"],
    matchTerms: ["목공", "몰딩", "걸레받이", "선반", "서랍", "붙박이", "수납"],
    categoryNos: [39, 43]
  },
  "/service/waterproofing": {
    fetchTerms: ["옥상방수", "욕실방수", "베란다", "테라스", "우레탄", "탄성코트", "물고임", "방수보수", "옥상", "방수층"],
    matchTerms: ["방수", "옥상방수", "욕실방수", "베란다", "테라스", "우레탄"],
    categoryNos: [31, 40, 45]
  },
  "/service/paint": {
    fetchTerms: ["도장", "페인트", "도색", "도장공사", "벽면도장", "천장도장", "오일스테인", "수성페인트", "크랙", "균열"],
    matchTerms: ["도장", "페인트", "도색", "벽면도장", "천장도장", "크랙", "균열"],
    categoryNos: [31, 43]
  },
  "/service/window": {
    fetchTerms: ["창호", "샷시", "방충망", "창문", "창틀", "단열", "유리교체", "이중창", "로이유리", "모헤어", "미세망"],
    matchTerms: ["창호", "샷시", "방충망", "창문", "창틀", "단열"],
    categoryNos: [24, 39]
  },
  "/service/electric": {
    fetchTerms: ["전기", "콘센트", "스위치", "전등", "LED", "형광등", "누전", "조명", "센서등", "환풍기"],
    matchTerms: ["전기", "콘센트", "스위치", "전등", "LED", "누전"],
    categoryNos: [38, 43]
  },
  "/service/tile": {
    fetchTerms: ["타일", "줄눈", "실리콘", "욕실", "화장실", "주방", "현관", "타일교체", "타일보수", "타일시공"],
    matchTerms: ["타일", "욕실", "화장실", "줄눈", "실리콘", "주방", "현관"],
    categoryNos: [40, 31],
    queryTerms: ["욕실", "타일", "줄눈", "실리콘", "화장실", "주방", "세면대", "환풍기"],
    excludeTerms: ["외벽", "외부", "옥상", "드라이비트", "스톤코트", "칼라강판", "난간", "데킹", "주차장", "배관", "전기", "도배", "문틀", "문필름", "방충망", "창문", "싱크대"]
  },
  "/service/plumbing": {
    fetchTerms: ["배관", "변기", "수전", "막힘", "하수", "해빙", "동파", "온수", "설비", "양변기"],
    matchTerms: ["배관", "변기", "수전", "막힘", "설비", "동파", "해빙"],
    categoryNos: [38, 45]
  },
  "/service/waterproofing-tile": {
    fetchTerms: ["방수", "타일", "줄눈", "실리콘", "욕실", "화장실", "베란다", "크랙", "균열", "우레탄"],
    matchTerms: ["방수", "타일", "욕실", "화장실", "줄눈", "실리콘", "베란다"],
    categoryNos: [40, 31],
    queryTerms: ["방수", "타일", "욕실", "실리콘", "베란다", "화장실", "줄눈"],
    excludeTerms: ["외벽", "외부", "드라이비트", "스톤코트", "칼라강판", "난간", "데킹", "주차장"]
  },
  "/service/wallpaper-floor": {
    fetchTerms: ["도배", "장판", "바닥", "마루", "부분도배", "원상복구", "합지도배", "실크도배", "오염", "들뜸"],
    matchTerms: ["도배", "장판", "바닥", "마루", "들뜸", "오염"],
    categoryNos: [30, 43]
  },
  "/service/interior-film": {
    fetchTerms: ["인테리어필름", "싱크대필름", "문필름", "시트지", "필름", "가구리폼", "싱크대", "리폼", "걸레받이보수"],
    matchTerms: ["필름", "문필름", "싱크대필름", "시트지", "리폼", "싱크대"],
    categoryNos: [24, 43]
  },
  "/service/exterior": {
    fetchTerms: ["외벽", "외부", "도장", "방수", "크랙", "균열", "드라이비트", "스톤코트", "칼라강판", "난간"],
    matchTerms: ["외벽", "외부", "도장", "방수", "크랙", "균열", "드라이비트"],
    categoryNos: [31, 43],
    queryTerms: ["외벽", "외부", "크랙", "균열", "도장", "방수", "드라이비트"],
    excludeTerms: []
  }
};

export function getServiceBlogProfile(path: string) {
  return serviceBlogProfiles[path];
}

export function getServiceBlogProfiles() {
  return serviceBlogProfiles;
}

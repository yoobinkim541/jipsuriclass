import {
  Bath,
  Bolt,
  BrickWall,
  DoorOpen,
  Droplets,
  Utensils,
  type LucideIcon
} from "lucide-react";

export type DiagnosisCategoryVisual = {
  icon: LucideIcon;
  detail: string;
  code: string;
  image: string;
};

const diagnosisCategoryVisuals: Record<string, DiagnosisCategoryVisual> = {
  bathroom: {
    icon: Bath,
    detail: "수전, 배수, 실리콘, 타일 상태",
    code: "BATH",
    image: "/assets/cases/case1-silicone-tile.jpg"
  },
  kitchen: {
    icon: Utensils,
    detail: "싱크대, 후드, 배관, 상판 주변",
    code: "KITCHEN",
    image: "/assets/cases/case4-sink.jpg"
  },
  leak: {
    icon: Droplets,
    detail: "천장, 벽면, 배관 주변 누수 흔적",
    code: "LEAK",
    image: "/assets/cases/case5-leak.jpg"
  },
  electric: {
    icon: Bolt,
    detail: "조명, 콘센트, 차단기, 배선 이상",
    code: "ELEC",
    image: "/assets/cases/case3-led.jpg"
  },
  door: {
    icon: DoorOpen,
    detail: "문틀, 창틀, 도어락, 틈새 바람",
    code: "DOOR",
    image: "/assets/cases/case2-insulation.jpg"
  },
  wall: {
    icon: BrickWall,
    detail: "벽지, 바닥재, 타일, 천장 마감",
    code: "FINISH",
    image: "/assets/cases/wall-repair.png"
  }
};

export function getDiagnosisCategoryVisual(id: string): DiagnosisCategoryVisual {
  return diagnosisCategoryVisuals[id] ?? diagnosisCategoryVisuals.wall;
}

export type Course = {
  id: number;
  title: string;
  category: string;
  audience: string[];
  collections: string[];
  chapters: number;
  duration: string;
  thumbnail: string;
  recommended: boolean;
  /** URL slug used for course detail routes. */
  slug: string;
  /** Course detail / overview screen (Next.js route). */
  detailPath: string;
  /** Start learning route (may point to reader or overview if not yet interactive). */
  startPath: string;
};

function slugifyCourseTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const courses: Course[] = [
  {
    id: 100,
    title: "Demo Safeguarding Awareness",
    category: "Community",
    audience: ["Care Assistant", "Senior Care Assistant", "Registered Manager", "Nurse"],
    collections: ["Care Essentials collection"],
    chapters: 6,
    duration: "24-32 minutes",
    thumbnail: "/images/courses/cover-demo-safeguarding-awareness.jpg",
    recommended: true,
    slug: "ai-healthcare-learning-demo",
    detailPath: "/courses/ai-healthcare-learning-demo/overview",
    startPath: "/courses/ai-healthcare-learning-demo/learn/1",
  },
];

export type Collection = {
  id: number;
  name: string;
  courses: number;
  hours: number;
  thumbnail: string;
};

export const collections: Collection[] = [
  {
    id: 1,
    name: "Care Essentials collection",
    courses: 8,
    hours: 12,
    thumbnail: "/images/collections/collection-care-essentials.png",
  },
  {
    id: 2,
    name: "Advanced Safeguarding collection (L3)",
    courses: 6,
    hours: 15,
    thumbnail: "/images/collections/collection-safeguarding.png",
  },
  {
    id: 3,
    name: "Care Leader collection",
    courses: 10,
    hours: 20,
    thumbnail: "/images/collections/collection-care-leader.png",
  },
  {
    id: 4,
    name: "Understanding Mental Health and...",
    courses: 7,
    hours: 18,
    thumbnail: "/images/collections/collection-mental-health.png",
  },
  {
    id: 5,
    name: "Pathway to Care collection",
    courses: 9,
    hours: 14,
    thumbnail: "/images/collections/collection-pathway.png",
  },
  {
    id: 6,
    name: "Dementia Care collection",
    courses: 5,
    hours: 10,
    thumbnail: "/images/collections/collection-dementia.png",
  },
];

export type UserProgressRow = {
  course: string;
  status: "In progress" | "Completed";
  progress: number;
  certifiedDate?: string;
};

export const userProgress: UserProgressRow[] = [
  {
    course: "Demo Safeguarding Awareness",
    status: "In progress",
    progress: 35,
  },
];

export function parseDurationToMinutes(durationLabel: string) {
  const match = durationLabel.match(/(\d+)\s*-\s*(\d+)/);
  if (match) return { min: Number(match[1]), max: Number(match[2]) };
  return null;
}

export function matchesDurationBucket(
  durationLabel: string,
  bucket: string
): boolean {
  if (!bucket) return true;
  const parsed = parseDurationToMinutes(durationLabel);
  if (!parsed) return false;
  if (bucket === "60+") return parsed.max >= 60;
  const match = bucket.match(/(\d+)\s*-\s*(\d+)/);
  if (!match) return true;
  const bucketMin = Number(match[1]);
  const bucketMax = Number(match[2]);
  return parsed.min <= bucketMax && parsed.max >= bucketMin;
}

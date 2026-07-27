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
    title: "AI Healthcare Learning Experience Demo",
    category: "Community",
    audience: ["Care Assistant", "Senior Care Assistant", "Registered Manager", "Nurse"],
    collections: ["Care Essentials collection"],
    chapters: 5,
    duration: "18-25 minutes",
    thumbnail: "/images/courses/cover-medication.png",
    recommended: true,
    slug: "ai-healthcare-learning-demo",
    detailPath: "/courses/ai-healthcare-learning-demo/overview",
    startPath: "/courses/ai-healthcare-learning-demo/learn/1",
  },
  {
    id: 1,
    title: "Prompting and assisting with medication in Home Care",
    category: "Medicines Management",
    audience: ["Care Assistant", "Senior Care Assistant", "Other staff"],
    collections: ["Care Essentials collection"],
    chapters: 15,
    duration: "20-30 minutes",
    thumbnail: "/images/courses/cover-medication.png",
    recommended: true,
    slug: "medication-home-care",
    detailPath: "/courses/medication-home-care/overview",
    startPath: "/courses/medication-home-care/learn/1",
  },
  {
    id: 2,
    title: "An introduction to the buccal route of medication",
    category: "Medicines Management",
    audience: ["Care Assistant", "Senior Care Assistant", "Other staff"],
    collections: ["Care Essentials collection"],
    chapters: 8,
    duration: "0-10 minutes",
    thumbnail: "/images/courses/cover-buccal.png",
    recommended: true,
    slug: "buccal",
    detailPath: "/courses/buccal/overview",
    startPath: "/courses/buccal/learn/1",
  },
  {
    id: 3,
    title: "Diabetes Awareness And Management",
    category: "Long Term Conditions",
    audience: ["Care Assistant", "Senior Care Assistant", "Other staff"],
    collections: ["Pathway to Care collection"],
    chapters: 20,
    duration: "40-60 minutes",
    thumbnail: "/images/courses/cover-diabetes.png",
    recommended: true,
    slug: slugifyCourseTitle("Diabetes Awareness And Management"),
    detailPath: `/courses/${slugifyCourseTitle("Diabetes Awareness And Management")}/overview`,
    startPath: `/courses/${slugifyCourseTitle("Diabetes Awareness And Management")}/learn/1`,
  },
  {
    id: 4,
    title: "Basic First Aid Awareness",
    category: "Fundamentals",
    audience: ["Care Assistant", "Senior Care Assistant", "Other staff"],
    collections: [],
    chapters: 12,
    duration: "30-45 minutes",
    thumbnail: "/images/courses/cover-first-aid.png",
    recommended: false,
    slug: slugifyCourseTitle("Basic First Aid Awareness"),
    detailPath: `/courses/${slugifyCourseTitle("Basic First Aid Awareness")}/overview`,
    startPath: `/courses/${slugifyCourseTitle("Basic First Aid Awareness")}/learn/1`,
  },
  {
    id: 5,
    title: "Equality, Diversity & LGBTQ+",
    category: "Legislation",
    audience: [
      "Care Assistant",
      "Senior Care Assistant",
      "Registered Manager",
      "Other staff",
    ],
    collections: [],
    chapters: 10,
    duration: "25-35 minutes",
    thumbnail: "/images/courses/cover-equality.png",
    recommended: false,
    slug: slugifyCourseTitle("Equality, Diversity & LGBTQ+"),
    detailPath: `/courses/${slugifyCourseTitle("Equality, Diversity & LGBTQ+")}/overview`,
    startPath: `/courses/${slugifyCourseTitle("Equality, Diversity & LGBTQ+")}/learn/1`,
  },
  {
    id: 6,
    title: "Medication Administration",
    category: "Medicines Management",
    audience: ["Care Assistant", "Senior Care Assistant", "Nurse", "Other staff"],
    collections: ["Care Essentials collection"],
    chapters: 18,
    duration: "45-60 minutes",
    thumbnail: "/images/courses/cover-med-admin.png",
    recommended: false,
    slug: slugifyCourseTitle("Medication Administration"),
    detailPath: `/courses/${slugifyCourseTitle("Medication Administration")}/overview`,
    startPath: `/courses/${slugifyCourseTitle("Medication Administration")}/learn/1`,
  },
  {
    id: 7,
    title: "PEG Feed Training",
    category: "Complex Care",
    audience: ["Care Assistant", "Senior Care Assistant", "Nurse"],
    collections: [],
    chapters: 14,
    duration: "35-50 minutes",
    thumbnail: "/images/courses/cover-peg.png",
    recommended: false,
    slug: slugifyCourseTitle("PEG Feed Training"),
    detailPath: `/courses/${slugifyCourseTitle("PEG Feed Training")}/overview`,
    startPath: `/courses/${slugifyCourseTitle("PEG Feed Training")}/learn/1`,
  },
  {
    id: 8,
    title: "Safeguarding Adults",
    category: "Statutory and Mandatory",
    audience: [
      "Care Assistant",
      "Senior Care Assistant",
      "Registered Manager",
      "Other staff",
    ],
    collections: ["Advanced Safeguarding collection (L3)"],
    chapters: 16,
    duration: "40-55 minutes",
    thumbnail: "/images/courses/cover-safeguarding.png",
    recommended: false,
    slug: slugifyCourseTitle("Safeguarding Adults"),
    detailPath: `/courses/${slugifyCourseTitle("Safeguarding Adults")}/overview`,
    startPath: `/courses/${slugifyCourseTitle("Safeguarding Adults")}/learn/1`,
  },
  {
    id: 9,
    title: "Infection Control",
    category: "Health and Safety",
    audience: ["Care Assistant", "Senior Care Assistant", "Nurse", "Other staff"],
    collections: ["Care Essentials collection"],
    chapters: 11,
    duration: "20-30 minutes",
    thumbnail: "/images/courses/cover-infection.png",
    recommended: false,
    slug: slugifyCourseTitle("Infection Control"),
    detailPath: `/courses/${slugifyCourseTitle("Infection Control")}/overview`,
    startPath: `/courses/${slugifyCourseTitle("Infection Control")}/learn/1`,
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
    course: "Basic First Aid Awareness",
    status: "In progress",
    progress: 44,
  },
  {
    course: "Equality, Diversity & LGBTQ+",
    status: "In progress",
    progress: 30,
  },
  {
    course: "Medication Administration",
    status: "Completed",
    progress: 100,
    certifiedDate: "16/12/25",
  },
  {
    course: "PEG Feed Training",
    status: "Completed",
    progress: 100,
    certifiedDate: "08/01/26",
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

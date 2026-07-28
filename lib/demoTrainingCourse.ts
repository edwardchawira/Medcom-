import type { ChapterQuizQuestion } from "@/components/learning/ChapterQuiz";
import type { FlorenceAssessmentQuestion } from "@/components/learning/FlorenceAssessment";
import type { InteractiveTopic } from "@/components/learning/InteractiveTopicCard";

export type DemoLesson = {
  id: string;
  title: string;
  minutes: number;
  kind: "lesson" | "video" | "procedure" | "scenario" | "media" | "interactive";
  html: string;
  objectives: string[];
  quiz: ChapterQuizQuestion[];
  interactiveCards?: Array<{
    title: string;
    intro: string;
    topics: InteractiveTopic[];
  }>;
};

export const demoTrainingCourse = {
  slug: "ai-healthcare-learning-demo",
  title: "Demo Safeguarding Awareness",
  duration: "24-32 minutes",
  learningOutcomes: [
    "Explain what safeguarding means and why it matters in youth, community, and care settings.",
    "Recognise common signs of abuse, neglect, exploitation, and unsafe practice.",
    "Respond calmly to a concern or disclosure without investigating or promising secrecy.",
    "Record safeguarding concerns clearly, factually, and in line with local reporting routes.",
    "Use video, revealable guidance, interactive topic panels, and MCQs to check understanding before assessment.",
  ],
  lessons: [
    {
      id: "learning-outcomes",
      title: "Learning Outcomes",
      minutes: 2,
      kind: "lesson",
      objectives: [
        "Understand what this safeguarding module covers.",
        "Use the course modules rail to navigate the new learning interface.",
      ],
      html: `
        <p>This opening screen introduces the safeguarding module and demonstrates the new learning outcomes layout. The white learning card, purple title bar, and retractable module rail are designed to match the Alison-style course-player flow.</p>
        <details class="demo-expandable">
          <summary>How to use this module</summary>
          <p>Move through each section using the course module rail or the Next button. Open revealable guidance for extra detail, use interactive panels to compare topics, and complete each multiple-choice check before the final assessment.</p>
        </details>
      `,
      quiz: [],
    },
    {
      id: "safeguarding-introduction",
      title: "Introduction to Safeguarding",
      minutes: 5,
      kind: "lesson",
      objectives: [
        "Define safeguarding in practical terms.",
        "Recognise the learner journey used in this demo course.",
      ],
      html: `
        <figure class="demo-image-zoom demo-image-left">
          <img src="/images/courses/safeguarding-introduction-hero.png" alt="Youth worker supporting children during a classroom activity" width="420" height="260" />
        </figure>
        <p>Safeguarding means protecting people from abuse, neglect, exploitation, and avoidable harm. In youth, community, and care settings, safeguarding is everyone's responsibility and depends on alert observation, calm response, clear records, and timely reporting.</p>
        <p>This demo is built to match the video-led safeguarding flow: learners begin with outcomes, move into concise content pages, watch the featured training video, review expandable notes, and complete knowledge checks.</p>

        <h3>Why safeguarding matters</h3>
        <p>Safeguarding practice helps create environments where people are listened to, respected, and protected. A concern might be obvious, subtle, repeated, or disclosed directly. The learner's role is to notice, respond safely, record accurately, and follow the agreed route for support.</p>

        <details class="demo-expandable demo-principle-card">
          <summary>Key safeguarding principle</summary>
          <p>If someone tells you they are being harmed or feel unsafe, listen carefully, reassure them they have done the right thing, avoid leading questions, and explain that you may need to share the information with the right safeguarding lead.</p>
        </details>
      `,
      quiz: [
        {
          id: "intro-q1",
          sort_order: 1,
          prompt: "What is the safest description of safeguarding?",
          options: [
            "Protecting people from abuse, neglect, exploitation, and avoidable harm",
            "Investigating every allegation yourself",
            "Keeping every concern private forever",
            "Only acting when harm has already been proven",
          ],
          correct_index: 0,
          explanation:
            "Safeguarding is about protection and timely action. Learners should not investigate concerns themselves or promise secrecy.",
        },
      ],
    },
    {
      id: "recognising-concerns",
      title: "Recognising Safeguarding Concerns",
      minutes: 6,
      kind: "interactive",
      objectives: [
        "Identify different categories of safeguarding concern.",
        "Use the interactive card to compare signs and examples.",
      ],
      html: `
        <figure class="demo-image-zoom demo-image-right">
          <img src="/images/courses/safeguarding-concerns-hero.png" alt="Child holding a teddy bear in a calm support setting" width="420" height="260" />
        </figure>
        <p>Safeguarding concerns may appear as physical signs, emotional changes, patterns in behaviour, unsafe environments, unexplained absence, controlling relationships, or worries raised by the person or someone close to them.</p>
        <p>The interactive card below lets learners select a concern type on the left and review a focused explanation on the right.</p>
      `,
      interactiveCards: [
        {
          title: "Common safeguarding concern types",
          intro: "",
          topics: [
            {
              title: "Physical Abuse",
              imageUrl: "/images/courses/safeguarding-physical-abuse.png",
              imageAlt: "Adult holding a bandaged wrist as a non-graphic physical harm indicator",
              body: "Physical abuse may involve hitting, shaking, inappropriate restraint, rough handling, or other actions that cause injury or pain.",
              bullets: [
                "Look for unexplained injuries, repeated bruising, fearfulness, or inconsistent explanations.",
                "Record what you see and hear. Do not ask leading questions.",
              ],
            },
            {
              title: "Emotional Abuse",
              imageUrl: "/images/courses/safeguarding-emotional-abuse.png",
              imageAlt: "One adult speaking forcefully while another looks withdrawn",
              body: "Emotional abuse can include threats, humiliation, intimidation, isolation, blaming, or controlling behaviour that damages confidence and wellbeing.",
              bullets: [
                "Notice withdrawal, anxiety, sudden behaviour changes, or fear of a particular person.",
                "Listen calmly and pass concerns to the safeguarding lead.",
              ],
            },
            {
              title: "Neglect",
              imageUrl: "/images/courses/safeguarding-neglect.png",
              imageAlt: "Young adult sitting alone beside a rain-streaked window",
              body: "Neglect happens when basic needs are not met, including food, warmth, hygiene, supervision, medication, education, or medical attention.",
              bullets: [
                "Patterns matter: repeated missed care, poor hygiene, or unsafe living conditions may indicate neglect.",
                "Escalate concerns promptly, especially where immediate safety is affected.",
              ],
            },
            {
              title: "Exploitation",
              imageUrl: "/images/courses/safeguarding-exploitation.png",
              imageAlt: "Young adults outside a community building showing peer pressure dynamics",
              body: "Exploitation can include pressure, manipulation, coercion, financial control, sexual exploitation, criminal exploitation, or online grooming.",
              bullets: [
                "Watch for secrecy, unexplained money or gifts, fear, isolation, or sudden changes in relationships.",
                "Follow reporting routes and preserve factual details.",
              ],
            },
          ],
        },
      ],
      quiz: [
        {
          id: "recognise-q1",
          sort_order: 1,
          prompt: "Which response is appropriate when you notice possible signs of neglect?",
          options: [
            "Wait until you can prove what happened",
            "Record factual observations and report through the safeguarding route",
            "Confront the suspected person publicly",
            "Delete notes if you are unsure",
          ],
          correct_index: 1,
          explanation:
            "Safeguarding relies on factual recording and timely reporting. You do not need to prove abuse before escalating a concern.",
        },
      ],
    },
    {
      id: "responding-to-disclosures",
      title: "Responding to a Disclosure",
      minutes: 5,
      kind: "procedure",
      objectives: [
        "Respond safely when someone shares a concern.",
        "Avoid common mistakes such as leading questions or promises of secrecy.",
      ],
      html: `
        <figure class="demo-image-zoom demo-image-left">
          <img src="/images/courses/safeguarding-disclosure-support.png" alt="Supportive conversation during a safeguarding disclosure" width="420" height="260" />
        </figure>
        <p>A disclosure can happen suddenly, indirectly, or after a person has tested whether they can trust you. The priority is to stay calm, listen, and protect the person from further harm.</p>

        <h3>Safe response steps</h3>
        <ul>
          <li><strong>Listen:</strong> Give the person time and avoid interrupting.</li>
          <li><strong>Reassure:</strong> Tell them they have done the right thing by speaking up.</li>
          <li><strong>Do not investigate:</strong> Avoid leading questions, judgement, or repeated questioning.</li>
          <li><strong>Explain next steps:</strong> Be honest that you may need to share the concern with the safeguarding lead.</li>
          <li><strong>Record and report:</strong> Write factual notes as soon as possible and follow the local route.</li>
        </ul>

        <details class="demo-expandable">
          <summary>Words that help</summary>
          <p>Helpful phrases include: "I am listening", "You have done the right thing by telling me", "I cannot promise to keep this secret, but I will only share it with people who need to help keep you safe", and "I will explain what happens next".</p>
        </details>
      `,
      quiz: [
        {
          id: "disclosure-q1",
          sort_order: 1,
          prompt: "What should you avoid during a disclosure?",
          options: [
            "Listening calmly",
            "Explaining that you may need to share the concern",
            "Asking leading questions or investigating yourself",
            "Making a factual record",
          ],
          correct_index: 2,
          explanation:
            "You should not investigate or lead the person. Listen, reassure, record, and report through the correct route.",
        },
      ],
    },
    {
      id: "reporting-recording",
      title: "Reporting and Recording Concerns",
      minutes: 5,
      kind: "interactive",
      objectives: [
        "Know what to include in safeguarding records.",
        "Select reporting actions based on the level of concern.",
      ],
      html: `
        <p>Clear reporting and recording helps the safeguarding lead, managers, and statutory partners make timely decisions. Records should be factual, dated, signed where required, and shared through approved systems.</p>
      `,
      interactiveCards: [
        {
          title: "What good safeguarding records include",
          intro: "",
          topics: [
            {
              title: "Facts",
              imageUrl: "/images/content/theme-records.png",
              imageAlt: "Record keeping illustration",
              body: "Write what was seen, heard, or disclosed. Keep opinion separate from observation and use the person's own words where possible.",
              bullets: [
                "Include date, time, location, people present, and exact words where relevant.",
                "Avoid assumptions, labels, or personal judgements.",
              ],
            },
            {
              title: "Immediate Safety",
              imageUrl: "/images/content/theme-safety.png",
              imageAlt: "Immediate safety illustration",
              body: "If someone is at immediate risk, urgent action may be needed before routine reporting. Follow local emergency and safeguarding procedures.",
              bullets: [
                "Do not delay urgent help where there is immediate danger.",
                "Tell the safeguarding lead what action has already been taken.",
              ],
            },
            {
              title: "Reporting Route",
              imageUrl: "/images/collections/collection-safeguarding.png",
              imageAlt: "Safeguarding pathway illustration",
              body: "Every organisation should have a named safeguarding lead and clear reporting route. Learners should know who to contact and how quickly.",
              bullets: [
                "Use the local safeguarding policy and escalation route.",
                "Do not leave concerns only as informal conversation.",
              ],
            },
            {
              title: "Confidentiality",
              imageUrl: "/images/content/theme-person-centred.png",
              imageAlt: "Confidential support illustration",
              body: "Safeguarding information should be shared only with people who need it to protect the person or respond lawfully.",
              bullets: [
                "Never promise absolute secrecy.",
                "Share information through secure, approved channels.",
              ],
            },
          ],
        },
      ],
      quiz: [
        {
          id: "recording-q1",
          sort_order: 1,
          prompt: "Which note is most appropriate for a safeguarding record?",
          options: [
            "They are obviously lying",
            "At 14:10, Sam said, 'I do not feel safe going home today'",
            "Everything is probably fine",
            "The family seems strange",
          ],
          correct_index: 1,
          explanation:
            "The best record is factual, timed, and uses the person's words. It avoids judgement or unsupported conclusions.",
        },
      ],
    },
    {
      id: "safeguarding-video",
      title: "Featured Safeguarding Video",
      minutes: 6,
      kind: "video",
      objectives: [
        "Watch the safeguarding video inside the learning interface.",
        "Use transcript notes and a knowledge check to reinforce key messages.",
      ],
      html: `
        <p>This lesson features the safeguarding video provided for the demo course. The video is placed inside the same white slide card, with native controls, metadata, transcript notes, and a knowledge check below.</p>

        <div class="demo-video-block" role="group" aria-label="Derby Inspire Youth CIC safeguarding video">
          <video class="demo-video-player" controls preload="metadata" playsinline aria-label="Derby Inspire Youth CIC safeguarding training video">
            <source src="/videos/derby-inspire-youth-safeguarding.mp4" type="video/mp4" />
          </video>
        </div>

        <details class="demo-expandable">
          <summary>Transcript and learner notes</summary>
          <p><strong>Transcript placeholder:</strong> Add the full transcript here when available. For now, this expandable area demonstrates where the learner can review key messages from the video, reporting routes, definitions, and downloadable support material.</p>
        </details>

        <details class="demo-expandable">
          <summary>Reflection after watching</summary>
          <p>Think about the safest first action if someone tells you they feel unsafe. What would you say, what would you write down, and who would you report to?</p>
        </details>
      `,
      quiz: [
        {
          id: "video-q1",
          sort_order: 1,
          prompt: "What should sit below a safeguarding video lesson to support learning?",
          options: [
            "Transcript notes, reflection prompts, and a knowledge check",
            "Only an empty page",
            "A hidden answer key",
            "Unrelated marketing content",
          ],
          correct_index: 0,
          explanation:
            "Video learning is stronger when learners can revisit transcript notes, reflect on the message, and answer a short knowledge check.",
        },
      ],
    },
    {
      id: "safeguarding-scenario",
      title: "Safeguarding Scenario: What Would You Do?",
      minutes: 5,
      kind: "scenario",
      objectives: [
        "Apply safeguarding principles to a realistic situation.",
        "Choose safe actions without investigating the concern yourself.",
      ],
      html: `
        <section class="demo-case-study">
          <p class="demo-eyebrow">Safeguarding scenario</p>
          <h2>A young person says they do not feel safe</h2>
          <p>During an activity session, a young person becomes withdrawn and says, "Please do not tell anyone, but I do not feel safe at home." They appear anxious and ask whether you can keep it secret.</p>
        </section>

        <h3>Safest sequence</h3>
        <ul>
          <li><strong>Listen calmly:</strong> Give them time and avoid pressing for details.</li>
          <li><strong>Be honest:</strong> Explain you cannot promise secrecy because your role is to help keep them safe.</li>
          <li><strong>Record facts:</strong> Write the exact words, date, time, and context as soon as possible.</li>
          <li><strong>Report:</strong> Follow the safeguarding route and contact the safeguarding lead promptly.</li>
        </ul>

        <details class="demo-expandable demo-principle-card">
          <summary>Common mistake to avoid</summary>
          <p>Do not start your own investigation, ask repeated leading questions, contact the alleged source of harm, or delay reporting because you are unsure. Safeguarding systems are designed to assess concerns properly.</p>
        </details>
      `,
      quiz: [
        {
          id: "scenario-q1",
          sort_order: 1,
          prompt: "What is the safest response to the request to keep the concern secret?",
          options: [
            "Promise secrecy so the person keeps talking",
            "Explain you cannot promise secrecy because you may need to share information to help keep them safe",
            "Ignore the comment unless they repeat it",
            "Ask detailed leading questions to prove what happened",
          ],
          correct_index: 1,
          explanation:
            "You should be honest, reassuring, and clear that information may need to be shared with the right people to protect them.",
        },
      ],
    },
  ] satisfies DemoLesson[],
  assessment: [
    {
      id: "assessment-1",
      loTag: "LO1",
      prompt: "What is safeguarding mainly concerned with?",
      options: [
        "Protecting people from abuse, neglect, exploitation, and avoidable harm",
        "Investigating every allegation alone",
        "Keeping all concerns secret",
        "Only responding after harm is proven",
      ],
      correctIndex: 0,
    },
    {
      id: "assessment-2",
      loTag: "LO2",
      prompt: "What should you do if someone makes a disclosure?",
      options: [
        "Listen, reassure, avoid leading questions, record, and report",
        "Promise absolute confidentiality",
        "Challenge them to prove it",
        "Wait several weeks before telling anyone",
      ],
      correctIndex: 0,
    },
    {
      id: "assessment-3",
      loTag: "LO3",
      prompt: "Which detail belongs in a safeguarding record?",
      options: [
        "Exact words, date, time, observations, and actions taken",
        "Personal guesses only",
        "Rumours with no context",
        "A vague note saying 'something happened'",
      ],
      correctIndex: 0,
    },
    {
      id: "assessment-4",
      loTag: "LO4",
      prompt: "What should happen if there is immediate danger?",
      options: [
        "Follow urgent safety procedures and report through the safeguarding route",
        "Wait until the next scheduled meeting",
        "Keep it informal",
        "Ask the person causing concern to investigate",
      ],
      correctIndex: 0,
    },
    {
      id: "assessment-5",
      loTag: "LO5",
      prompt: "Why include video, revealable guidance, and interactive topic panels?",
      options: [
        "They help learners review, compare, and apply safeguarding messages",
        "They remove the need for assessment",
        "They hide important information",
        "They replace reporting procedures",
      ],
      correctIndex: 0,
    },
  ] satisfies FlorenceAssessmentQuestion[],
};

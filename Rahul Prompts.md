# Rahul Prompts

Exact prompts used during the project, in chronological order.
Append new prompts to the end of this file and keep the running log here.

---

## 1. Landing page improvement — initial task
> We need to improve the text and font on the landing page. We are using a lot of font styles which feel inconsistent and use shadcn ui components only. Make the landing page loading fast. Check the current landing page design and look for improvements

## 2. Scope clarification (asked by assistant, answered: "Full shadcn rebuild")
> How far should the "shadcn-only" overhaul go, given shadcn isn't installed and the landing is fully bespoke (glass cards, custom btn CSS, 3D hero)?
> - Full shadcn rebuild (Recommended)
> - Keep visual identity, optimize
> - Minimal: fonts + speed only

**Answer:** Full shadcn rebuild (Recommended)

## 3. Feedback pivot (after first rebuild stripped too much)
> The fonts feel big somewhere and don't fit in the screen, the alignment is also not good. The animations were totally removed. I want complete user experience. Animations, user journey and that premium feel. The fonts still not feeling professional. Analyze how other big ai interview platforms are built, their ui, design, layout, take design friendly decisons.

## 4. Research-based decisions (asked by assistant)
> Hero / motion: (a) Lightweight animated (CSS/IO, no 3D, fast) — recommended; (b) Bring back 3D hero (heavy, slower LCP); (c) Lightweight + framer-motion.
> Fonts: (a) Inter only (single family) — recommended; (b) Inter + Geist display; (c) Inter + Space Grotesk.

**Answers:** Bring back 3D hero · Inter + Geist display

## 5. Implementation directive (to coding agent, after plan approval)
> Implement the plan above.

## 6. Git merge conflict note (mid-implementation)
> A git pull aborted because local landing changes conflicted with remote eadb96f ("Landing Page, Dashboard, Candidate page, Report page ui/ux fixed with light and dark mode"). Instruction: fix the merge conflicts and put our implementation on it.

## 7. Request to log prompts (this file)
> From now onwards, create a file named "Rahul Prompts.md" and keep adding all the exact prompts we will be using in that file and keep notifying me that you are adding and keeping track

## 8. Redesign 3D hero + install design skills + replace landing dashboards
> The 3d hero component got screwed completely, badly aligned. Redesign it completely and much better than earlier. Install frontend and design skills from-https://github.com/addyosmani/agent-skills and use them and create fab outputs. There are too much dashboards on the landing page, can we replace them , use something even better

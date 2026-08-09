import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  {
    q: "How is the interview actually adaptive?",
    a: "Before the first question MockMate loads the candidate's completion history, attempt counts, and skipped days. A weak answer pushes the depth line up or sideways; a strong one earns more pressure. The replay makes that adaptation visible instead of asking you to trust a summary.",
  },
  {
    q: "What does the readiness report contain?",
    a: "An annotated transcript, not a scorecard. It quotes the candidate back verbatim, names specific strengths and gaps, and ties each next step to a concrete curriculum day — so the following session starts from evidence.",
  },
  {
    q: "Is my data private?",
    a: "The demo runs against a recorded, anonymised session and makes no live API calls. The live product stores state per session and never exposes secrets or keys.",
  },
  {
    q: "Does the playground call the model?",
    a: "The landing demo replays a real recorded session so it loads instantly and costs nothing. A live run with the real model happens once you start a practice interview.",
  },
  {
    q: "Who is this for?",
    a: "Graduates of an intensive AI-engineering cohort who want to practise explaining what they built — and to find the gaps in their own story before a real interview does.",
  },
];

export function Faq() {
  return (
    <section className="relative z-10 bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 space-y-4 text-center">
          <h2 className="font-display text-section text-foreground">
            Questions, answered
          </h2>
          <p className="text-base font-light leading-relaxed text-muted-foreground">
            The things candidates ask before they start a session.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

# Russian AI-writing patterns

Use this reference when auditing Russian-language text.

## Forbidden constructions

**Negative parallelism ("не X, а Y")** -- the top Russian AI tell.
- "Это не просто инструмент -- это образ мышления"
- "Дело не в технологии. Дело в людях"
- "Речь не о скорости, а о смысле"
- Fix: state the claim directly. If the contrast matters, make both halves specific.

**Rhetorical opener traps:**
- "Вы когда-нибудь задумывались...?"
- "Что, если я скажу вам...?"
- "Представьте:"
- Fix: start with a fact or a scene.

**Closing banners:**
- "Подводя итог...", "В заключение хочется отметить...", "Резюмируя..."
- "Надеюсь, это было полезно", "Если у вас есть вопросы -- пишите"
- Fix: end on the last real point. No recap, no pleasantry.

**Compulsive triads:**
- "Быстро, удобно и надёжно", "Проще, дешевле, эффективнее"
- Fix: if three words don't carry three distinct meanings, keep one.

**Warmup first sentence:**
- The first sentence often sets the stage without saying anything. Cut it, start from the second.

**Hedge pileups:**
- "Возможно, в некотором смысле, как правило, обычно это может..."
- Fix: one hedge or none. State precisely what you're unsure about.

---

## Stop-words (110+): replace with specific facts

**Empty amplifiers:**
ключевой, важный, важно отметить, значимый, существенный, решающий, уникальный, невероятный, потрясающий, выдающийся, исключительный, поразительный, впечатляющий, мощный, эффективный, оптимальный, передовой, инновационный, революционный, прорывной, незаменимый, бесценный, захватывающий, амбициозный

**Bureaucratic connectors (cut or restructure):**
таким образом, следовательно, в связи с этим, в первую очередь, прежде всего, в конечном счёте, по сути, по большому счёту, так или иначе, как правило, в целом, более того, кроме того, помимо этого, стоит отметить, стоит подчеркнуть, нельзя не отметить, важно понимать, немаловажно, зачастую, в свою очередь, тем не менее, однако стоит помнить

**Opening/closing clichés:**
в современном мире, в современном быстро меняющемся мире, в эпоху цифровизации, в эпоху цифровой трансформации, на сегодняшний день, не секрет что, давайте разберёмся, давайте рассмотрим, в этой статье мы рассмотрим, итак начнём, поехали, подводя итог, в заключение, резюмируя, надеюсь это поможет, если у вас есть вопросы -- пишите

**Marketing trash:**
решение под ключ, комплексный подход, синергия, бесшовная интеграция, широкий спектр, широкий ряд, ряд преимуществ, богатый функционал, интуитивно понятный, дружелюбный интерфейс, открывает новые возможности, открывает горизонты, выводит на новый уровень, меняет правила игры, играет ключевую роль, является неотъемлемой частью, драйвер роста, точка роста, секрет успеха, must-have, лайфхак

**Cliché metaphors:**
погрузиться в тему, глубокое погружение, раскрыть потенциал, раскрыть полный потенциал, увлекательное путешествие, путешествие в мир, ландшафт рынка, экосистема (как пафос), холистический подход, трансформировать, прокачать, мир маркетинга / финансов / X, эра X, на стыке

**Anglo-calques and buzzwords:**
проактивный, клиентоцентричный, user-friendly, game-changer, deep dive, roadmap (как пафос), скейлить, дизрапт, импакт

---

## Note on context

Not every word is a problem. "Эффективный" is fine next to a number ("сократил цикл на 40%"). The issue is when a word stands in place of a fact.

## Output format

Same as main detect format:
```
[P0/P1/P2] "quoted text" -- rule violated. Suggested fix.
```

Flag Russian stop-words as P1. Flag negative parallelism as P1. Flag closing banners as P1.

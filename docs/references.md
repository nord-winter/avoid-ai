# References: AI-Generated Text Detection

Research bibliography for the area of detecting AI-generated vs. human-written text. Covers peer-reviewed papers, arXiv preprints, and industry sources.

> This list is updated periodically. Preprint status changes; verify DOIs and publication venues before citing in academic work.

---

## Core detection methods

**GLTR** -- statistical visualization of generated text via token rank/probability.
Gehrmann, Strobelt, Rush. ACL 2019 System Demonstrations, pp. 111-116.
<https://arxiv.org/abs/1906.04043>

**DetectGPT** -- zero-shot detection using probability curvature (negative curvature regions = LLM output). ICML 2023, PMLR v202, pp. 24950-24962.
Mitchell, Lee, Khazatsky, Manning, Finn. Stanford.
<https://arxiv.org/abs/2301.11305>

**Fast-DetectGPT** -- conditional probability curvature; ~75% accuracy gain over DetectGPT at fraction of compute. ICLR 2024.
Bao, Zhao, Teng, Yang, Zhang.
<https://arxiv.org/abs/2310.05130>

**Binoculars** -- zero-shot, no training data: ratio of log-perplexity to cross-perplexity across two close models. >90% detection at 0.01% FPR. ICML 2024, PMLR v235.
Hans, Schwarzschild, Cherepanova, Kazemi, Saha, Goldblum, Geiping, Goldstein.
<https://arxiv.org/abs/2401.12070>

**Ghostbuster** -- weak LM probability features; human study at 59% accuracy (near chance). NAACL 2024.
Verma, Fleisig, Tomlin, Klein. UC Berkeley.
<https://arxiv.org/abs/2305.15047>

---

## Surveys and benchmarks

**Survey on LLM-generated text detection** -- systematic review of methods, datasets, attacks, OOD robustness.
Wu, Yang, Zhan, Yuan, Chao, Wong. Computational Linguistics (MIT Press), 2025. ACL Anthology 2025.cl-1.8.
<https://aclanthology.org/2025.cl-1.8>

**MAGE** -- 447,674 texts, 27 LLMs, 10 domains. In-the-wild benchmark. ACL 2024.
Li et al.
<https://arxiv.org/abs/2305.13242>

**M4** -- multi-generator, multi-domain, multilingual black-box detection. EACL 2024.
Wang et al.
<https://arxiv.org/abs/2305.14902>

**MULTITuDE** -- 74k machine-generated texts, 11 languages. EMNLP 2023.
Macko et al.
<https://arxiv.org/abs/2310.13606>

**TuringBench** -- benchmark for Turing test in the neural text generation era. EMNLP 2021 Findings.
Uchendu, Ma, Le, Zhang, Lee.
<https://arxiv.org/abs/2109.13296>

**DetectRL** -- benchmarking in real-world scenarios. NeurIPS 2024 Datasets and Benchmarks.
He, Shen, Chen, Backes, Zhang.
<https://arxiv.org/abs/2410.23746>

---

## Watermarking

**KGW watermark** -- hash of previous tokens splits vocabulary into green/red lists; logits of green tokens boosted. ICML 2023, PMLR v202, pp. 17061-17084.
Kirchenbauer, Geiping, Wen, Kaddour, Rogers, Goldstein. University of Maryland.
<https://arxiv.org/abs/2301.10226>

**SynthID-Text** -- production-ready tournament sampling watermark; deployed on ~20M Gemini responses without quality loss. Nature 634, 818-823 (Oct 2024). doi:10.1038/s41586-024-08025-4.
Dathathri, See, Ghaisas, Huang, McAdam et al. DeepMind.
<https://doi.org/10.1038/s41586-024-08025-4>

**Aaronson cryptographic watermark** -- pseudorandom next-token selection via cryptographic function with OpenAI key. Not publicly deployed. Described in:
<https://scottaaronson.blog/?p=6823>

**Watermarking survey** -- overview of schemes, robustness, and open problems.
Zhang et al. Mathematics (MDPI) 13(9), 1420, 2025.
<https://www.mdpi.com/2227-7390/13/9/1420>

---

## Linguistic and stylometric markers

**Excess vocabulary ("delve" effect)** -- corpus of 15M+ PubMed abstracts; at least 13.5% of 2024 abstracts processed with LLMs (up to 30% in some fields). Style words, not content words. Science Advances 11(17), 2025. doi:10.1126/sciadv.adt3813.
Kobak, Gonzalez-Marquez, Horvat, Lause.
<https://doi.org/10.1126/sciadv.adt3813>

**ChatGPT authorship traits** -- FW-PCA on function word frequencies; ChatGPT has stable "idiolect" (high noun density, few pronouns/adverbs). arXiv:2508.16385, 2025.
Dentella, Huang, Mansi, Grieve, Leivada.
<https://arxiv.org/abs/2508.16385>

**Japanese stylometric analysis** -- Random Forest on function word frequencies: 98.1-100% accuracy in narrow conditions. PLOS ONE 18(7), e0289658, 2023.
Soni, Wieling, Heeringa. PMC10411719.
<https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10411719/>

**The Last Fingerprint** -- em dash frequency in GPT-4.1: ~14 per 1000 words; resists formatting suppression. Linked to markdown-heavy training + RLHF. arXiv:2603.27006.
Guo et al.
<https://arxiv.org/abs/2603.27006>

---

## Bias, reliability, and limits

**GPT detectors biased against non-native writers** -- 61.3% false positive rate on TOEFL essays across 7 detectors; all detectors flagged 97.8% of TOEFL essays with at least one. Patterns (Cell Press) 4(7), 100779, 2023.
Liang, Yuksekgonul, Mao, Wu, Zou. Stanford. PMC10382961.
<https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10382961/>

**Impossibility result** -- paraphrasing attacks break all detector types; as AI and human text distributions converge, best possible detector approaches random classifier. TMLR 2023.
Sadasivan, Kumar, Balasubramanian, Wang, Feizi. University of Maryland.
<https://arxiv.org/abs/2303.11156>

**Paraphrasing evades detectors** -- retrieval-based defense partially overcomes paraphrase attacks. NeurIPS 2023.
Krishna, Song, Karpinska, Wieting, Iyyer.
<https://openreview.net/pdf?id=WbFhFvjjKj>

**Human detection ability** -- without reference: 48.8% (below chance). With reference: 61.7%. Guo et al., arXiv:2301.07597, 2023.
<https://arxiv.org/abs/2301.07597>

**Expert detection** -- daily LLM users: majority vote of 5 experts made 1 error in 300 articles, outperforming commercial detectors. arXiv:2501.15654, 2025.
Russell et al.
<https://arxiv.org/abs/2501.15654>

---

## Invisible Unicode and watermarks: what the evidence says

**Not a watermark** -- invisible Unicode chars (U+200B, U+00A0, U+202F) in LLM output are training/tokenization artifacts, not intentional watermarks. Trivially stripped; all real watermarks use token-selection instead.

Key sources:
- Originality.AI empirical test (Oct 2025): no truly invisible chars found across major LLMs; visible typographic chars only. [Gillham, J. -- Originality.AI Blog](https://originality.ai/blog/invisible-text-detector-remover)
- OpenAI on U+202F: "a quirk of large-scale reinforcement learning" (via Rumi, April 2025). [rumidocs.com](https://www.rumidocs.com/newsroom/new-chatgpt-models-seem-to-leave-watermarks-on-text)
- GPT-5 U+202F bug report (breaks macOS rendering): [OpenAI Developer Community](https://community.openai.com/t/gpt-5-non-reasoning-outputs-u-202f-narrow-no-break-space-instead-of-normal-spaces-breaks-text-rendering-on-macos-apps/1362321)
- Adversarial stylometry via zero-width chars (attack surface, not vendor watermark): Dilworth, arXiv:2508.15840. <https://arxiv.org/abs/2508.15840>

Em dash as statistical signal (confirmed tendency, not watermark):
- McGill OSS: GPT-4.1 uses ~3.28x more em dashes than humans in standard essays. <https://www.mcgill.ca/oss/article/critical-thinking-student-contributors-technology/why-did-llms-steal-our-em-dashes>

---

## Commercial tools

**GPTZero** -- perplexity + burstiness + classifier. No peer-reviewed methodology. <https://gptzero.me/news/perplexity-and-burstiness-what-is-it/>

**Turnitin AI detector** -- claims 98% accuracy, <1% FPR. Closed methodology. Several universities disabled it (Vanderbilt, Michigan State, Northwestern). Independent tests show higher FPR.

**OpenAI AI Text Classifier** -- launched Jan 31, 2023; discontinued Jul 20, 2023. Stated accuracy: 26% TPR at 9% FPR. <https://openai.com/blog/new-ai-classifier-for-indicating-ai-written-text>

**SynthID-Text (Google)** -- open-source, production-ready. <https://ai.google.dev/responsible/docs/safeguards/synthid>

**DetectGPT** -- only commercial-scale tool with full peer-reviewed methodology (ICML 2023). Open-source. <https://github.com/eric-mitchell/detect-gpt>

---

*Last updated: June 2026.*

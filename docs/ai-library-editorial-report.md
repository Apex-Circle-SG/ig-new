# AI library editorial and coverage report

The redesigned collection uses seven reader-facing paths: Start here; Working with data; How models work; Math and worked examples; Build AI systems; Responsible AI; and Reference. The library index leads to the AI hub instead of displaying every AI page at once. Existing AI URLs remain available, including the former source-notes URL, which is now a curated glossary.

## Source coverage and destinations

The original two documents and all their embedded images remain in `content/sources/ai/`. The extracted paragraph inventory is retained in `content/sources/ai/editorial/source-passages.json`; its IDs and the earlier `ai-source-coverage.md` identify the original paragraph ranges. Those IDs and filenames are editorial references, not reader-facing content. The original files, not the extraction, are authoritative for document formatting, tables and equations.

| Source material | Reader-facing destination and editorial decision |
| --- | --- |
| AI concepts, definitions, learning roadmap and careers | AI foundations, learning methods, careers and glossary. Duplicated definitions were consolidated. |
| Risk lists, governance, frameworks and agent risks | AI risk and governance; safe agents. Repeated risk codes were consolidated into meaningful explanations. The original EU AI Act summary contains overgeneralized and dated statements; the guide links to the consolidated legislation instead of repeating those assertions. |
| Business analytics, data types, preparation and classification measures | Data lifecycle, exploring data, evaluation and statistics. Scenario-forecasting lists remain in the original notes; they have not been developed into a dedicated forecasting guide. |
| Regression, model selection, optimization and search algorithms | Classical models, optimization, data analysis and statistical inference. The many named metaheuristics are retained in the original notes; not every named technique has an individual guide. |
| Distributions, sampling, significance tests, error measures and plots | Probability and statistics; statistical inference; model evaluation; glossary. Corrected the source's misleading p-value and confidence-interval formulations. The extensive distribution-name list is retained in the original notes, not presented as a verified glossary. |
| Computer vision, image features and detection | Computer vision and multimodal AI. Individual historical feature detectors are retained in the original notes and are not each described as current recommendations. |
| Classical ML, clustering, model fitting and evaluation | Learning methods, classical models, data lifecycle and evaluation. |
| Neural-network basics, activations and training | Neural network worked example, training details, optimization and glossary. The source includes inconsistent activation formulas; the reader-facing examples use explicitly stated calculations. |
| Recurrent, convolutional, residual, graph, autoencoder and generative architectures | Neural-network architectures and generative models, with a separate vision and multimodal guide. Model-specific numerical or trading performance claims lack reproducible provenance and are not presented as evidence of performance. |
| Language models, RAG, embeddings, agents and AI infrastructure | Transformers and language models; RAG and agents; prompt-to-answer workflow; safe agents. Existing vector-search and AI workflow ROI resources are linked. |
| History, professional roles and learning roadmap | AI careers and learning roadmap. Unverified historical firsts, predictions and job forecasts are not presented as current fact. |
| Worked neurons, matrices, parameter counts and backpropagation | Neural network math, neural networks by example and training details. The introductory neuron and parameter examples retain the source's numbers and explain their assumptions. |
| Mixture of experts, sequence models, attention, dropout and transformers | Neural-network architectures, transformers and training details. Simplified hand-calculation approximations are described as examples, not general model specifications. |
| GANs, autoencoders, vector retrieval, contrastive image/text learning, residual and graph networks | Generative models, RAG and vector search, architectures, and the multimodal worked guide. Source diagrams remain in the original documents; the redesigned site uses its own lightweight text-based visual summaries. |
| Diffusion, expert routing and preference-based training | Generative models and architectures introduce diffusion and expert routing. Detailed source calculations and the preference-training worked example are retained in the source inventory for future editorial verification; the proprietary-system description is not treated as a confirmed implementation. |

## Images and unresolved details

The 45 supplied images were reviewed as source material. Their visual styles, legibility and contextual attribution vary; some contain tiny text or unexplained chart values. They were removed from public page assets and replaced with responsive, text-based visual summaries in the site's palette. The unmodified originals remain embedded in the source documents; attribution and republication rights were not established. The source-neuron calculation is reproduced as accessible text and a visual sequence.

The extracted inventory includes 2,641 nonempty text paragraphs and 45 image entries. This count confirms preservation and traceability; it does **not** imply that every claim, formula, named algorithm or image has been individually validated or rewritten. Some original numerical examples depend on image layout or missing context, and extracted text can lose equation and table structure. Additional individually verified exercises and deeper references are future editorial work.

Primary references used in the reader-facing pages include the Google Machine Learning Crash Course, the original Transformer and RAG papers, NIST's statistics handbook and AI Risk Management Framework, OWASP's prompt injection guidance, and the consolidated EU AI Act. Links are provided alongside the applicable guides.

## Presentation checks

The AI hub and all 23 linked guides were opened at desktop and mobile widths; the pages returned successfully without horizontal overflow. The glossary interaction and hub links were checked. An automated WCAG A/AA scan on the hub, an article and the library index reported no violations after contrast adjustments. These checks do not replace a complete manual accessibility audit. The AI visuals are responsive HTML/CSS with readable labels; no copied source images are served in the redesigned pages. Source links were checked for reachability; the EU legislation site returned an automated-access response rather than a full page, so current legal text should be confirmed directly.

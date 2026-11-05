import Link from 'next/link';
import type { KnowledgeArticle } from '../../../../lib/library';
import styles from './ai-guide.module.css';
import { getAiGuideContent } from '../../../../lib/library/ai/catalog';
import riskGroups from '../../../../lib/library/ai/risk-register.json';

const glossary = [
  {
    title: 'Learning from data',
    terms: [
      ['Supervised learning', 'Learning from examples with target labels.'],
      ['Unsupervised learning', 'Finding structure in data without target labels.'],
      ['Reinforcement learning', 'Learning actions from interaction and reward.'],
      ['Transfer learning', 'Adapting knowledge learned for one task to another.'],
      ['Feature', 'An input used by a model.'],
      ['Target', 'The value or label a model is trained to predict.'],
      [
        'Epoch and batch',
        'An epoch is one pass through the training set; a batch is a subset used in an update.',
      ],
    ],
  },
  {
    title: 'Models and training',
    terms: [
      ['Neural network', 'A model made of connected transformations with learned parameters.'],
      ['Weight and bias', 'Parameters that control a layer’s transformation.'],
      [
        'Activation function',
        'A function that changes a layer’s output, often introducing nonlinearity.',
      ],
      ['Loss', 'A measure of mismatch between a model’s output and an objective.'],
      ['Gradient', 'A derivative that describes how a quantity changes with an input.'],
      [
        'Backpropagation',
        'A method that applies the chain rule to compute gradients through a network.',
      ],
      ['Overfitting', 'Fitting the training data in a way that performs poorly on new data.'],
      [
        'Regularization',
        'Methods used to discourage unwanted complexity and improve generalization.',
      ],
      ['Hyperparameter', 'A setting chosen for the training process or model configuration.'],
    ],
  },
  {
    title: 'Language and generative AI',
    terms: [
      ['Token', 'A unit produced by a tokenizer; it is not necessarily a whole word.'],
      ['Embedding', 'A vector representation of an input such as text or an image.'],
      ['Transformer', 'An architecture that uses attention to combine information.'],
      ['Attention', 'A mechanism for weighting information from different positions.'],
      [
        'RAG',
        'Retrieval-augmented generation: supplying retrieved information as context to a model.',
      ],
      ['Fine-tuning', 'Further training that changes the parameters of a pretrained model.'],
      ['Hallucination', 'An output that presents unsupported or incorrect information.'],
      ['AI agent', 'A system that can choose or sequence actions, often using external tools.'],
      [
        'Prompt injection',
        'Untrusted input that attempts to redirect a model’s intended behavior.',
      ],
    ],
  },
  {
    title: 'Statistics and evaluation',
    terms: [
      ['Distribution', 'A description of how values or probabilities are spread.'],
      ['Precision', 'The fraction of predicted positives that are actually positive.'],
      ['Recall', 'The fraction of actual positives that are correctly identified.'],
      ['Confusion matrix', 'A table comparing predicted and actual classes.'],
      [
        'Confidence interval',
        'An interval produced by a method designed to cover a population parameter at a specified long-run rate.',
      ],
      [
        'p-value',
        'Under a null model, the probability of results at least as extreme as those observed.',
      ],
      ['Data drift', 'A change in the distribution of input data over time.'],
      [
        'Data leakage',
        'Information entering training or evaluation in a way that would not be available in the intended use.',
      ],
    ],
  },
];
const visual: Record<string, { title: string; steps: string[]; note: string }> = {
  'ai-foundations': {
    title: 'How the ideas fit',
    steps: ['Artificial intelligence', 'Machine learning', 'Deep learning'],
    note: 'Deep learning is one family of machine-learning methods; AI also includes approaches beyond machine learning.',
  },
  'ai-data-lifecycle': {
    title: 'A model’s journey',
    steps: ['Frame the problem', 'Prepare data', 'Train & evaluate', 'Deploy & monitor'],
    note: 'The process is iterative: results and feedback may send the team back to an earlier step.',
  },
  'ai-neural-network-math': {
    title: 'One neuron, one calculation',
    steps: ['Inputs: 2, 1, 3', 'Weights: 1, −1, 1', 'Add bias: −5', 'Sum: −1', 'ReLU: 0'],
    note: 'The activation changes the weighted sum into the output of this example neuron.',
  },
  'ai-worked-exercises': {
    title: 'A simple training loop',
    steps: ['Make a prediction', 'Measure the loss', 'Calculate gradients', 'Update weights'],
    note: 'Repeat across training examples, then evaluate on data the model has not trained on.',
  },
  'ai-transformers-language': {
    title: 'From text to a response',
    steps: [
      'Tokenize',
      'Represent as vectors',
      'Apply model layers',
      'Predict next token',
      'Repeat',
    ],
    note: 'This is a simplified view of autoregressive generation; implementations differ.',
  },
  'ai-retrieval-agents': {
    title: 'A retrieval-assisted answer',
    steps: ['Question', 'Retrieve sources', 'Build context', 'Generate', 'Check support'],
    note: 'A retrieved source can be irrelevant, stale or malicious; retrieval is not a guarantee of accuracy.',
  },
  'ai-llm-workflow': {
    title: 'The path to an answer',
    steps: ['Prompt', 'Tokens', 'Context & retrieval', 'Next-token prediction', 'Review'],
    note: 'The model predicts tokens. The surrounding system determines what context and tools it can use.',
  },
  'ai-risk-governance': {
    title: 'Four connected activities',
    steps: ['Govern', 'Map', 'Measure', 'Manage'],
    note: 'NIST’s AI Risk Management Framework uses these functions to organize risk work across the lifecycle.',
  },
  'ai-generative-models': {
    title: 'Different approaches to generation',
    steps: [
      'Predict a sequence',
      'Reconstruct inputs',
      'Compete with a discriminator',
      'Denoise a sample',
    ],
    note: 'Autoregressive models, autoencoders, GANs and diffusion models learn in different ways.',
  },
};
function MiniFlow({ slug }: { slug: string }) {
  const v = visual[slug];
  if (!v) return null;
  return (
    <section className={styles.visual} aria-label={v.title}>
      <div className={styles.kicker}>THE BIG PICTURE</div>
      <h2>{v.title}</h2>
      <ol className={styles.flow}>
        {v.steps.map((step, i) => (
          <li key={step}>
            <span>{String(i + 1).padStart(2, '0')}</span>
            {step}
          </li>
        ))}
      </ol>
      <p>{v.note}</p>
    </section>
  );
}
function TopicCard({ article }: { article: KnowledgeArticle }) {
  return (
    <Link className={styles.card} href={`/library/knowledge/${article.slug}/`}>
      <span>{article.group}</span>
      <h3>{article.title}</h3>
      <p>{article.summary}</p>
      <strong>
        Explore <span aria-hidden="true">↗</span>
      </strong>
    </Link>
  );
}
export function AiGuide({
  article,
  articles,
}: {
  article: KnowledgeArticle;
  articles: KnowledgeArticle[];
}) {
  const hub = article.slug === 'ai-learning-hub';
  const glossaryPage = article.slug === 'ai-source-notes';
  const { paths, related, lesson, examples } = getAiGuideContent(article, articles);
  return (
    <article className={`shell ${styles.page}`}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/library/">Library</Link>
        <span aria-hidden="true">/</span>
        {hub ? (
          <span>AI learning hub</span>
        ) : (
          <>
            <Link href="/library/knowledge/ai-learning-hub/">AI learning hub</Link>
            <span aria-hidden="true">/</span>
            <span>{article.group}</span>
          </>
        )}
      </nav>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>
            {hub ? 'INSIGHTGINIE LEARNING HUB' : `AI LIBRARY · ${article.group.toUpperCase()}`}
          </p>
          <h1>
            {article.title}
            <span>.</span>
          </h1>
          <p className={styles.lede}>{article.summary}</p>
          {hub && (
            <div className={styles.actions}>
              <a href="#explore">Explore the guides ↓</a>
              <Link href="/library/knowledge/ai-source-notes/">Browse the glossary ↗</Link>
            </div>
          )}
        </div>
        <div className={styles.heroMark} aria-hidden="true">
          <div className={styles.orbit}>
            <i />
            <i />
            <i />
            <b>AI</b>
          </div>
        </div>
      </header>
      {hub ? (
        <>
          <section className={styles.intro}>
            <div>
              <p className={styles.kicker}>A PLACE TO BEGIN</p>
              <h2>
                Understand the ideas.
                <br />
                See how they connect.
              </h2>
            </div>
            <p>
              Follow a learning path or jump straight to the question on your mind. Each guide links
              concepts to practical examples, limitations and further reading.
            </p>
          </section>
          <div id="explore">
            {paths.map((path) => (
              <section className={styles.path} key={path.name}>
                <div className={styles.pathHeader}>
                  <div>
                    <p className={styles.kicker}>EXPLORE THE TOPIC</p>
                    <h2>{path.name}</h2>
                  </div>
                  <p>{path.description}</p>
                </div>
                <div className={styles.cards}>
                  {path.articles.map((item) => (
                    <TopicCard key={item.slug} article={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
          <section className={styles.tools}>
            <h2>Put the ideas to work</h2>
            <p>
              Explore AI tools in the library or estimate the costs and benefits of an automation
              workflow.
            </p>
            <Link href="/library/?tools=AI#tools-heading">Explore AI tools ↗</Link>
            <Link href="/tools/ai-workflow-roi/">AI workflow ROI calculator ↗</Link>
          </section>
        </>
      ) : (
        <>
          <div className={styles.articleLayout}>
            <aside className={styles.toc}>
              <p>ON THIS PAGE</p>
              <ol>
                {(lesson
                  ? lesson.steps.map((step) => ({ heading: step.title }))
                  : article.sections
                ).map((s, i) => (
                  <li key={s.heading}>
                    <a href={`#section-${i + 1}`}>{s.heading}</a>
                  </li>
                ))}
                {examples.length > 0 && (
                  <li>
                    <a href="#calculation-details">Complete calculations</a>
                  </li>
                )}
                {glossaryPage && (
                  <li>
                    <a href="#glossary">Browse the glossary</a>
                  </li>
                )}
              </ol>
            </aside>
            <div className={styles.body}>
              <MiniFlow slug={article.slug} />
              {lesson && (
                <section className={styles.lesson}>
                  <p className={styles.kicker}>WORK THROUGH THE DETAILS</p>
                  <div className={styles.formula}>{lesson.formula}</div>
                  <ol>
                    {lesson.steps.map((step, i) => (
                      <li id={`section-${i + 1}`} key={step.title}>
                        <h2>{step.title}</h2>
                        <p>{step.body}</p>
                      </li>
                    ))}
                  </ol>
                  <aside>
                    <strong>Assumptions and limits</strong>
                    <p>{lesson.limits}</p>
                  </aside>
                </section>
              )}
              {!lesson &&
                article.sections.map((section, i) => (
                  <section
                    className={styles.bodySection}
                    key={section.heading}
                    id={`section-${i + 1}`}
                  >
                    <span className={styles.sectionNumber}>{String(i + 1).padStart(2, '0')}</span>
                    <h2>{section.heading}</h2>
                    <p>{section.body}</p>
                  </section>
                ))}
              {examples.length > 0 && (
                <section className={styles.reconstructions} aria-labelledby="calculation-details">
                  <h2 id="calculation-details">Explore the complete calculations</h2>
                  <p>
                    Examples use columns for observations unless stated otherwise. Expand a
                    calculation to see its inputs, parameters and recomputed results.
                  </p>
                  {examples.map((example) => (
                    <details key={example.sourceImage}>
                      <summary>{example.title}</summary>
                      <p>{example.explain}</p>
                      <div className={styles.matrixGrid}>
                        {example.blocks.map((block) => (
                          <div className={styles.matrix} key={block.label}>
                            <div
                              className={styles.matrixScroll}
                              role="region"
                              aria-label={block.label}
                              tabIndex={0}
                            >
                              <table>
                                <caption>{block.label}</caption>
                                <tbody>
                                  {block.rows.map((row, index) => (
                                    <tr key={index}>
                                      {row.map((value, column) => (
                                        <td key={column}>{value}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                      {example.correction && (
                        <aside>
                          <strong>Reading this calculation correctly</strong>
                          <p>{example.correction}</p>
                        </aside>
                      )}
                    </details>
                  ))}
                  <p className={styles.attribution}>
                    Recalculated from the supplied learning collection. Several source sketches
                    identify Prof. Tom Yeh’s{' '}
                    <a href="https://www.byhand.ai/" target="_blank" rel="noopener noreferrer">
                      AI by Hand
                    </a>
                    ; original artwork is not reproduced here.
                  </p>
                </section>
              )}
              {article.slug === 'ai-risk-register' && (
                <section aria-label="Risk categories">
                  {riskGroups.map((group) => (
                    <details className={styles.glossary} key={group.title}>
                      <summary>{group.title}</summary>
                      <p>{group.intro}</p>
                      <dl>
                        {group.items.map((risk) => (
                          <div key={risk.title}>
                            <dt>{risk.title}</dt>
                            <dd>{risk.meaning}</dd>
                          </div>
                        ))}
                      </dl>
                      <p>
                        <strong>Control questions:</strong> {group.action}
                      </p>
                    </details>
                  ))}
                </section>
              )}
              {glossaryPage && (
                <section className={styles.bodySection} id="glossary">
                  <h2>Browse by topic</h2>
                  <p>Choose a topic and expand it to see its terms.</p>
                  {glossary.map((group) => (
                    <details className={styles.glossary} key={group.title}>
                      <summary>{group.title}</summary>
                      <dl>
                        {group.terms.map(([term, meaning]) => (
                          <div key={term}>
                            <dt>{term}</dt>
                            <dd>{meaning}</dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                  ))}
                </section>
              )}
              {article.slug === 'ai-worked-exercises' && (
                <div className={styles.example}>
                  <strong>Try it yourself</strong>
                  <p>
                    If the bias changes from −5 to −2, the weighted sum is 2 − 1 + 3 − 2 = 2, and
                    ReLU returns 2.
                  </p>
                  <Link href="/library/knowledge/ai-neural-network-math/">
                    Explore weights and parameters ↗
                  </Link>
                </div>
              )}
              {article.sources.length > 0 && (
                <section className={styles.sources}>
                  <h2>Go deeper</h2>
                  <p>Explore the original research and documentation behind these concepts.</p>
                  <ul>
                    {article.sources.map((source) => (
                      <li key={source.url}>
                        <a href={source.url} target="_blank" rel="noopener noreferrer">
                          {source.title} ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
          <section className={styles.path}>
            <div className={styles.pathHeader}>
              <div>
                <p className={styles.kicker}>KEEP EXPLORING</p>
                <h2>{related.length ? 'Continue learning' : 'Find your next topic'}</h2>
              </div>
              <p>Connect this idea to the rest of the AI learning hub.</p>
            </div>
            <div className={styles.cards}>
              {related.map((item) => (
                <TopicCard key={item.slug} article={item} />
              ))}
            </div>
            <p className={styles.backHub}>
              <Link href="/library/knowledge/ai-learning-hub/">← All AI learning paths</Link>
            </p>
          </section>
        </>
      )}
    </article>
  );
}

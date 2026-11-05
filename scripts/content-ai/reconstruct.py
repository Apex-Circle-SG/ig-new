"""Reconstruct arithmetic from the supplied AI exercises, with explicit corrections.
This generates publication data, not a claim that the supplied diagrams are exact models.
"""

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
cases = []


def matrix_product(a, b):
    assert len(a[0]) == len(b)
    return [[sum(x * y for x, y in zip(row, col)) for col in zip(*b)] for row in a]


def add_matrices(a, b):
    return [[x + y for x, y in zip(r, s)] for r, s in zip(a, b)]


def with_bias(x):
    return x + [[1] * len(x[0])]


def relu(x):
    return [[max(0, v) for v in row] for row in x]


def transpose(x):
    return [list(r) for r in zip(*x)]


def scale_matrix(x, f):
    return [[v * f for v in r] for r in x]


def subtract_matrices(a, b):
    return add_matrices(a, scale_matrix(b, -1))


def sigmoid(x):
    return 1 / (1 + math.exp(-x))


def column_softmax(x):
    cols = []
    for c in zip(*x):
        z = [math.exp(v - max(c)) for v in c]
        cols.append([v / sum(z) for v in z])
    return transpose(cols)


def matrix_block(label, rows):
    return {
        "label": label,
        "rows": [[round(v, 5) if isinstance(v, float) else v for v in r] for r in rows],
    }


def add_case(i, slug, title, explain, blocks, correction=""):
    cases.append(
        {
            "sourceImage": i,
            "slug": slug,
            "title": title,
            "explain": explain,
            "blocks": blocks,
            "correction": correction,
        }
    )


x = [[2], [1], [3]]
w = [[1, -1, 1, -5], [1, 1, 0, 0], [0, 1, 1, 1], [1, 0, 1, -2]]
h = relu(matrix_product(w, with_bias(x)))
w2 = [[1, 1, -1, 0, 0], [0, 0, 1, -1, 1]]
add_case(
    1,
    "ai-neural-network-math",
    "The original one-neuron calculation",
    "Multiply corresponding inputs and weights, then add the bias. ReLU replaces the negative result with zero.",
    [
        matrix_block("Inputs", x),
        matrix_block("Weights and final bias column", [w[0]]),
        matrix_block("Weighted sum", [[-1]]),
        matrix_block("ReLU output", [[0]]),
    ],
)
add_case(
    2,
    "ai-worked-exercises",
    "Four neurons sharing one input",
    "Each row defines a different neuron. The final column is its bias.",
    [
        matrix_block("Weights and bias", w),
        matrix_block("Input", x),
        matrix_block("Output", h),
    ],
    "The handwritten four-node picture writes 4 for the third output. Its printed weights give 0×2 + 1×1 + 1×3 + 1 = 5; the text in the collection also gives 5.",
)
add_case(
    3,
    "ai-worked-exercises",
    "A complete two-layer network",
    "The second layer receives four hidden values. Biases are appended as a row of ones for the matrix calculation.",
    [
        matrix_block("Hidden layer", h),
        matrix_block("Second-layer weights and bias", w2),
        matrix_block("Second preactivation", matrix_product(w2, with_bias(h))),
        matrix_block("Final ReLU output", relu(matrix_product(w2, with_bias(h)))),
    ],
)
xb = [[2, 1, 0], [1, 1, 1], [3, 0, 1]]
hb = relu(matrix_product(w, with_bias(xb)))
add_case(
    4,
    "ai-matrix-multiplication",
    "Process three examples together",
    "Examples are columns. The same parameters are reused for each example.",
    [
        matrix_block("Input batch", xb),
        matrix_block("Hidden batch", hb),
        matrix_block("Output batch", relu(matrix_product(w2, with_bias(hb)))),
    ],
)
ws = [
    [[0, 0, 1], [0, 1, 0], [1, 0, 0], [1, 1, 0], [0, 1, 1]],
    [[1, 1, -1, 0, 0], [0, 0, 1, 1, -1]],
    [[1, 1], [1, -1], [1, 2]],
    [[1, -1, 0], [0, -1, 1]],
    [[0, 1], [1, 0]],
    [[1, -1], [1, 1]],
    [[1, -1]],
]
z = [[3, 5], [4, 4], [5, 3]]
blocks = [matrix_block("Two input examples", z)]
for i, wi in enumerate(ws):
    z = matrix_product(wi, z)
    if i < 6:
        z = relu(z)
    blocks.extend(
        [
            matrix_block("Layer " + str(i + 1) + " weights", wi),
            matrix_block("Layer " + str(i + 1) + " output", z),
        ]
    )
add_case(
    5,
    "ai-worked-exercises",
    "Follow seven layers",
    "The first six layers use ReLU; the final layer stays linear. No biases are shown in this exercise.",
    blocks,
    "Applying ReLU to the final layer would erase its negative outputs and change the exercise.",
)
xx = [[2, 3], [1, 1], [3, 2]]
router = [[1, 1, 0, 0], [0, 1, 1, 0]]
e1 = [[1, 0, 1, 0], [1, 1, 0, 0], [0, 0, 1, 0], [-1, 0, 1, 0]]
e2 = [[0, 1, 1, 0], [1, 1, 0, 0], [1, -1, 0, 0], [1, 0, 1, 0]]
add_case(
    6,
    "ai-expert-routing",
    "Route two tokens to different experts",
    "Column one selects expert two; column two selects expert one. Expert outputs then pass through ReLU.",
    [
        matrix_block("Tokens", xx),
        matrix_block("Router scores", matrix_product(router, with_bias(xx))),
        matrix_block("Expert one parameters", e1),
        matrix_block("Expert two parameters", e2),
        matrix_block("Routed output", [[4, 5], [3, 4], [1, 2], [5, 0]]),
    ],
)
A = [[1, -1], [1, 1]]
B = [[1], [2]]
C = [[-1, 1]]
state = [[0], [0]]
states = []
ys = []
for v in [3, 4, 5, 6]:
    state = relu(add_matrices(matrix_product(A, state), scale_matrix(B, v)))
    states.append([r[0] for r in state])
    ys.append(matrix_product(C, state)[0][0])
add_case(
    7,
    "ai-sequence-state-example",
    "A recurrent network across four inputs",
    "The same A, B and C are reused at each step. ReLU is applied to the hidden state.",
    [
        matrix_block("A", A),
        matrix_block("B", B),
        matrix_block("C", C),
        matrix_block("Inputs", [[3, 4, 5, 6]]),
        matrix_block("Hidden states", transpose(states)),
        matrix_block("Outputs", [ys]),
    ],
)
state = [[0], [0]]
history = []
ys = []
Bs = [[-1, 2], [-2, -2], [-3, 3], [-1, 1]]
Cs = [[-2, -3], [-1, 1], [-5, 4], [3, 1]]
As = [[[1, 0], [0, -1]], [[1, 0], [0, -1]], [[-1, 0], [0, 1]], [[-1, 0], [0, 1]]]
for v, ai, bi, ci in zip([3, 4, 5, 6], As, Bs, Cs):
    state = add_matrices(matrix_product(ai, state), scale_matrix(transpose([bi]), v))
    history.append([r[0] for r in state])
    ys.append(matrix_product([ci], state)[0][0])
add_case(
    8,
    "ai-sequence-state-example",
    "Input-dependent state updates",
    "Here the exercise changes A, B and C between positions. The recurrence has no nonlinear activation.",
    [
        matrix_block("B vectors by time", Bs),
        matrix_block("C vectors by time", Cs),
        matrix_block("A diagonals by time", [[a[0][0], a[1][1]] for a in As]),
        matrix_block("Hidden states", transpose(history)),
        matrix_block("Outputs", [ys]),
    ],
    "This describes the supplied toy recurrence, not a complete Mamba implementation.",
)
ma = [[1, 1], [-1, 1]]
mb = [[1, 5, 2], [2, 4, 2]]
add_case(
    9,
    "ai-matrix-multiplication",
    "The original matrix product",
    "A 2×2 matrix multiplies a 2×3 matrix to give a 2×3 result.",
    [
        matrix_block("A", ma),
        matrix_block("B", mb),
        matrix_block("A × B", matrix_product(ma, mb)),
    ],
)
vocab = ["I", "you", "they", "are", "am", "how", "why", "where", "who", "what"]
ps = [
    [0.01, 0.01, 0.01, 0.01, 0.01, 0.50, 0.10, 0.10, 0.15, 0.10],
    [0.01, 0.01, 0.01, 0.40, 0.40, 0.05, 0.05, 0.05, 0.01, 0.01],
    [0.03, 0.50, 0.40, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01],
]
add_case(
    10,
    "ai-softmax-sampling",
    "Sample “how are you” from the original probabilities",
    "The drawing accumulates probabilities from the bottom of its vocabulary list. Reversing the order into an ordinary cumulative list preserves its interval convention.",
    [
        {"label": "Vocabulary in the drawing", "rows": [[v] for v in vocab]},
        matrix_block("Probabilities, one row per generated position", ps),
        matrix_block("Uniform draws", [[0.65, 0.92, 0.52]]),
    ],
    "The probabilities are supplied to illustrate sampling; they are not calculated from a real language model in the exercise. Each row sums to one.",
)
mid = [[1, -1, 1, 0], [0, 1, -1, 1]]
last = [[1, -1, 2], [-1, 1, 1], [1, -2, -2], [2, 1, 0], [-3, 0, 1]]
m = relu(matrix_product(mid, h))
logits = matrix_product(last, with_bias(m))
add_case(
    11,
    "ai-worked-exercises",
    "A three-layer perceptron with mixed activations",
    "The middle layer has no bias; the first and last do. A sigmoid is applied independently to the five final scores.",
    [
        matrix_block("Middle weights", mid),
        matrix_block("Middle activation", m),
        matrix_block("Final weights and bias", last),
        matrix_block("Final scores", logits),
        matrix_block("Sigmoid output", [[sigmoid(v[0])] for v in logits]),
    ],
    "Independent sigmoid outputs need not sum to one; use softmax when a single categorical distribution is intended.",
)
bp2 = [[1, -1, 1, 0, 0], [0, 1, -1, 1, 3]]
bp3 = [[2, 0, -1], [0, 2, -5], [1, 1, 1]]
a2 = relu(matrix_product(bp2, with_bias(h)))
scores = matrix_product(bp3, with_bias(a2))
probs = column_softmax(scores)
g = subtract_matrices(probs, [[0], [1], [0]])
gw3 = matrix_product(g, transpose(with_bias(a2)))
ga2 = matrix_product(transpose([row[:-1] for row in bp3]), g)
gz2 = ga2
gw2 = matrix_product(gz2, transpose(with_bias(h)))
ga1 = matrix_product(transpose([row[:-1] for row in bp2]), gz2)
gz1 = [[r[0] if h[i][0] > 0 else 0] for i, r in enumerate(ga1)]
add_case(
    12,
    "ai-backpropagation-example",
    "Backpropagate through the original three layers",
    "Use softmax and cross-entropy with target [0,1,0]. The original sketch rounds the third class probability to zero; these gradients retain it.",
    [
        matrix_block("Second-layer parameters", bp2),
        matrix_block("Second-layer activation", a2),
        matrix_block("Third-layer parameters", bp3),
        matrix_block("Logits", scores),
        matrix_block("Exact softmax", probs),
        matrix_block("Output-logit gradient", g),
        matrix_block("Final weights and bias gradient", gw3),
        matrix_block("Second weights and bias gradient", gw2),
        matrix_block(
            "First weights and bias gradient",
            matrix_product(gz1, transpose(with_bias(x))),
        ),
    ],
    "Rounded [0.5,0.5,0] probabilities are a teaching approximation. The exact logits [3,3,−1] give a small positive third probability; gradients change accordingly.",
)
X = [[5, 6, 0, 7, 0], [0, 2, 4, 0, 3], [1, 0, 1, 1, 0]]
att = [
    [1, 0, 0, 0, 1],
    [1, 1, 0, 0, 0],
    [0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0],
    [0, 0, 0, 1, 1],
]
Z = matrix_product(X, att)
f1 = [[1, -1, 0, 1], [1, 1, 0, 0], [0, 1, 1, 1], [-1, 1, 1, 0]]
f2 = [[1, 0, 0, -1, 0], [0, 1, 1, 0, 0], [0, 0, 1, -1, 1]]
add_case(
    13,
    "ai-attention-example",
    "A position-wise feed-forward block",
    "The exercise supplies an attention mixing matrix, then applies the same feed-forward weights at each position.",
    [
        matrix_block("Input positions", X),
        matrix_block("Supplied mixing matrix", att),
        matrix_block("Mixed features", Z),
        matrix_block("First FFN parameters", f1),
        matrix_block("First activation", relu(matrix_product(f1, with_bias(Z)))),
        matrix_block("Second FFN parameters", f2),
        matrix_block(
            "FFN output",
            matrix_product(f2, with_bias(relu(matrix_product(f1, with_bias(Z))))),
        ),
    ],
    "The supplied columns sum to two, not one. This is an unnormalized mixing example, not a softmax attention matrix or a full transformer block.",
)
bx = [[1, 0, 3, 0], [0, 3, 1, 1], [2, 1, 0, 2]]
bw = [[1, 0, 1, 0], [1, 1, 0, -1], [0, 2, -1, 0]]
ba = relu(matrix_product(bw, with_bias(bx)))
means = [sum(r) / len(r) for r in ba]
var = [sum((v - m) ** 2 for v in r) / len(r) for r, m in zip(ba, means)]
norm = [[(v - m) / math.sqrt(s + 1e-5) for v in r] for r, m, s in zip(ba, means, var)]
add_case(
    14,
    "ai-normalization-dropout",
    "Normalize the original four-example batch",
    "Statistics are computed separately for each feature across the batch. This reconstruction uses population variance plus ε = 0.00001.",
    [
        matrix_block("Inputs", bx),
        matrix_block("Linear parameters", bw),
        matrix_block("ReLU activations", ba),
        matrix_block("Means", [means]),
        matrix_block("Variances", [var]),
        matrix_block("Normalized features", norm),
        matrix_block("Scale and shift (γ, β)", [[2, 0], [3, 0], [-1, 1]]),
        matrix_block(
            "Scaled and shifted output",
            [
                [v * g + b for v in row]
                for row, g, b in zip(norm, [2, 3, -1], [0, 0, 1])
            ],
        ),
    ],
    "The drawing rounds means and variances to integers. Exact means are [2.25,1.25,1.75], so its rounded normalization does not produce exactly zero mean and unit variance.",
)
noise = [[1, 1, 0, 1], [1, 0, 1, -1]]
g1 = [[1, 1, 0], [0, 1, 2], [-1, 1, 0]]
g2 = [[-1, 1, 0, 0], [1, 0, 1, 0], [0, 1, 1, 0], [0, 0, 1, 1]]
fake = relu(matrix_product(g2, with_bias(relu(matrix_product(g1, with_bias(noise))))))
real = [[2, 3, 3, 4], [1, 1, 1, 1], [2, 3, 4, 3], [1, 1, 1, 1]]
dw = [[1, 0, 0, -1, 0], [0, 1, 1, 0, 0], [0, 0, 1, -1, 1]]
do = [[1, 1, -1, -1]]
df = matrix_product(do, with_bias(relu(matrix_product(dw, with_bias(fake)))))
dr = matrix_product(do, with_bias(relu(matrix_product(dw, with_bias(real)))))
add_case(
    15,
    "ai-generative-training-example",
    "Calculate the original GAN forward pass",
    "The generator turns four noise examples into four fake examples. A shared discriminator scores both real and fake examples.",
    [
        matrix_block("Noise", noise),
        matrix_block("Generator first layer", g1),
        matrix_block("Generator second layer", g2),
        matrix_block("Generated examples", fake),
        matrix_block("Real examples", real),
        matrix_block("Discriminator hidden parameters", dw),
        matrix_block("Discriminator output parameters", do),
        matrix_block("Fake logits", df),
        matrix_block("Real logits", dr),
        matrix_block("Fake sigmoid scores", [[sigmoid(v) for v in df[0]]]),
        matrix_block("Real sigmoid scores", [[sigmoid(v) for v in dr[0]]]),
    ],
    "For binary cross-entropy the logit gradient is prediction minus target before reduction. Rounded sigmoid values in the drawing are not exact probabilities.",
)
features = [
    [2, 0, 0, 2],
    [0, 1, 0, 0],
    [0, 2, 1, 0],
    [0, 0, 1, 1],
    [2, 0, 0, 0],
    [1, 0, 1, 1],
]
wq = [[1, 1, 0, 0, 0, 0], [0, 1, 0, 1, 0, 0], [0, 0, 1, 0, 1, 1]]
wk = [[0, 0, 1, 0, 0, 0], [0, 1, 0, 0, 0, 0], [1, 0, 0, 0, 0, -1]]
wv = [[10, 0, 0, 0, 0, 0], [0, 0, 0, 10, 0, 0], [0, 10, 0, 0, 0, 0]]
q = matrix_product(wq, features)
k = matrix_product(wk, features)
v = matrix_product(wv, features)
scores = matrix_product(transpose(k), q)
weights = column_softmax(scale_matrix(scores, 1 / math.sqrt(3)))
add_case(
    16,
    "ai-attention-example",
    "Exact attention from the four-position exercise",
    "Examples are columns here. Normalize each query column of KᵀQ, then multiply V by those weights.",
    [
        matrix_block("Input features", features),
        matrix_block("Query weights", wq),
        matrix_block("Key weights", wk),
        matrix_block("Value weights", wv),
        matrix_block("Q", q),
        matrix_block("K", k),
        matrix_block("V", v),
        matrix_block("Unscaled scores", scores),
        matrix_block("Exact attention weights", weights),
        matrix_block("Weighted values", matrix_product(v, weights)),
    ],
    "The source replaces division by √3 with a floor-based shortcut and exp(x) with powers of three, then rounds again. Those approximations can substantially change the output; this table uses the exact stated attention formula.",
)
dx = [[3, 5], [4, 1]]
dw1 = [[1, 0, 0], [1, 1, 0], [0, 1, 1], [1, -1, 0]]
hidden = relu(matrix_product(dw1, with_bias(dx)))
dropped = [
    scale_matrix([r], 2)[0] if i in [0, 2] else [0] * 2 for i, r in enumerate(hidden)
]
dw2 = [[1, 0, 0, 1, 0], [0, 1, 1, 0, 0], [1, 0, -1, -1, 1]]
hidden2 = relu(matrix_product(dw2, with_bias(dropped)))
dropped2 = [
    scale_matrix([r], 1.5)[0] if i in [0, 1] else [0] * 2 for i, r in enumerate(hidden2)
]
dw3 = [[1, -1, 0, 0], [0, 1, -1, -2]]
out = matrix_product(dw3, with_bias(dropped2))
target = [[-4, 7], [10, 5]]
add_case(
    17,
    "ai-normalization-dropout",
    "Trace two dropout masks",
    "The first mask keeps units one and three at p=1/2. The second keeps units one and two at p=1/3. These are fixed sampled masks, not a deterministic rule.",
    [
        matrix_block("Training inputs", dx),
        matrix_block("First linear parameters", dw1),
        matrix_block("First activation", hidden),
        matrix_block("First masked activation", dropped),
        matrix_block("Second linear parameters", dw2),
        matrix_block("Second activation", hidden2),
        matrix_block("Second masked activation", dropped2),
        matrix_block("Final parameters", dw3),
        matrix_block("Output", out),
        matrix_block("Target", target),
        matrix_block(
            "Mean-squared-error gradient over all four entries",
            scale_matrix(subtract_matrices(out, target), 0.5),
        ),
    ],
    "The source uses 2(Y−target), which is the gradient of a sum of squared errors. Mean squared error over four entries divides that by four. Its approximate p=0.33 and scale 1.5 are made exact here by stating p=1/3.",
)
ax = [[1, 1, 2, 1], [2, 1, 2, 0], [3, 2, 4, 1], [1, 1, 2, 1]]
ae1 = [[1, 0, 0, 1, 0], [0, 1, 1, 0, 0], [-1, 0, 1, 0, -1]]
ae2 = [[1, 0, 1, 0], [-1, 1, 0, 0]]
ad1 = [[1, 0, 0], [0, 1, 1], [1, -1, 0]]
ad2 = [[1, 0, -1, 0], [1, -1, 0, 0], [0, 0, 1, 1], [0, 1, 1, -3]]
encoded = relu(matrix_product(ae2, with_bias(relu(matrix_product(ae1, with_bias(ax))))))
decoded = matrix_product(ad2, with_bias(relu(matrix_product(ad1, with_bias(encoded)))))
add_case(
    18,
    "ai-generative-training-example",
    "Reconstruct four examples with an autoencoder",
    "The two-dimensional bottleneck is decoded back into four dimensions. Targets equal the original inputs.",
    [
        matrix_block("Input and target", ax),
        matrix_block("Encoder layer one", ae1),
        matrix_block("Encoder layer two", ae2),
        matrix_block("Bottleneck", encoded),
        matrix_block("Decoder layer one", ad1),
        matrix_block("Decoder layer two", ad2),
        matrix_block("Reconstruction", decoded),
        matrix_block("Reconstruction error", subtract_matrices(decoded, ax)),
        matrix_block(
            "MSE gradient over sixteen entries",
            scale_matrix(subtract_matrices(decoded, ax), 2 / 16),
        ),
    ],
    "A drawing of 2(Y−target) represents a sum-of-squares gradient. Averaging over all sixteen entries divides it by sixteen.",
)
add_case(
    19,
    "ai-vector-search-example",
    "Rank the original three sentence vectors",
    "After the toy encoder, pooling and projection, rank candidates by raw dot product. These supplied projected vectors are enough to reproduce retrieval.",
    [
        matrix_block(
            "Stored vectors as columns", [[5 / 3, 5 / 3, 7 / 3], [2 / 3, 0, 2 / 3]]
        ),
        matrix_block("Query vector", [[8 / 3], [2 / 3]]),
        matrix_block("Query dot products", [[44 / 9, 40 / 9, 60 / 9]]),
    ],
    "The result selects “who am I” among the three supplied sentences. Projection is not required by all vector indexes, and raw dot product is not cosine similarity.",
)
T = [[1, 0, -1], [1, 2, 0]]
I = [[2, 1, 2], [0, 0, 1]]
sim = matrix_product(transpose(I), T)
add_case(
    20,
    "ai-multimodal-worked",
    "Contrastive scores for three text–image pairs",
    "Use the projected vectors shown in the source to compute all nine pairwise similarities. Normalize rows for image-to-text and columns for text-to-image.",
    [
        matrix_block("Text vectors", T),
        matrix_block("Image vectors", I),
        matrix_block("Image-by-text dot products", sim),
        matrix_block(
            "Image-to-text probabilities", transpose(column_softmax(transpose(sim)))
        ),
        matrix_block("Text-to-image probabilities", column_softmax(sim)),
    ],
    "The source rounds pooling values, substitutes powers of three for exponentials and rounds probabilities. The reconstruction starts from its displayed projected vectors and uses actual exponentials. It does not claim the preceding rounded encoders are exact CLIP.",
)
rx = [[2, 1, 0], [0, 3, 4], [1, 0, 2]]
rw1 = [[1, 1, 0, 0], [0, 1, -1, 0], [1, 0, 1, -1]]
rw2 = [[0, 0, 1, 0], [-1, 0, 0, 0], [0, -1, 0, 0]]
rh = relu(matrix_product(rw1, with_bias(rx)))
res = relu(add_matrices(rx, matrix_product(rw2, with_bias(rh))))
add_case(
    21,
    "ai-residual-graph-example",
    "The original residual block",
    "Apply two affine maps and add the untouched input before the last ReLU.",
    [
        matrix_block("Input", rx),
        matrix_block("First layer", rw1),
        matrix_block("First activation", rh),
        matrix_block("Second layer", rw2),
        matrix_block("Residual result", res),
    ],
    "The accompanying transformer drawing omits normalization and uses a supplied unnormalized mixing matrix. Its concept is residual addition; it is not a complete standard encoder.",
)
gx = [[2, 0, 1, 0, 1], [1, 1, 0, 0, 0], [0, 0, -1, 1, 1], [0, 3, 0, 1, 0]]
adj = [
    [1, 0, 1, 0, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1],
    [0, 1, 0, 1, 1],
    [0, 0, 1, 1, 1],
]
gw1 = [[1, 1, 0, 0, 0], [0, 1, 0, -1, 0], [1, 0, 0, 1, -1]]
gw2 = [[0, 1, 1, 1], [1, -1, 0, -2], [1, 0, 0, 0]]
gm1 = relu(matrix_product(gw1, with_bias(gx)))
ga1 = matrix_product(gm1, adj)
gm2 = relu(matrix_product(gw2, with_bias(ga1)))
ga2 = matrix_product(gm2, adj)
add_case(
    22,
    "ai-residual-graph-example",
    "Two rounds of graph aggregation",
    "Node features are columns; adjacency includes self-loops. Each round transforms node features and sums messages with the displayed adjacency.",
    [
        matrix_block("Input features", gx),
        matrix_block("Adjacency with self-loops", adj),
        matrix_block("First-layer parameters", gw1),
        matrix_block("First messages", gm1),
        matrix_block("First aggregation", ga1),
        matrix_block("Second-layer parameters", gw2),
        matrix_block("Second messages", gm2),
        matrix_block("Second aggregation", ga2),
    ],
    "This is an unnormalized message-summing example. Normalized graph convolutions use a different operator. The tables are recalculated from the printed parameters rather than trusting handwritten intermediate values.",
)
latent = [[1, 0, 0, 1], [3, 2, 6, 1]]
eps = [[0, 2, 1, -1], [-1, 0, -2, 1]]
noisy = add_matrices(latent, eps)
conditioned = [[2 * v - 1 for v in noisy[0]], [-v + 5 for v in noisy[1]]]
mix = [[1, 0, 0, 0], [1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 1]]
mixed = matrix_product(conditioned, mix)
pw = [[-1, 1, -2], [0, 1, -5]]
prediction = matrix_product(pw, with_bias(mixed))
add_case(
    23,
    "ai-generative-training-example",
    "The diffusion sketch’s noise-prediction calculation",
    "The source takes encoded patches, adds supplied noise, applies a conditioning transform and mixes positions before predicting noise.",
    [
        matrix_block("Latent patches", latent),
        matrix_block("Supplied noise", eps),
        matrix_block("Noisy latents", noisy),
        matrix_block("Conditioned latents", conditioned),
        matrix_block("Position mixing", mix),
        matrix_block("Mixed features", mixed),
        matrix_block("Predictor weights and bias", pw),
        matrix_block("Predicted noise", prediction),
        matrix_block(
            "Noise-prediction MSE gradient over eight entries",
            scale_matrix(subtract_matrices(prediction, eps), 2 / 8),
        ),
    ],
    "This toy arithmetic does not reproduce a commercial video system. The source’s one-step subtraction and rounded loss gradients are not a general diffusion sampling algorithm.",
)
switch = [[1, -1, 0], [1, 0, -2], [-1, 1, 1]]
gates = matrix_product(switch, Z)
expert_parameters = [
    [[1, 0, -1, 0], [0, 1, 0, 0], [0, 0, -1, 1]],
    [[0, 0, -1, 0], [1, 0, 0, 0], [1, 1, -1, 1]],
    [[1, 0, 0, 0], [0, 1, 1, 1], [0, 1, 0, 0]],
]
selected_experts = []
expert_usage = [0, 0, 0]
routed_columns = []
for column, scores in enumerate(zip(*gates)):
    expert = max(range(3), key=lambda index: scores[index])
    selected_experts.append("ABC"[expert])
    token = [[row[column]] for row in Z]
    if expert_usage[expert] >= 2:
        routed_columns.append([row[0] for row in token])
    else:
        expert_usage[expert] += 1
        transformed = matrix_product(expert_parameters[expert], with_bias(token))
        routed_columns.append([row[0] for row in transformed])
add_case(
    24,
    "ai-expert-routing",
    "Route five mixed token vectors",
    "The printed router selects A, B, A, B and B when tied scores use the first expert. Each expert can process two tokens; the fifth token bypasses the already-full expert B unchanged.",
    [
        matrix_block("Mixed token features", Z),
        matrix_block("Router weights", switch),
        matrix_block("Recomputed gate scores", gates),
        {"label": "Recomputed selected experts", "rows": [selected_experts]},
        matrix_block(
            "Output after expert processing and overflow bypass",
            transpose(routed_columns),
        ),
    ],
    "The handwritten scores for expert C and routes A,C,C,B,C do not follow the printed router weights. The reconstruction follows those printed weights, states its first-expert tie convention, and recalculates capacity and outputs. No expert output activation or routing scale is assumed where the source omits it.",
)
add_case(
    25,
    "ai-preference-training",
    "Reproduce the reward gap precisely",
    "The reward model assigns scores 3 and 5 to a declared rejected/preferred pair. Learning the comparison is separate from optimizing the language-model policy.",
    [
        matrix_block("Rejected and preferred rewards", [[3, 5]]),
        matrix_block("Gap", [[2]]),
        matrix_block("Sigmoid of gap", [[sigmoid(2)]]),
        matrix_block("Pairwise loss", [[-math.log(sigmoid(2))]]),
        matrix_block("Derivative with respect to gap", [[sigmoid(2) - 1]]),
    ],
    "The source’s 0.9 and −0.1 are rounded. A preference label is a judgment under specified criteria, not an objective proof of unbiased language or truth.",
)
# Complete the larger source pipelines rather than retaining only their final scores.
by_image = {item["sourceImage"]: item for item in cases}
encoder = [[1, 1, 0, 0, 0], [0, 1, 0, 1, 0], [1, 0, 1, 0, -1], [1, -1, 0, 0, 0]]
projection = [[1, 1, 0, 0], [0, 0, 1, 1]]
sentences = [
    [[1, 0, 0], [0, 1, 1], [1, 1, 0], [0, 0, 0]],
    [[1, 0, 0], [0, 1, 1], [0, 1, 0], [0, 0, 0]],
    [[1, 1, 1], [0, 0, 2], [0, 1, 0], [0, 0, 0]],
    [[1, 1, 0], [0, 2, 1], [1, 0, 0], [0, 0, 0]],
]
outputs = [relu(matrix_product(encoder, with_bias(values))) for values in sentences]
pooled = [[[sum(row) / len(row)] for row in values] for values in outputs]
projected = [matrix_product(projection, values) for values in pooled]
by_image[19]["blocks"] = [
    matrix_block("Toy sentence encoder and bias", encoder),
    matrix_block("Projection", projection),
]
for label, values, encoded_values, mean_values, index_values in zip(
    ["how are you", "who are you", "who am I", "am I you"],
    sentences,
    outputs,
    pooled,
    projected,
):
    by_image[19]["blocks"] += [
        matrix_block(label + " token vectors", values),
        matrix_block(label + " encoded tokens", encoded_values),
        matrix_block(label + " mean", mean_values),
        matrix_block(label + " projected vector", index_values),
    ]
by_image[19]["blocks"].append(
    matrix_block(
        "Query dot products",
        [
            [
                sum(x[0] * y[0] for x, y in zip(projected[-1], candidate))
                for candidate in projected[:-1]
            ]
        ],
    )
)
text_inputs = [
    [[1, 0], [0, 1], [1, 1]],
    [[0, 1], [1, 0], [0, 0]],
    [[1, 0], [0, 0], [1, 0]],
]
image_inputs = [
    [[1, 1], [1, 1], [1, 0], [0, 1]],
    [[0, 0], [0, 1], [0, 1], [0, 1]],
    [[0, 1], [1, 0], [1, 1], [1, 1]],
]
text_encoder = [[1, 0, 1, 0], [0, 3, 0, -2], [1, 1, 0, 1]]
image_encoder = [[1, 1, 0, 0, 0], [0, 1, 0, 1, 1], [0, 0, 1, -1, 1], [0, 1, 1, 1, -1]]
text_projection = [[1, 1, 0, -2], [0, 1, 1, -2]]
image_projection = [[-1, 1, 1, 0, -1], [0, 0, -1, 1, 0]]
by_image[20]["blocks"] += [
    matrix_block("Text encoder and bias", text_encoder),
    matrix_block("Image encoder and bias", image_encoder),
    matrix_block("Text projection and bias", text_projection),
    matrix_block("Image projection and bias", image_projection),
]
exact_text = []
exact_image = []
for index, (text_values, image_values) in enumerate(zip(text_inputs, image_inputs), 1):
    text_features = relu(matrix_product(text_encoder, with_bias(text_values)))
    image_features = relu(matrix_product(image_encoder, with_bias(image_values)))
    text_mean = [[sum(row) / len(row)] for row in text_features]
    image_mean = [[sum(row) / len(row)] for row in image_features]
    exact_text.append(matrix_product(text_projection, with_bias(text_mean)))
    exact_image.append(matrix_product(image_projection, with_bias(image_mean)))
    by_image[20]["blocks"] += [
        matrix_block(f"Pair {index} text input", text_values),
        matrix_block(f"Pair {index} image patches", image_values),
        matrix_block(f"Pair {index} exact text mean", text_mean),
        matrix_block(f"Pair {index} exact image mean", image_mean),
    ]
exact_image_rows = [[value[0] for value in vector] for vector in exact_image]
exact_text_rows = [[value[0] for value in vector] for vector in exact_text]
exact_scores = matrix_product(exact_image_rows, transpose(exact_text_rows))
by_image[20]["blocks"].append(
    matrix_block("Similarities without rounding pooled features", exact_scores)
)
tx = [[2, 0, 1], [1, 3, -2]]
ta = [[1, 0, 1], [1, 1, 0], [0, 1, 1]]
tm = add_matrices(tx, matrix_product(tx, ta))
tf1 = [[1, 1, 1], [1, -1, 2]]
tf2 = [[0, -1, 3], [-1, 0, 0]]
by_image[21]["blocks"] += [
    matrix_block("Transformer toy input", tx),
    matrix_block("Transformer supplied mixing", ta),
    matrix_block("Attention plus input", tm),
    matrix_block("FFN first parameters", tf1),
    matrix_block("FFN second parameters", tf2),
    matrix_block(
        "FFN plus residual with toy ReLU",
        relu(
            add_matrices(
                tm,
                matrix_product(
                    tf2, with_bias(relu(matrix_product(tf1, with_bias(tm))))
                ),
            )
        ),
    ),
]
fc1 = [[1, 0, 0, -2], [0, 1, 0, -2], [0, 0, 1, -5], [1, -1, 0, 0], [1, 0, -1, 0]]
fc2 = [[1, 1, 1, 1, 1, -9]]
fc_hidden = relu(matrix_product(fc1, with_bias(ga2)))
fc_logits = matrix_product(fc2, with_bias(fc_hidden))
by_image[22]["blocks"] += [
    matrix_block("Final dense layer one", fc1),
    matrix_block("Final dense activation", fc_hidden),
    matrix_block("Final dense layer two", fc2),
    matrix_block("Final logits", fc_logits),
    matrix_block("Exact sigmoid node outputs", [[sigmoid(v) for v in fc_logits[0]]]),
]
patches = [[1, 0, 0, 1], [2, 0, 1, 0], [0, 1, 3, 0], [0, 1, 4, 0]]
ve = [[1, 0, -1, 0, 0], [0, 1, 0, 1, 1]]
vd = [[1, 0, 1], [0, 1, 0], [1, 1, 0], [-1, 1, 0]]
subtract_once = subtract_matrices(noisy, prediction)
by_image[23]["blocks"] += [
    matrix_block("Input spacetime patches", patches),
    matrix_block("Visual encoder", ve),
    matrix_block("Visual encoder result", relu(matrix_product(ve, with_bias(patches)))),
    matrix_block("Toy one-step subtraction", subtract_once),
    matrix_block("Visual decoder", vd),
    matrix_block(
        "Decoded toy patches", relu(matrix_product(vd, with_bias(subtract_once)))
    ),
]

by_image[24]["blocks"] += [
    matrix_block("Expert A", [[1, 0, -1, 0], [0, 1, 0, 0], [0, 0, -1, 1]]),
    matrix_block("Expert B", [[0, 0, -1, 0], [1, 0, 0, 0], [1, 1, -1, 1]]),
    matrix_block("Expert C", [[1, 0, 0, 0], [0, 1, 1, 1], [0, 1, 0, 0]]),
]
reward_encoder = [[1, 0, 1, 0], [0, 1, 0, 0], [1, 0, -1, 0], [1, 1, 0, 0]]
reward_output = [[3, 3, 3, -3, 1]]
word_vectors = {"doc": [1, 1, 0], "is": [1, 1, 1], "him": [0, 1, 0], "them": [1, 0, 0]}
by_image[25]["blocks"] += [
    matrix_block("Reward encoder and bias", reward_encoder),
    matrix_block("Reward output weights", reward_output),
]
for name in ["him", "them"]:
    token_features = transpose(
        [word_vectors["doc"], word_vectors["is"], word_vectors[name]]
    )
    encoded_reward = relu(matrix_product(reward_encoder, with_bias(token_features)))
    mean_reward = [[sum(row) / 3] for row in encoded_reward]
    by_image[25]["blocks"] += [
        matrix_block("doc is " + name + " embeddings", token_features),
        matrix_block("doc is " + name + " encoded tokens", encoded_reward),
        matrix_block("doc is " + name + " mean features", mean_reward),
        matrix_block(
            "doc is " + name + " recomputed reward",
            matrix_product(reward_output, with_bias(mean_reward)),
        ),
    ]
by_image[25]["correction"] += (
    " The printed reward model gives 3 for the rejected pair and 4 for the preferred pair. The preferred first pooled feature is 4/3, but the source writes 5/3, producing its displayed reward of 5. The assumed-score example above uses [3,5]; the recomputed printed model instead has a gap of 1."
)
# The right-hand dropout example uses changed weights to illustrate evaluation behavior.
inference_inputs = [[3, 3], [2, 1]]
inference_first = [[1, 0, 0], [1, 1, 1], [-1, 1, 1], [1, -1, 0]]
inference_second = [[1, 0, 1, 1, 0], [1, 1, 1, 0, 0], [1, 0, -1, 0, 1]]
inference_last = [[1, 1, 0, 0], [0, 1, -1, -1]]
inference_hidden = relu(matrix_product(inference_first, with_bias(inference_inputs)))
inference_middle = relu(matrix_product(inference_second, with_bias(inference_hidden)))
by_image[17]["blocks"] += [
    matrix_block("Evaluation inputs", inference_inputs),
    matrix_block("Changed evaluation layer one", inference_first),
    matrix_block("Evaluation activation, no dropout", inference_hidden),
    matrix_block("Changed evaluation layer two", inference_second),
    matrix_block("Evaluation middle activation", inference_middle),
    matrix_block("Changed evaluation output layer", inference_last),
    matrix_block(
        "Evaluation outputs",
        matrix_product(inference_last, with_bias(inference_middle)),
    ),
]
by_image[17]["correction"] += (
    " The separate evaluation panel uses altered illustrative weights; it is not the result of a calculated optimizer update from the training panel."
)
llm_inputs = [[-1, 0, 1], [-1, 1, 1], [-1, 1, 1]]
llm_mixing = [[5, 1, 0], [0, 4, 1], [0, 0, 4]]
llm_hidden_weights = [[1, 0, -1, 2], [-1, 1, 0, 0]]
llm_output_weights = [
    [1, 1, 0],
    [0, 1, 0],
    [1, 0, 0],
    [-1, 1, 1],
    [2, 0, -2],
    [2, 0, -1],
]
llm_mixed = matrix_product(llm_inputs, llm_mixing)
llm_hidden = relu(matrix_product(llm_hidden_weights, with_bias(llm_mixed)))
by_image[25]["blocks"] += [
    matrix_block("Language-model toy prompt embeddings", llm_inputs),
    matrix_block("Supplied position-mixing matrix", llm_mixing),
    matrix_block("Mixed prompt features", llm_mixed),
    matrix_block("Language-model hidden parameters", llm_hidden_weights),
    matrix_block("Language-model hidden activation", llm_hidden),
    matrix_block("Language-model vocabulary output parameters", llm_output_weights),
    matrix_block(
        "Vocabulary scores in order: him, her, them, is/are, doc, CEO",
        matrix_product(llm_output_weights, with_bias(llm_hidden)),
    ),
]
# Known literal examples catch transcription mistakes independently of the helper implementation.
assert next(
    block["rows"] for block in by_image[17]["blocks"] if block["label"] == "Output"
) == [[-6, 9], [13, 4]]
assert next(
    block["rows"]
    for block in by_image[25]["blocks"]
    if block["label"] == "doc is him recomputed reward"
) == [[3]]
assert next(
    block["rows"]
    for block in by_image[25]["blocks"]
    if block["label"] == "doc is them recomputed reward"
) == [[4]]
assert selected_experts == ["A", "B", "A", "B", "B"]
assert transpose(routed_columns) == [
    [10, -1, 5, -1, 5],
    [2, 6, 4, 7, 3],
    [0, 12, -1, 10, 1],
]
assert len(cases) == 25
assert by_image[3]["blocks"][-1]["rows"] == [[0], [3]]
assert by_image[5]["blocks"][-1]["rows"] == [[-4, -18]]
assert by_image[7]["blocks"][-1]["rows"] == [[3, 16, 28, 40]]
assert by_image[8]["blocks"][-1]["rows"] == [[-12, -3, 24, 1]]
assert by_image[9]["blocks"][-1]["rows"] == [[3, 9, 4], [1, -1, 0]]
out = ROOT / "apps/web/src/lib/library/ai/reconstructions.json"
out.write_text(json.dumps(cases, ensure_ascii=False, indent=2) + "\n")
print("Reconstructed", len(cases), "source figures")

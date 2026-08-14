#include "abliteration/eval.hpp"
#include "abliteration/ops.hpp"
#include "abliteration/paths.hpp"
#include "abliteration/self_check.hpp"
#include "abliteration/tensor.hpp"
#include "abliteration/ui.hpp"

#include <cstdlib>
#include <filesystem>
#include <iostream>
#include <string>
#include <string_view>
#include <vector>

namespace {

namespace ui = abliteration::ui;
namespace fs = std::filesystem;

std::string_view arg_val(int argc, char** argv, std::string_view key, std::string_view def = {}) {
  for (int i = 0; i < argc - 1; ++i) {
    if (key == argv[i]) return argv[i + 1];
  }
  return def;
}

void usage() {
  ui::banner();
  std::cout
      << '\n'
      << ui::bold() << "Start here" << ui::reset() << "  (no GPU, no Python)\n"
      << "  abliterate-cxx " << ui::cyan() << "guide" << ui::reset() << "         10-minute path\n"
      << "  abliterate-cxx " << ui::cyan() << "doctor" << ui::reset() << "        binary + examples check\n"
      << "  abliterate-cxx " << ui::cyan() << "self-check" << ui::reset() << "    planted-direction unit test\n"
      << "  abliterate-cxx " << ui::cyan() << "demo" << ui::reset() << "          run toys: estimate → apply → hook → eval\n"
      << "  abliterate-cxx " << ui::cyan() << "recipes" << ui::reset() << "       paper → --mode map (2024–2026)\n"
      << "  abliterate-cxx " << ui::cyan() << "why <mode>" << ui::reset() << "     one screen per operator\n"
      << '\n'
      << ui::bold() << "Operators" << ui::reset() << '\n'
      << "  estimate --mode dim|projected|cosmic|svd --bad FILE --good FILE [--rank K] [--out r.txt]\n"
      << "  apply    --mode arditi|orba-directional|orba-householder|subspace\n"
      << "           --weight W.txt --direction r.txt [--alpha 1] [--out W2.txt]\n"
      << "  hook     --h H.txt --direction r.txt [--alpha 1]\n"
      << "  eval     --jsonl generations.jsonl\n"
      << "  version\n"
      << '\n'
      << ui::dim()
      << "Matrix files: first line \"rows cols\", then row-major floats.\n"
      << "CI / logs: set NO_COLOR=1 or ABLITERATE_PLAIN=1.\n"
      << ui::reset();
  ui::next("abliterate-cxx guide");
}

int cmd_guide() {
  ui::banner();
  const auto walk = abliteration::find_shipped_file("GETTING-STARTED.md");
  const auto hand = abliteration::find_shipped_file("cxx26-researcher-guide.md");
  std::cout
      << '\n'
      << ui::bold() << "10 minutes — hold this order" << ui::reset() << "\n\n"
      << "  1.  " << ui::cyan() << "abliterate-cxx doctor" << ui::reset() << '\n'
      << "  2.  " << ui::cyan() << "abliterate-cxx self-check" << ui::reset()
      << ui::dim() << "          prove the math binary" << ui::reset() << '\n'
      << "  3.  " << ui::cyan() << "abliterate-cxx demo" << ui::reset()
      << ui::dim() << "                toys in examples/" << ui::reset() << '\n'
      << "  4.  estimate --mode " << ui::cyan() << "dim" << ui::reset()
      << " then " << ui::cyan() << "projected" << ui::reset() << '\n'
      << "  5.  apply --mode " << ui::cyan() << "orba-directional" << ui::reset() << '\n'
      << "  6.  eval --jsonl examples/generations.jsonl\n"
      << "  7.  " << ui::cyan() << "abliterate-cxx recipes" << ui::reset()
      << ui::dim() << "             only then pick a 2025–2026 mode" << ui::reset() << "\n\n"
      << ui::bold() << "Do not" << ui::reset() << " start on a 32B GGUF. This CLI is the lab notebook.\n"
      << "Real checkpoints: Heretic / llm-abliteration after step 6.\n\n"
      << "Shipped walkthrough: " << (walk.empty() ? "GETTING-STARTED.md" : walk.string()) << '\n'
      << "Handbook: " << (hand.empty() ? "cxx26-researcher-guide.md" : hand.string()) << '\n';
  ui::next("abliterate-cxx doctor");
  return 0;
}

int cmd_doctor() {
  ui::banner();
  int rc = 0;
  std::cout << "cplusplus=" << __cplusplus << ( __cplusplus >= 202400L ? "  (ISO C++26)" : "  (TOO OLD)") << '\n';
  if (__cplusplus < 202400L) {
    ui::err("this binary was not compiled as C++26");
    rc = 1;
  }
#ifdef ABLITERATE_VERSION
  std::cout << "version=" << ABLITERATE_VERSION << '\n';
#endif
#ifdef ABLITERATE_TARGET
  std::cout << "target=" << ABLITERATE_TARGET << '\n';
#endif
  const auto ex = abliteration::find_examples_dir();
  if (ex.empty()) {
    ui::warn("examples/ not found (tiny-bad.txt)");
    ui::hint("cd into the extracted nightly folder, or set ABLITERATE_EXAMPLES");
    ui::hint("https://github.com/adybag14-cyber/Abliteration/releases/tag/cxx-nightly");
    rc = 1;
  } else {
    std::cout << ui::green() << "examples " << ui::reset() << ex.string() << '\n';
  }
  if (rc == 0) {
    ui::next("abliterate-cxx self-check");
  } else {
    ui::next("abliterate-cxx guide");
  }
  return rc;
}

int cmd_recipes() {
  ui::banner();
  std::cout
      << '\n'
      << ui::bold() << "Paper → this CLI" << ui::reset() << "\n\n"
      << "  2024  Arditi et al. 2406.11717     estimate --mode dim\n"
      << "  2024  Labonne blog (popular)       same DIM, then apply arditi\n"
      << "  2025  Lai projected                estimate --mode projected\n"
      << "  2025  Lai MPOA / norm-preserve     apply orba-directional  (then Heretic row-norm)\n"
      << "  2026  Lai ORBA                     apply orba-directional | orba-householder\n"
      << "  2025  COSMIC ACL 2506.00085        estimate --mode cosmic  (score + DIM r; not full paper ID)\n"
      << "  2025  TUM concept cones 2502.17420 estimate --mode svd   (then RDO on GPU)\n"
      << "  2026  SOM AAAI 2511.08379          svd first; SOM trainer is pralab, not Abliterix\n"
      << "  2025  ICLR false-refusal 2410.03415  T38 = Wang w′ ← w − λ v  (not factory DIM, not T03)\n"
      << "  2025  Zhao harm≠refuse 2507.11878    two DIMs; do not wipe both\n"
      << "  2026  QCRI 11 categories 2602.02132  style leftover → svd / second pass\n"
      << "  2026  Young tools 2512.13655        Heretic vs ErisForge; Young DECCP = jim-plus --deccp topics\n"
      << "  2025  extended-refusal 2505.19056   if dim_align high but behavior unchanged → defense\n"
      << "  2025  DeepRefusal 2509.15202        defense (train-time PAA); not a bake / not this bin\n"
      << "  2026  OT transport 2603.04355       Abliterix; not in this bin\n"
      << "  2026  RFM-AGOP 2607.02396           fast multi-D subspace; GPU next-step\n"
      << "  2026  Code LLMs 2606.05396          removes *won't*, not *can't*\n"
      << "  2026  Task over-refuse 2603.27518   over-refuse is task-local — factory DIM not safety DIM\n\n"
      << ui::bold() << "Stay in this binary" << ui::reset() << " until demo + eval on toys is boring.\n"
      << ui::bold() << "Leave for GPU" << ui::reset() << " when you need a real instruct checkpoint.\n";
  ui::next("abliterate-cxx why dim");
  return 0;
}

int cmd_why(std::string_view mode) {
  ui::banner();
  if (mode == "dim") {
    std::cout << "Arditi 2024: r = normalize(mean(h_bad) − mean(h_good)).\n"
                 "Subtract then normalize (Lai 2026: keep magnitude contrast).\n";
    ui::next("abliterate-cxx estimate --mode dim --bad examples/tiny-bad.txt --good examples/tiny-good.txt");
    return 0;
  }
  if (mode == "projected") {
    std::cout << "Lai 2025: r ← r − (r·g)g  (g = harmless mean), twice (Horning).\n"
                 "Removes the helpful component so the wipe hurts capability less.\n";
    ui::next("abliterate-cxx estimate --mode projected --bad examples/tiny-bad.txt --good examples/tiny-good.txt");
    return 0;
  }
  if (mode == "cosmic") {
    std::cout << "COSMIC (Siu, ACL 2025): score layers by cosine separation.\n"
                 "This CLI prints the score and still writes a DIM r (no HF model).\n"
                 "Use when refusal has no 'I cannot' template.\n";
    ui::next("abliterate-cxx estimate --mode cosmic --bad examples/tiny-bad.txt --good examples/tiny-good.txt");
    return 0;
  }
  if (mode == "svd") {
    std::cout << "Top-k right singular vectors of (H_bad − mean_good).\n"
                 "Cousin of OBLITERATUS / multi-direction. Start --rank 2.\n"
                 "SOM (AAAI 2026) is a manifold trainer — not in this binary.\n";
    ui::next("abliterate-cxx estimate --mode svd --rank 2 --bad examples/tiny-bad.txt --good examples/tiny-good.txt");
    return 0;
  }
  if (mode == "arditi" || mode == "orba-directional") {
    std::cout << "W' = (I − α r rᵀ) W   on the output (residual) dim.\n"
                 "ORBA's stable operator. Default α=1. Lower α if a real model breaks.\n";
    ui::next("abliterate-cxx apply --mode orba-directional --weight examples/tiny-W.txt --direction r.txt");
    return 0;
  }
  if (mode == "orba-householder") {
    std::cout << "Householder reflection (α=2). Isometric, brittle: sign-flip / topic drift.\n"
                 "A/B only. Prefer orba-directional for anything you will keep.\n";
    ui::next("abliterate-cxx apply --mode orba-householder --weight examples/tiny-W.txt --direction r.txt");
    return 0;
  }
  if (mode == "subspace") {
    std::cout << "Wipe span(R) with QR-orthonormal columns. R from estimate --mode svd.\n";
    ui::next("abliterate-cxx apply --mode subspace --weight examples/tiny-W.txt --direction R.txt");
    return 0;
  }
  if (mode == "hook") {
    std::cout << "h' = h − α (h·r) r. Reversible. Use before baking a real checkpoint.\n";
    ui::next("abliterate-cxx hook --h examples/tiny-h.txt --direction r.txt");
    return 0;
  }
  if (mode == "eval") {
    std::cout << "Keyword judge (I cannot / as an ai / …). Not HarmBench.\n"
                 "false_refusal on tool_call rows is the factory metric.\n";
    ui::next("abliterate-cxx eval --jsonl examples/generations.jsonl");
    return 0;
  }
  ui::die_hint("unknown topic", "abliterate-cxx recipes");
  return 2;
}

int cmd_self_check() {
  const auto r = abliteration::run_self_check();
  std::cout << abliteration::self_check_json(r) << '\n';
  if (r.ok) {
    std::cout << ui::green() << "self-check ok" << ui::reset() << "  dim_align=" << r.dim_align
              << "  cosmic=" << r.cosmic << '\n';
    ui::next("abliterate-cxx demo");
    return 0;
  }
  ui::err(r.fail.empty() ? "self-check failed" : r.fail);
  return 1;
}

int cmd_demo() {
  const auto ex = abliteration::find_examples_dir();
  if (ex.empty()) {
    ui::die_hint("cannot find examples/tiny-bad.txt",
                 "run from the nightly folder or: abliterate-cxx doctor");
    return 2;
  }
  ui::banner();
  std::cout << ui::dim() << "using " << ex.string() << ui::reset() << '\n';

  auto bad = abliteration::load_mat((ex / "tiny-bad.txt").string());
  auto good = abliteration::load_mat((ex / "tiny-good.txt").string());
  auto w = abliteration::load_mat((ex / "tiny-W.txt").string());
  auto h = abliteration::load_mat((ex / "tiny-h.txt").string());
  if (!bad || !good || !w || !h) {
    ui::die_hint("example matrix unreadable", "re-download cxx-nightly or npm run cxx:build from the repo");
    return 2;
  }
  const auto r = abliteration::projected_direction(*bad, *good);
  const float cosmic = abliteration::cosmic_layer_score(*bad, *good);
  const auto w2 = abliteration::apply_output_projection(*w, r, 1.f);
  abliteration::Vec hv(h->cols);
  hv.data = h->data;
  const auto hp = abliteration::inference_ablate(hv, r, 1.f);
  const auto recs = abliteration::load_jsonl((ex / "generations.jsonl").string());
  const auto sc = abliteration::score_records(recs);

  std::cout << "estimate  projected  |r|=" << r.size() << "  cosmic_sep=" << cosmic << '\n';
  std::cout << "apply     orba-directional  W " << w->rows << "x" << w->cols << " → same shape\n";
  std::cout << "hook      first component " << hp[0] << "  (wiped along r)\n";
  std::cout << "eval      n=" << sc.n << "  refusal_rate=" << sc.refusal_rate()
            << "  false_refusal=" << sc.false_refusal << "  true_hits=" << sc.true_refusal_hits
            << '\n';
  std::cout << '\n'
            << ui::bold() << "Read this" << ui::reset() << '\n'
            << "  cosmic_sep > 0  → the two clouds separate; DIM is not noise.\n"
            << "  false_refusal=1 on the toy file → one should-comply bench command was refused (eval, not T38).\n"
            << "  true_hits should stay > 0 on a real harmful hold-out.\n";
  ui::next("abliterate-cxx recipes");
  ui::next("abliterate-cxx estimate --mode dim --bad " + (ex / "tiny-bad.txt").string() +
           " --good " + (ex / "tiny-good.txt").string());
  return 0;
}

int cmd_estimate(int argc, char** argv) {
  const auto mode = std::string(arg_val(argc, argv, "--mode", "dim"));
  const auto bad_p = arg_val(argc, argv, "--bad");
  const auto good_p = arg_val(argc, argv, "--good");
  const int rank = std::atoi(std::string(arg_val(argc, argv, "--rank", "4")).c_str());
  const auto out_p = arg_val(argc, argv, "--out", "r.txt");
  if (bad_p.empty() || good_p.empty()) {
    ui::die_hint("estimate needs --bad and --good activation matrices",
                 "abliterate-cxx demo   or   abliterate-cxx why dim");
    return 2;
  }
  auto bad = abliteration::load_mat(bad_p);
  auto good = abliteration::load_mat(good_p);
  if (!bad) {
    ui::die_hint(bad.error(), "matrix file starts with: rows cols");
    return 2;
  }
  if (!good) {
    ui::die_hint(good.error(), "matrix file starts with: rows cols");
    return 2;
  }
  if (mode == "dim" || mode == "projected" || mode == "cosmic") {
    const auto r = (mode == "projected") ? abliteration::projected_direction(*bad, *good)
                                         : abliteration::mean_difference(*bad, *good);
    if (auto e = abliteration::save_vec(out_p, r); !e) {
      ui::err(e.error());
      return 2;
    }
    if (mode == "cosmic") {
      const float s = abliteration::cosmic_layer_score(*bad, *good);
      std::cout << "cosmic_score=" << s << "  wrote " << out_p << " (DIM r)\n";
      if (s <= 0) ui::warn("non-positive separation — contrast set may be topic-matched (Petrov 2026)");
    } else {
      std::cout << "wrote " << out_p << "  1x" << r.size() << "  mode=" << mode << '\n';
    }
    {
      const auto ex = abliteration::find_examples_dir();
      const auto w = ex.empty() ? std::string("examples/tiny-W.txt") : (ex / "tiny-W.txt").string();
      ui::next(std::string("abliterate-cxx apply --mode orba-directional --weight ") + w +
               " --direction " + std::string(out_p));
    }
    return 0;
  }
  if (mode == "svd") {
    try {
      const auto vh = abliteration::svd_directions(*bad, *good, rank);
      if (auto e = abliteration::save_mat(out_p, vh); !e) {
        ui::err(e.error());
        return 2;
      }
      std::cout << "wrote " << out_p << "  " << vh.rows << "x" << vh.cols << "  mode=svd\n";
      ui::next(std::string("abliterate-cxx apply --mode subspace --weight examples/tiny-W.txt --direction ") +
               std::string(out_p));
      return 0;
    } catch (const std::exception& ex) {
      ui::die_hint(ex.what(), "SVD is a toy (d<=512). For real residuals use torch.linalg.svd / Heretic.");
      return 2;
    }
  }
  ui::die_hint("unknown --mode " + mode, "abliterate-cxx recipes");
  return 2;
}

int cmd_apply(int argc, char** argv) {
  const auto mode_s = std::string(arg_val(argc, argv, "--mode", "orba-directional"));
  const auto wp = arg_val(argc, argv, "--weight");
  const auto rp = arg_val(argc, argv, "--direction");
  const float alpha = std::strtof(std::string(arg_val(argc, argv, "--alpha", "1")).c_str(), nullptr);
  const auto out_p = arg_val(argc, argv, "--out", "W2.txt");
  if (wp.empty() || rp.empty()) {
    ui::die_hint("apply needs --weight and --direction",
                 "abliterate-cxx estimate …   then   abliterate-cxx why orba-directional");
    return 2;
  }
  auto w = abliteration::load_mat(wp);
  auto r = abliteration::load_mat(rp);
  if (!w) {
    ui::die_hint(w.error(), "weight file: rows cols then floats (output dim × input dim)");
    return 2;
  }
  if (!r) {
    ui::die_hint(r.error(), "direction from estimate (1×d or k×d)");
    return 2;
  }
  try {
    const auto mode = abliteration::parse_bake_mode(mode_s);
    const auto w2 = abliteration::apply_mode(*w, *r, mode, alpha);
    if (auto e = abliteration::save_mat(out_p, w2); !e) {
      ui::err(e.error());
      return 2;
    }
    std::cout << "wrote " << out_p << "  " << w2.rows << "x" << w2.cols << "  mode=" << mode_s
              << "  alpha=" << alpha << '\n';
    if (mode_s == "orba-householder")
      ui::warn("Householder can flip semantics — A/B against orba-directional");
    ui::next("abliterate-cxx hook --h examples/tiny-h.txt --direction " + std::string(rp));
    ui::next("abliterate-cxx eval --jsonl examples/generations.jsonl");
    return 0;
  } catch (const std::exception& ex) {
    ui::die_hint(ex.what(), "r last dim must equal W rows (output / residual size)");
    return 2;
  }
}

int cmd_hook(int argc, char** argv) {
  const auto hp = arg_val(argc, argv, "--h");
  const auto rp = arg_val(argc, argv, "--direction");
  const float alpha = std::strtof(std::string(arg_val(argc, argv, "--alpha", "1")).c_str(), nullptr);
  if (hp.empty() || rp.empty()) {
    ui::die_hint("hook needs --h and --direction", "abliterate-cxx why hook");
    return 2;
  }
  auto h = abliteration::load_mat(hp);
  auto r = abliteration::load_vec(rp);
  if (!h) {
    ui::die_hint(h.error(), "h is 1×d or n×d residuals");
    return 2;
  }
  if (!r) {
    ui::die_hint(r.error(), "direction file from estimate");
    return 2;
  }
  if (h->rows == 1) {
    abliteration::Vec hv(h->cols);
    hv.data = h->data;
    const auto o = abliteration::inference_ablate(hv, *r, alpha);
    std::cout << "1 " << o.size() << '\n';
    for (std::size_t i = 0; i < o.size(); ++i) {
      if (i) std::cout << ' ';
      std::cout << o[i];
    }
    std::cout << '\n';
    ui::next("abliterate-cxx eval --jsonl examples/generations.jsonl");
    return 0;
  }
  const auto o = abliteration::inference_ablate_batch(*h, *r, alpha);
  std::cout << o.rows << ' ' << o.cols << '\n';
  for (std::size_t i = 0; i < o.rows; ++i) {
    for (std::size_t j = 0; j < o.cols; ++j) {
      if (j) std::cout << ' ';
      std::cout << o(i, j);
    }
    std::cout << '\n';
  }
  ui::next("abliterate-cxx eval --jsonl examples/generations.jsonl");
  return 0;
}

int cmd_eval(int argc, char** argv) {
  const auto jp = arg_val(argc, argv, "--jsonl");
  if (jp.empty()) {
    ui::die_hint("eval needs --jsonl", "abliterate-cxx eval --jsonl examples/generations.jsonl");
    return 2;
  }
  try {
    const auto recs = abliteration::load_jsonl(abliteration::resolve_eval_jsonl(jp).string());
    const auto s = abliteration::score_records(recs);
    std::cout << "{\n"
              << "  \"n\": " << s.n << ",\n"
              << "  \"refusal_rate\": " << s.refusal_rate() << ",\n"
              << "  \"false_refusal\": " << s.false_refusal << ",\n"
              << "  \"true_refusal_hits\": " << s.true_refusal_hits << ",\n"
              << "  \"empty_response\": " << s.empty_response << ",\n"
              << "  \"degenerate\": " << s.degenerate << "\n"
              << "}\n";
    if (s.n == 0) {
      ui::warn("zero rows — need a \"response\" (or completion/output) string field");
      return 2;
    }
    if (s.empty_response > 0) {
      ui::warn("empty_response > 0: silence is degenerate, not a policy refusal");
      return 2;
    }
    if (s.degenerate == s.n) {
      ui::warn("every row is empty or filler — prompt-only JSONL is not an eval. Generate answers first.");
      ui::hint("mute/degenerate is not a safety hit and not a successful abliteration");
      return 2;
    }
    if (s.false_refusal > 0)
      ui::hint("false_refusal > 0: a should-comply prompt was refused — not more α; T38 is Wang w′ ← w − λ v, not factory DIM");
    ui::next("abliterate-cxx recipes");
    ui::hint("deploy gates: generate answers first, then score the dump. Prompt-only data/eval/*.jsonl is not eval input.");
    return 0;
  } catch (const std::exception& ex) {
    ui::die_hint(ex.what(), "JSONL one object per line with \"response\" and \"expected\"");
    return 2;
  }
}

}  // namespace

int main(int argc, char** argv) {
  if (argc > 0) abliteration::set_argv0(argv[0]);
  ui::enable_windows_vt();
  if (argc < 2) {
    usage();
    return 0;
  }
  const std::string_view cmd = argv[1];
  if (cmd == "-h" || cmd == "--help" || cmd == "help") {
    usage();
    return 0;
  }
  if (cmd == "guide" || cmd == "intro" || cmd == "start") return cmd_guide();
  if (cmd == "doctor") return cmd_doctor();
  if (cmd == "recipes" || cmd == "map") return cmd_recipes();
  if (cmd == "why") {
    if (argc < 3) {
      ui::die_hint("why needs a mode", "abliterate-cxx why dim|projected|cosmic|svd|orba-directional");
      return 2;
    }
    return cmd_why(argv[2]);
  }
  if (cmd == "demo" || cmd == "tutorial") return cmd_demo();
  if (cmd == "version" || cmd == "--version") {
    std::cout << "abliterate-cxx"
#ifdef ABLITERATE_VERSION
              << " " << ABLITERATE_VERSION
#endif
              << '\n';
    std::cout << "cplusplus=" << __cplusplus << '\n';
#ifdef ABLITERATE_TARGET
    std::cout << "target=" << ABLITERATE_TARGET << '\n';
#endif
    return (__cplusplus >= 202400L) ? 0 : 1;
  }
  if (cmd == "self-check") return cmd_self_check();
  if (cmd == "estimate") return cmd_estimate(argc, argv);
  if (cmd == "apply") return cmd_apply(argc, argv);
  if (cmd == "hook") return cmd_hook(argc, argv);
  if (cmd == "eval") return cmd_eval(argc, argv);
  ui::die_hint("unknown command: " + std::string(cmd), "abliterate-cxx guide");
  return 2;
}

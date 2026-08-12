#include "abliteration/eval.hpp"
#include "abliteration/ops.hpp"
#include "abliteration/self_check.hpp"
#include "abliteration/tensor.hpp"

#include <cstdlib>
#include <cstring>
#include <iostream>
#include <string>
#include <string_view>
#include <vector>

namespace {

void usage() {
  std::cerr
      << "abliterate-cxx — C++26 abliteration operators (estimate / apply / hook / eval)\n"
      << "Usage:\n"
      << "  abliterate-cxx self-check\n"
      << "  abliterate-cxx estimate --mode dim|projected|cosmic|svd --bad FILE --good FILE [--rank K] [--out FILE]\n"
      << "  abliterate-cxx apply --mode arditi|projected|orba-directional|orba-householder|subspace\n"
      << "                 --weight W.txt --direction R.txt [--alpha A] [--out FILE]\n"
      << "  abliterate-cxx hook --h H.txt --direction R.txt [--alpha A]\n"
      << "  abliterate-cxx eval --jsonl FILE.jsonl\n"
      << "Matrix files: first line \"rows cols\", then row-major floats.\n";
}

std::string_view arg_val(int argc, char** argv, std::string_view key, std::string_view def = {}) {
  for (int i = 0; i < argc - 1; ++i) {
    if (key == argv[i]) return argv[i + 1];
  }
  return def;
}

int cmd_self_check() {
  const auto r = abliteration::run_self_check();
  std::cout << abliteration::self_check_json(r) << '\n';
  return r.ok ? 0 : 1;
}

int cmd_estimate(int argc, char** argv) {
  const auto mode = std::string(arg_val(argc, argv, "--mode", "dim"));
  const auto bad_p = arg_val(argc, argv, "--bad");
  const auto good_p = arg_val(argc, argv, "--good");
  const int rank = std::atoi(std::string(arg_val(argc, argv, "--rank", "4")).c_str());
  const auto out_p = arg_val(argc, argv, "--out", "r.txt");
  if (bad_p.empty() || good_p.empty()) {
    std::cerr << "estimate requires --bad and --good\n";
    return 2;
  }
  auto bad = abliteration::load_mat(bad_p);
  auto good = abliteration::load_mat(good_p);
  if (!bad) {
    std::cerr << bad.error() << '\n';
    return 2;
  }
  if (!good) {
    std::cerr << good.error() << '\n';
    return 2;
  }
  if (mode == "dim") {
    const auto r = abliteration::mean_difference(*bad, *good);
    if (auto e = abliteration::save_vec(out_p, r); !e) {
      std::cerr << e.error() << '\n';
      return 2;
    }
    std::cout << "wrote " << out_p << " shape=1x" << r.size() << " mode=dim\n";
    return 0;
  }
  if (mode == "projected") {
    const auto r = abliteration::projected_direction(*bad, *good);
    if (auto e = abliteration::save_vec(out_p, r); !e) {
      std::cerr << e.error() << '\n';
      return 2;
    }
    std::cout << "wrote " << out_p << " shape=1x" << r.size() << " mode=projected\n";
    return 0;
  }
  if (mode == "cosmic") {
    const float s = abliteration::cosmic_layer_score(*bad, *good);
    const auto r = abliteration::mean_difference(*bad, *good);
    if (auto e = abliteration::save_vec(out_p, r); !e) {
      std::cerr << e.error() << '\n';
      return 2;
    }
    std::cout << "{\"cosmic_score\":" << s << ",\"out\":\"" << out_p << "\"}\n";
    return 0;
  }
  if (mode == "svd") {
    const auto vh = abliteration::svd_directions(*bad, *good, rank);
    if (auto e = abliteration::save_mat(out_p, vh); !e) {
      std::cerr << e.error() << '\n';
      return 2;
    }
    std::cout << "wrote " << out_p << " shape=" << vh.rows << "x" << vh.cols << " mode=svd\n";
    return 0;
  }
  std::cerr << "unknown --mode " << mode << '\n';
  return 2;
}

int cmd_apply(int argc, char** argv) {
  const auto mode_s = std::string(arg_val(argc, argv, "--mode", "arditi"));
  const auto wp = arg_val(argc, argv, "--weight");
  const auto rp = arg_val(argc, argv, "--direction");
  const float alpha = std::strtof(std::string(arg_val(argc, argv, "--alpha", "1")).c_str(), nullptr);
  const auto out_p = arg_val(argc, argv, "--out", "w_abl.txt");
  if (wp.empty() || rp.empty()) {
    std::cerr << "apply requires --weight and --direction\n";
    return 2;
  }
  auto w = abliteration::load_mat(wp);
  auto r = abliteration::load_mat(rp);
  if (!w) {
    std::cerr << w.error() << '\n';
    return 2;
  }
  if (!r) {
    std::cerr << r.error() << '\n';
    return 2;
  }
  const auto mode = abliteration::parse_bake_mode(mode_s);
  const auto w2 = abliteration::apply_mode(*w, *r, mode, alpha);
  if (auto e = abliteration::save_mat(out_p, w2); !e) {
    std::cerr << e.error() << '\n';
    return 2;
  }
  std::cout << "wrote " << out_p << " shape=" << w2.rows << "x" << w2.cols << " mode=" << mode_s
            << " alpha=" << alpha << '\n';
  return 0;
}

int cmd_hook(int argc, char** argv) {
  const auto hp = arg_val(argc, argv, "--h");
  const auto rp = arg_val(argc, argv, "--direction");
  const float alpha = std::strtof(std::string(arg_val(argc, argv, "--alpha", "1")).c_str(), nullptr);
  if (hp.empty() || rp.empty()) {
    std::cerr << "hook requires --h and --direction\n";
    return 2;
  }
  auto h = abliteration::load_mat(hp);
  auto r = abliteration::load_vec(rp);
  if (!h) {
    std::cerr << h.error() << '\n';
    return 2;
  }
  if (!r) {
    std::cerr << r.error() << '\n';
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
    return 0;
  }
  const auto o = abliteration::inference_ablate_batch(*h, *r, alpha);
  if (auto e = abliteration::save_mat("-", o); !e) {
    // write to stdout manually
  }
  std::cout << o.rows << ' ' << o.cols << '\n';
  for (std::size_t i = 0; i < o.rows; ++i) {
    for (std::size_t j = 0; j < o.cols; ++j) {
      if (j) std::cout << ' ';
      std::cout << o(i, j);
    }
    std::cout << '\n';
  }
  return 0;
}

int cmd_eval(int argc, char** argv) {
  const auto jp = arg_val(argc, argv, "--jsonl");
  if (jp.empty()) {
    std::cerr << "eval requires --jsonl\n";
    return 2;
  }
  const auto recs = abliteration::load_jsonl(jp);
  const auto s = abliteration::score_records(recs);
  std::cout << "{\n"
            << "  \"n\": " << s.n << ",\n"
            << "  \"refusal_rate\": " << s.refusal_rate() << ",\n"
            << "  \"false_refusal\": " << s.false_refusal << ",\n"
            << "  \"true_refusal_hits\": " << s.true_refusal_hits << "\n"
            << "}\n";
  return 0;
}

}  // namespace

int main(int argc, char** argv) {
  if (argc < 2) {
    usage();
    return 2;
  }
  const std::string_view cmd = argv[1];
  if (cmd == "-h" || cmd == "--help") {
    usage();
    return 0;
  }
  if (cmd == "self-check") return cmd_self_check();
  if (cmd == "estimate") return cmd_estimate(argc, argv);
  if (cmd == "apply") return cmd_apply(argc, argv);
  if (cmd == "hook") return cmd_hook(argc, argv);
  if (cmd == "eval") return cmd_eval(argc, argv);
  usage();
  return 2;
}

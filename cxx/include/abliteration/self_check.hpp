#pragma once

// Shared synthetic self-check used by the CLI and the unit-test binary.
// Fixtures are generated here — tests do not hard-code operator outputs.

#include "abliteration/eval.hpp"
#include "abliteration/ops.hpp"

#include <cmath>
#include <cstdint>
#include <sstream>
#include <string>

namespace abliteration {

struct Rng {
  std::uint64_t s;
  explicit Rng(std::uint64_t seed) : s(seed ? seed : 1) {}
  std::uint64_t u64() {
    s ^= s << 13;
    s ^= s >> 7;
    s ^= s << 17;
    return s;
  }
  float uniform() { return static_cast<float>(u64() >> 40) / static_cast<float>(1u << 24); }
  float normal() {
    // Box–Muller
    const float u1 = std::max(uniform(), 1e-7f);
    const float u2 = uniform();
    return std::sqrt(-2.f * std::log(u1)) * std::cos(6.28318530718f * u2);
  }
};

struct SelfCheckReport {
  bool ok = false;
  float dim_align = 0.f;
  float proj_align = 0.f;
  float cosmic = 0.f;
  int svd_rank = 0;
  float arditi_resid = 0.f;
  float householder_resid = 0.f;
  float hook_first = 0.f;
  int eval_n = 0;
  int eval_false_refusal = 0;
  int eval_true_hits = 0;
  std::string fail;
};

[[nodiscard]] inline SelfCheckReport run_self_check() {
  SelfCheckReport r;
  constexpr int d = 32;
  constexpr int n = 40;
  Rng rng{0xC0FFEE};

  Vec r_true(d, 0.f);
  r_true[0] = 1.f;
  Mat h_bad(n, d), h_good(n, d);
  for (int i = 0; i < n; ++i) {
    for (int j = 0; j < d; ++j) {
      h_bad(i, j) = rng.normal() + (j == 0 ? 2.f : 0.f);
      h_good(i, j) = rng.normal();
    }
  }

  const Vec r_dim = mean_difference(h_bad, h_good);
  const Vec r_proj = projected_direction(h_bad, h_good);
  const Mat r_svd = svd_directions(h_bad, h_good, 3);
  r.dim_align = std::abs(dot(r_dim, r_true));
  r.proj_align = std::abs(dot(r_proj, r_true));
  r.cosmic = cosmic_layer_score(h_bad, h_good);
  r.svd_rank = static_cast<int>(r_svd.rows);

  if (r.dim_align < 0.8f) {
    r.fail = "dim alignment";
    return r;
  }
  if (r.svd_rank != 3) {
    r.fail = "svd rank";
    return r;
  }
  if (r.cosmic <= 0.f) {
    r.fail = "cosmic score";
    return r;
  }

  constexpr int d_out = 16, d_in = 32;
  Vec e0(d_out, 0.f);
  e0[0] = 1.f;
  Rng rw{1};
  Mat w(d_out, d_in);
  for (int i = 0; i < d_out; ++i)
    for (int j = 0; j < d_in; ++j) w(i, j) = rw.normal();

  const Mat w_abl = apply_output_projection(w, e0, 1.f);
  r.arditi_resid = norm(mat_vec(w_abl, [&] {
    // r^T W'  == e0 · each column, i.e. first row of W'
    Vec rt(d_in);
    for (int j = 0; j < d_in; ++j) rt[j] = w_abl(0, j);
    return rt;
  }()));
  // r @ W' : since r = e0, this is the first row
  r.arditi_resid = 0.f;
  for (int j = 0; j < d_in; ++j) r.arditi_resid += w_abl(0, j) * w_abl(0, j);
  r.arditi_resid = std::sqrt(r.arditi_resid);
  if (r.arditi_resid > 1e-4f) {
    r.fail = "arditi residual";
    return r;
  }

  const Mat hh = apply_householder(w, e0);
  // r^T H W + r^T W ≈ 0
  float hh_err = 0.f;
  for (int j = 0; j < d_in; ++j) {
    const float e = hh(0, j) + w(0, j);
    hh_err += e * e;
  }
  r.householder_resid = std::sqrt(hh_err);
  if (r.householder_resid > 1e-4f) {
    r.fail = "householder not a reflection";
    return r;
  }

  Mat basis(2, d_out);
  for (int j = 0; j < d_out; ++j) basis(0, j) = e0[j];
  Vec extra(d_out);
  for (int j = 0; j < d_out; ++j) extra[j] = rw.normal();
  extra = unit(extra);
  for (int j = 0; j < d_out; ++j) basis(1, j) = extra[j];
  const Mat w_sub = apply_subspace(w, basis, 1.f);
  float sub_err = 0.f;
  for (int j = 0; j < d_in; ++j) sub_err += w_sub(0, j) * w_sub(0, j);
  if (std::sqrt(sub_err) > 1e-3f) {
    r.fail = "subspace residual";
    return r;
  }

  Vec h(4);
  h[0] = 2.f;
  h[1] = 3.f;
  h[2] = 4.f;
  h[3] = 5.f;
  Vec hr(4, 0.f);
  hr[0] = 1.f;
  const Vec hp = inference_ablate(h, hr, 1.f);
  r.hook_first = hp[0];
  if (std::abs(hp[0]) > 1e-6f || std::abs(hp[1] - 3.f) > 1e-6f) {
    r.fail = "hook wipe";
    return r;
  }

  const std::vector<EvalRecord> rows = {
      {"I'll list USB devices: ...", "tool_call"},
      {"I cannot help with that.", "tool_call"},
      {"I can't assist with building malware.", "refuse"},
  };
  const EvalScore sc = score_records(rows);
  r.eval_n = sc.n;
  r.eval_false_refusal = sc.false_refusal;
  r.eval_true_hits = sc.true_refusal_hits;
  if (sc.n != 3 || sc.false_refusal != 1 || sc.true_refusal_hits != 1) {
    r.fail = "eval markers";
    return r;
  }

  r.ok = true;
  return r;
}

[[nodiscard]] inline std::string self_check_json(const SelfCheckReport& r) {
  std::ostringstream o;
  o << "{\"ok\":" << (r.ok ? "true" : "false");
  o << ",\"dim_align\":" << r.dim_align;
  o << ",\"proj_align\":" << r.proj_align;
  o << ",\"cosmic\":" << r.cosmic;
  o << ",\"svd_rank\":" << r.svd_rank;
  o << ",\"arditi_resid\":" << r.arditi_resid;
  o << ",\"householder_resid\":" << r.householder_resid;
  o << ",\"hook_first\":" << r.hook_first;
  o << ",\"eval_n\":" << r.eval_n;
  o << ",\"eval_false_refusal\":" << r.eval_false_refusal;
  o << ",\"eval_true_hits\":" << r.eval_true_hits;
  if (!r.fail.empty()) o << ",\"fail\":\"" << r.fail << "\"";
  o << "}";
  return o.str();
}

}  // namespace abliteration

#include "abliteration/eval.hpp"
#include "abliteration/ops.hpp"
#include "abliteration/self_check.hpp"

#include <cmath>
#include <cstdlib>
#include <iostream>
#include <string>

namespace {

int fails = 0;

void expect(bool cond, const char* msg) {
  if (!cond) {
    std::cerr << "FAIL " << msg << '\n';
    ++fails;
  }
}

void test_self_check_shared() {
  const auto r = abliteration::run_self_check();
  expect(r.ok, "shared self-check");
  if (!r.ok) std::cerr << "  reason: " << r.fail << '\n';
  expect(r.dim_align >= 0.8f, "dim_align >= 0.8");
  expect(r.hook_first == 0.f || std::abs(r.hook_first) < 1e-6f, "hook first component");
  expect(r.eval_n == 3 && r.eval_false_refusal == 1 && r.eval_true_hits == 1, "eval fixture");
}

void test_generated_dim() {
  // Plant e0 in a fresh cloud; estimate must recover it. No hardcoded r oracle.
  abliteration::Rng rng{99};
  constexpr int d = 24, n = 50;
  abliteration::Mat bad(n, d), good(n, d);
  for (int i = 0; i < n; ++i)
    for (int j = 0; j < d; ++j) {
      bad(i, j) = rng.normal() + (j == 3 ? 3.f : 0.f);
      good(i, j) = rng.normal();
    }
  const auto r = abliteration::mean_difference(bad, good);
  abliteration::Vec planted(d, 0.f);
  planted[3] = 1.f;
  const float align = std::abs(abliteration::dot(r, planted));
  expect(align > 0.85f, "generated DIM recovers planted axis 3");
  if (align <= 0.85f) std::cerr << "  align=" << align << '\n';

  const float cosmic = abliteration::cosmic_layer_score(bad, good);
  expect(cosmic > 0.f, "cosmic positive on planted contrast");

  const auto proj = abliteration::projected_direction(bad, good);
  expect(std::abs(abliteration::norm(proj) - 1.f) < 1e-5f, "projected unit");
}

void test_projection_kills_r() {
  abliteration::Rng rng{7};
  constexpr int d_out = 12, d_in = 20;
  abliteration::Mat w(d_out, d_in);
  for (int i = 0; i < d_out; ++i)
    for (int j = 0; j < d_in; ++j) w(i, j) = rng.normal();
  abliteration::Vec r(d_out);
  for (int i = 0; i < d_out; ++i) r[i] = rng.normal();
  r = abliteration::unit(r);
  const auto w2 = abliteration::apply_output_projection(w, r, 1.f);
  // r^T W' should be ~0
  float resid = 0.f;
  for (int j = 0; j < d_in; ++j) {
    float col = 0.f;
    for (int i = 0; i < d_out; ++i) col += r[i] * w2(i, j);
    resid += col * col;
  }
  resid = std::sqrt(resid);
  expect(resid < 1e-4f, "r^T W' ~ 0 after full wipe");
  if (resid >= 1e-4f) std::cerr << "  resid=" << resid << '\n';

  const auto hh = abliteration::apply_householder(w, r);
  float flip = 0.f;
  for (int j = 0; j < d_in; ++j) {
    float a = 0.f, b = 0.f;
    for (int i = 0; i < d_out; ++i) {
      a += r[i] * hh(i, j);
      b += r[i] * w(i, j);
    }
    const float e = a + b;
    flip += e * e;
  }
  expect(std::sqrt(flip) < 1e-4f, "Householder reflects r component");
}

void test_hook_property() {
  abliteration::Vec h(8);
  abliteration::Vec r(8);
  abliteration::Rng rng{3};
  for (int i = 0; i < 8; ++i) {
    h[i] = rng.normal();
    r[i] = rng.normal();
  }
  r = abliteration::unit(r);
  const auto hp = abliteration::inference_ablate(h, r, 1.f);
  expect(std::abs(abliteration::dot(hp, r)) < 1e-5f, "hook: h' ⊥ r");
  // orthogonal complement preserved
  abliteration::Vec q = h;
  const float d = abliteration::dot(h, r);
  for (int i = 0; i < 8; ++i) q[i] -= d * r[i];
  float err = 0.f;
  for (int i = 0; i < 8; ++i) {
    const float e = hp[i] - q[i];
    err += e * e;
  }
  expect(std::sqrt(err) < 1e-5f, "hook matches h - (h·r)r");
}

void test_eval_generated() {
  // Mix comply / refuse strings; counts must come from is_refusal on those strings.
  std::vector<abliteration::EvalRecord> recs;
  recs.push_back({"Sure, listing USB devices now.", "tool_call"});
  recs.push_back({"I cannot help with that request.", "tool_call"});
  recs.push_back({"Here is the nmap plan.", "comply"});
  recs.push_back({"I will not assist with that.", "refuse"});
  recs.push_back({"As an AI I must refuse.", "harmful"});
  const auto s = abliteration::score_records(recs);
  expect(s.n == 5, "eval n");
  expect(s.refusals == 3, "eval refusals");
  expect(s.false_refusal == 1, "one false refuse on tool_call");
  expect(s.true_refusal_hits == 2, "two true refuse hits");
}

void test_json_field() {
  const auto line =
      R"({"response":"I cannot help with that.","expected":"tool_call"})";
  expect(abliteration::json_string_field(line, "response") == "I cannot help with that.",
         "json response field");
  expect(abliteration::json_string_field(line, "expected") == "tool_call", "json expected field");
}

}  // namespace

int main() {
  test_self_check_shared();
  test_generated_dim();
  test_projection_kills_r();
  test_hook_property();
  test_eval_generated();
  test_json_field();
  if (fails) {
    std::cerr << fails << " test(s) failed\n";
    return 1;
  }
  std::cout << "ok 6 suites (self-check + generated DIM/bake/hook/eval)\n";
  return 0;
}

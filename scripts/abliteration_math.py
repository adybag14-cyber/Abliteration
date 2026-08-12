"""Rank-1 and subspace refusal operators used by handbook CLIs.

Formulas match methods/orba-pipeline.md and methods/mlp-down-proj-abliteration.md.
Works on CPU; no transformers import.
"""

from __future__ import annotations

from typing import Literal

import torch

Mode = Literal["arditi", "projected", "orba-directional", "orba-householder", "subspace"]


def unit(v: torch.Tensor, dim: int = -1, eps: float = 1e-8) -> torch.Tensor:
    return v / v.norm(dim=dim, keepdim=True).clamp_min(eps)


def mean_difference(h_bad: torch.Tensor, h_good: torch.Tensor) -> torch.Tensor:
    """Subtract-then-normalize DIM (Lai 2026: prefer this over normalize-then-subtract)."""
    r = h_bad.mean(0) - h_good.mean(0)
    return unit(r)


def project_off(r: torch.Tensor, g: torch.Tensor, passes: int = 2) -> torch.Tensor:
    """Gram-Schmidt r off g. Default two passes (Horning 'twice is enough')."""
    g = unit(g)
    for _ in range(passes):
        r = r - torch.dot(r.flatten(), g.flatten()) * g
    return unit(r)


def projected_direction(h_bad: torch.Tensor, h_good: torch.Tensor) -> torch.Tensor:
    r = mean_difference(h_bad, h_good)
    g = unit(h_good.mean(0))
    return project_off(r, g)


def cosmic_layer_score(h_bad: torch.Tensor, h_good: torch.Tensor) -> float:
    r = mean_difference(h_bad, h_good)
    sep = (h_bad @ r).mean() - (h_good @ r).mean()
    return float(sep)


def svd_directions(h_bad: torch.Tensor, h_good: torch.Tensor, rank: int) -> torch.Tensor:
    """Top-k right singular vectors of (H_bad - mean_good), shape [k, d]."""
    delta = h_bad - h_good.mean(0)
    _u, _s, vh = torch.linalg.svd(delta, full_matrices=False)
    k = min(rank, vh.shape[0])
    return unit(vh[:k], dim=-1)


def apply_output_projection(weight: torch.Tensor, r: torch.Tensor, alpha: float = 1.0) -> torch.Tensor:
    """W' = (I − α r rᵀ) W. r lives in the output (residual) dimension."""
    r = unit(r.reshape(-1).float())
    if r.numel() != weight.shape[0]:
        raise ValueError(f"r dim {r.numel()} != W out {weight.shape[0]}")
    w = weight.float()
    return (w - alpha * torch.outer(r, w.T @ r)).to(weight.dtype)


def apply_householder(weight: torch.Tensor, u: torch.Tensor) -> torch.Tensor:
    """W' = (I − 2 u uᵀ) W — isometric reflection (ORBA research path)."""
    return apply_output_projection(weight, u, alpha=2.0)


def apply_subspace(weight: torch.Tensor, r_basis: torch.Tensor, alpha: float = 1.0) -> torch.Tensor:
    """W' = (I − α R Rᵀ) W. r_basis is [k, d_out] or [d_out]."""
    if r_basis.ndim == 1:
        return apply_output_projection(weight, r_basis, alpha)
    R = unit(r_basis.float(), dim=-1)
    if R.shape[-1] != weight.shape[0]:
        raise ValueError(f"R last dim {R.shape[-1]} != W out {weight.shape[0]}")
    # QR to orthonormalize rows
    q, _ = torch.linalg.qr(R.T, mode="reduced")
    w = weight.float()
    # q is [d_out, k]; (q qᵀ) W = q (qᵀ W)
    return (w - alpha * (q @ (q.T @ w))).to(weight.dtype)


def apply_mode(weight: torch.Tensor, r: torch.Tensor, mode: Mode, alpha: float = 1.0) -> torch.Tensor:
    if mode in ("arditi", "projected", "orba-directional"):
        return apply_output_projection(weight, r if r.ndim == 1 else r[0], alpha)
    if mode == "orba-householder":
        return apply_householder(weight, r if r.ndim == 1 else r[0])
    if mode == "subspace":
        return apply_subspace(weight, r, alpha)
    raise ValueError(f"unknown mode {mode}")


def inference_ablate(h: torch.Tensor, r: torch.Tensor, alpha: float = 1.0) -> torch.Tensor:
    """h' = h − α (h·r) r  (last dim is residual)."""
    r = unit(r.reshape(-1).float())
    if h.shape[-1] != r.numel():
        raise ValueError(f"h dim {h.shape[-1]} != r {r.numel()}")
    proj = (h.float() @ r).unsqueeze(-1) * r
    return (h.float() - alpha * proj).to(h.dtype)


TARGET_SUFFIXES = (
    "down_proj.weight",
    "o_proj.weight",
    "out_proj.weight",
    "output_linear.weight",
)


def is_target_key(key: str) -> bool:
    return key.endswith(TARGET_SUFFIXES)

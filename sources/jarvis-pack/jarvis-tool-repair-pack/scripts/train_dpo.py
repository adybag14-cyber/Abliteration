import argparse
from pathlib import Path

import torch
from datasets import load_dataset
from peft import LoraConfig, PeftModel, prepare_model_for_kbit_training
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, TrainingArguments

try:
    from trl import DPOTrainer, DPOConfig
    HAS_DPO_CONFIG = True
except Exception:
    from trl import DPOTrainer
    DPOConfig = None
    HAS_DPO_CONFIG = False


def parse_args():
    p = argparse.ArgumentParser(description="Run a short DPO repair pass for Jarvis.")
    p.add_argument("--base_model", required=True, help="Local model folder or Hugging Face repo id")
    p.add_argument("--adapter_path", default="output/jarvis-tool-repair-sft", help="SFT adapter to continue training")
    p.add_argument("--data", default="data/dpo_train.jsonl")
    p.add_argument("--output_dir", default="output/jarvis-tool-repair-v1")
    p.add_argument("--max_seq_length", type=int, default=2048)
    p.add_argument("--learning_rate", type=float, default=5e-6)
    p.add_argument("--num_train_epochs", type=float, default=0.75)
    p.add_argument("--per_device_train_batch_size", type=int, default=1)
    p.add_argument("--gradient_accumulation_steps", type=int, default=8)
    p.add_argument("--lora_r", type=int, default=32)
    p.add_argument("--lora_alpha", type=int, default=64)
    p.add_argument("--lora_dropout", type=float, default=0.05)
    return p.parse_args()


def main():
    args = parse_args()
    Path(args.output_dir).mkdir(parents=True, exist_ok=True)

    tokenizer = AutoTokenizer.from_pretrained(args.base_model, use_fast=True, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    quant_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True,
        bnb_4bit_compute_dtype=torch.bfloat16,
    )

    model = AutoModelForCausalLM.from_pretrained(
        args.base_model,
        quantization_config=quant_config,
        device_map="auto",
        trust_remote_code=True,
    )
    model.config.use_cache = False
    model = prepare_model_for_kbit_training(model)

    if args.adapter_path and Path(args.adapter_path).exists():
        model = PeftModel.from_pretrained(model, args.adapter_path, is_trainable=True)
        peft_config = None
    else:
        peft_config = LoraConfig(
            r=args.lora_r,
            lora_alpha=args.lora_alpha,
            lora_dropout=args.lora_dropout,
            bias="none",
            task_type="CAUSAL_LM",
            target_modules="all-linear",
        )

    ds = load_dataset("json", data_files=args.data, split="train")

    common_args = dict(
        output_dir=args.output_dir,
        per_device_train_batch_size=args.per_device_train_batch_size,
        gradient_accumulation_steps=args.gradient_accumulation_steps,
        learning_rate=args.learning_rate,
        num_train_epochs=args.num_train_epochs,
        logging_steps=10,
        save_strategy="epoch",
        bf16=True,
        optim="paged_adamw_8bit",
        report_to="none",
    )

    if HAS_DPO_CONFIG:
        train_args = DPOConfig(
            **common_args,
            max_length=args.max_seq_length,
            max_prompt_length=args.max_seq_length // 2,
        )
        try:
            trainer = DPOTrainer(
                model=model,
                ref_model=None,
                args=train_args,
                train_dataset=ds,
                processing_class=tokenizer,
                peft_config=peft_config,
            )
        except TypeError:
            trainer = DPOTrainer(
                model=model,
                ref_model=None,
                args=train_args,
                train_dataset=ds,
                tokenizer=tokenizer,
                peft_config=peft_config,
            )
    else:
        train_args = TrainingArguments(**common_args)
        trainer = DPOTrainer(
            model=model,
            ref_model=None,
            args=train_args,
            beta=0.1,
            train_dataset=ds,
            tokenizer=tokenizer,
            max_length=args.max_seq_length,
            max_prompt_length=args.max_seq_length // 2,
            peft_config=peft_config,
        )

    trainer.train()
    model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)
    print(f"Saved DPO adapter to {args.output_dir}")


if __name__ == "__main__":
    main()

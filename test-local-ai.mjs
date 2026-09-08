import { pipeline } from '@huggingface/transformers';

async function test() {
  console.log("Loading model...");
  const generator = await pipeline('text-generation', 'HuggingFaceTB/SmolLM-135M-Instruct', { dtype: 'q4' });
  console.log("Loaded. Generating...");
  const out = await generator("How to make a Tesla coil? A Tesla coil is", { max_new_tokens: 30 });
  console.log(out);
}
test().catch(console.error);

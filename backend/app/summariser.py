from transformers import BartTokenizer, BartForConditionalGeneration
import torch
from typing import List
import numpy as np
import asyncio

class Summariser:
    def __init__(self, model_name: str = "facebook/bart-large-cnn"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.tokenizer = BartTokenizer.from_pretrained(model_name)
        self.model = BartForConditionalGeneration.from_pretrained(model_name).to(self.device)
        
    def _preprocess_text(self, sentences: List[str]) -> str:
        """Combine sentences into a single text, cleaning and deduplicating."""
        # Join all sentences
        combined_text = " ".join(sentences)
        # Remove extra whitespace
        cleaned_text = " ".join(combined_text.split())
        return cleaned_text

    def generate_summary(self, text: str, max_length: int = 250, min_length: int = 100) -> str:
        """Generate a summary from the input text with increased length limits."""
        # Split long text into chunks if it exceeds token limit
        max_token_length = 1024
        chunks = []
        current_chunk = []
        current_length = 0
        
        # Split text into sentences roughly
        sentences = text.split('. ')
        
        for sentence in sentences:
            tokens = self.tokenizer.encode(sentence)
            if current_length + len(tokens) > max_token_length:
                chunks.append(self.tokenizer.decode(
                    self.tokenizer.encode(" ".join(current_chunk)),
                    skip_special_tokens=True
                ))
                current_chunk = [sentence]
                current_length = len(tokens)
            else:
                current_chunk.append(sentence)
                current_length += len(tokens)
        
        if current_chunk:
            chunks.append(self.tokenizer.decode(
                self.tokenizer.encode(" ".join(current_chunk)),
                skip_special_tokens=True
            ))

        # Generate summary for each chunk
        summaries = []
        for chunk in chunks:
            inputs = self.tokenizer.encode(
                chunk,
                return_tensors="pt",
                max_length=1024,
                truncation=True
            ).to(self.device)

            summary_ids = self.model.generate(
                inputs,
                max_length=max_length,
                min_length=min_length,
                length_penalty=2.0,
                num_beams=4,
                early_stopping=True
            )
            
            summaries.append(self.tokenizer.decode(summary_ids[0], skip_special_tokens=True))

        # Combine summaries
        final_summary = " ".join(summaries)
        
        # Generate a final, condensed summary if there were multiple chunks
        if len(summaries) > 1:
            inputs = self.tokenizer.encode(
                final_summary,
                return_tensors="pt",
                max_length=1024,
                truncation=True
            ).to(self.device)

            summary_ids = self.model.generate(
                inputs,
                max_length=max_length,
                min_length=min_length,
                length_penalty=2.0,
                num_beams=4,
                early_stopping=True
            )
            
            final_summary = self.tokenizer.decode(summary_ids[0], skip_special_tokens=True)

        return final_summary

    async def generate_summary_async(self, text: str, max_length: int = 250, min_length: int = 100) -> str:
        """Asynchronous version of generate_summary that can be cancelled."""
        try:
            print("Starting async summary generation")
            loop = asyncio.get_event_loop()
            
            def wrapped_generate():
                try:
                    return self.generate_summary(text, max_length, min_length)
                except Exception as e:
                    print(f"Error in generate_summary: {e}")
                    raise

            result = await loop.run_in_executor(None, wrapped_generate)
            print("Async summary generation completed successfully")
            return result
            
        except asyncio.CancelledError:
            print("Async summary generation cancelled")
            raise
        except Exception as e:
            print(f"Error in async summary generation: {e}")
            raise

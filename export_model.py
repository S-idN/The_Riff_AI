from transformers import AutoTokenizer, AutoModelForSequenceClassification

# Load from trained checkpoint folder
model = AutoModelForSequenceClassification.from_pretrained("Training/scripts/fine_tuned_geoemotions")
tokenizer = AutoTokenizer.from_pretrained("Training/scripts/fine_tuned_geoemotions")

# Save to a new clean export folder
model.save_pretrained("Training/exported_geoemotions")
tokenizer.save_pretrained("Training/exported_geoemotions")

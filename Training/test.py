import pandas as pd
from datasets import DatasetDict, Dataset

# Define dataset path
dataset_path = "Gogil/data"

# Load train, dev, and test data
train_df = pd.read_csv(f"{dataset_path}/train.tsv", sep="\t", header=None)
dev_df = pd.read_csv(f"{dataset_path}/dev.tsv", sep="\t", header=None)
test_df = pd.read_csv(f"{dataset_path}/test.tsv", sep="\t", header=None)

# Display the first few rows to inspect the structure
print(train_df.head())

"""
Training Script — CLI entry point
===================================
Runs the full pipeline: data → features → train → evaluate → save.

Usage:
    python train.py
    python train.py --skip-data   (skip data download, use existing processed_data.csv)
"""

import os
import sys
import argparse
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
PROCESSED_PATH = os.path.join(DATA_DIR, 'processed_data.csv')


def main():
    parser = argparse.ArgumentParser(description='Train demand forecasting models')
    parser.add_argument('--skip-data', action='store_true',
                        help='Skip data pipeline, use existing processed_data.csv')
    args = parser.parse_args()

    print("=" * 60)
    print("  DEMAND FORECASTING — TRAINING PIPELINE")
    print("  Smart Cafeteria Management System")
    print("=" * 60)

    # Step 1: Data Pipeline
    if args.skip_data and os.path.exists(PROCESSED_PATH):
        print("\n[INFO] Loading existing processed data...")
        df = pd.read_csv(PROCESSED_PATH, parse_dates=['date'])
    else:
        from data_pipeline import run_pipeline
        df = run_pipeline()

    print(f"\n[INFO] Dataset loaded: {df.shape[0]:,} rows × {df.shape[1]} columns")
    print(f"  Date range: {df['date'].min()} to {df['date'].max()}")

    # Step 2: Train All Models
    from models import train_all_models
    best, comparison, all_results = train_all_models(df)

    # Step 3: Summary
    print("\n" + "=" * 60)
    print("  TRAINING COMPLETE")
    print("=" * 60)
    print(f"  Best model: {best['name']}")
    print(f"  RMSE: {best['metrics']['rmse']}")
    print(f"  MAE:  {best['metrics']['mae']}")
    print(f"  MAPE: {best['metrics']['mape']}%")
    print(f"  Models saved to: {os.path.join(BASE_DIR, 'models')}")
    print(f"\n  Run the API server with: python app.py")


if __name__ == '__main__':
    main()

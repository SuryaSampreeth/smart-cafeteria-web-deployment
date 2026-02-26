"""
ML Models for Demand Forecasting
=================================
Implements three forecasting models:
1. ARIMA/SARIMA — Statistical baseline for time-series
2. XGBoost — Gradient-boosted trees (primary model)
3. LSTM — Recurrent neural network with 30-day lookback

Each model is trained, evaluated, and saved. The best model is auto-selected.
"""

import os
import json
import warnings
import numpy as np
import pandas as pd
import joblib
from datetime import datetime

from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_squared_error, mean_absolute_error
from sklearn.preprocessing import MinMaxScaler

warnings.filterwarnings('ignore')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')
DATA_DIR = os.path.join(BASE_DIR, 'data')


def compute_metrics(y_true, y_pred):
    """Compute RMSE, MAE, and MAPE."""
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae = mean_absolute_error(y_true, y_pred)
    # Avoid division by zero for MAPE
    mask = y_true > 0
    if mask.sum() > 0:
        mape = np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100
    else:
        mape = 0.0
    return {
        'rmse': round(float(rmse), 4),
        'mae': round(float(mae), 4),
        'mape': round(float(mape), 2),
    }


# ======================== ARIMA MODEL ========================

def train_arima(df, target_col='sales'):
    """
    Train SARIMA model on aggregated daily sales.
    Uses the total daily sales across all items for simplicity.
    """
    from statsmodels.tsa.statespace.sarimax import SARIMAX

    print("\n" + "=" * 50)
    print("TRAINING ARIMA/SARIMA MODEL")
    print("=" * 50)

    # Aggregate to daily total
    daily_total = df.groupby('date')[target_col].sum().reset_index()
    daily_total = daily_total.sort_values('date').set_index('date')
    daily_total = daily_total.asfreq('D', fill_value=daily_total[target_col].median())

    # Train/test split: last 90 days for testing
    split_idx = len(daily_total) - 90
    train = daily_total.iloc[:split_idx]
    test = daily_total.iloc[split_idx:]

    print(f"  Training size: {len(train)} days")
    print(f"  Test size: {len(test)} days")

    # SARIMA with weekly seasonality
    # p,d,q = 1,1,1  P,D,Q,s = 1,1,0,7
    try:
        model = SARIMAX(
            train[target_col],
            order=(1, 1, 1),
            seasonal_order=(1, 1, 0, 7),
            enforce_stationarity=False,
            enforce_invertibility=False,
        )
        fitted = model.fit(disp=False, maxiter=200)

        # Forecast
        forecast = fitted.forecast(steps=len(test))
        forecast = np.maximum(forecast, 0)  # No negative demand

        # Evaluate
        metrics = compute_metrics(test[target_col].values, forecast.values)
        print(f"  RMSE: {metrics['rmse']}")
        print(f"  MAE:  {metrics['mae']}")
        print(f"  MAPE: {metrics['mape']}%")

        # Save
        os.makedirs(MODELS_DIR, exist_ok=True)
        model_path = os.path.join(MODELS_DIR, 'arima_model.pkl')
        joblib.dump(fitted, model_path)
        print(f"  Model saved → {model_path}")

        return {
            'name': 'SARIMA',
            'metrics': metrics,
            'model': fitted,
            'model_path': model_path,
            'forecast_test': forecast.values.tolist(),
            'actual_test': test[target_col].values.tolist(),
        }
    except Exception as e:
        print(f"  ✗ ARIMA training failed: {e}")
        return None


# ======================== XGBOOST MODEL ========================

def train_xgboost(df, target_col='sales'):
    """
    Train XGBoost model using all engineered features.
    This is the primary model with best expected performance.
    """
    import xgboost as xgb

    print("\n" + "=" * 50)
    print("TRAINING XGBOOST MODEL")
    print("=" * 50)

    df = df.sort_values('date')

    # Feature columns (exclude target, date, and non-numeric identifiers)
    exclude_cols = ['date', target_col, 'item_category']
    feature_cols = [c for c in df.columns if c not in exclude_cols and df[c].dtype in ['int64', 'float64', 'int32', 'float32', 'uint32']]

    print(f"  Features ({len(feature_cols)}): {feature_cols[:10]}...")

    X = df[feature_cols].values
    y = df[target_col].values

    # Time-based split: last 90 days for testing
    split_date = df['date'].max() - pd.Timedelta(days=90)
    train_mask = df['date'] <= split_date
    test_mask = df['date'] > split_date

    X_train, X_test = X[train_mask], X[test_mask]
    y_train, y_test = y[train_mask], y[test_mask]

    print(f"  Training: {X_train.shape[0]:,} samples")
    print(f"  Test:     {X_test.shape[0]:,} samples")

    # Train XGBoost
    model = xgb.XGBRegressor(
        n_estimators=500,
        max_depth=8,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=5,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=42,
        n_jobs=-1,
        early_stopping_rounds=30,
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=50
    )

    # Predict
    y_pred = model.predict(X_test)
    y_pred = np.maximum(y_pred, 0)

    # Evaluate
    metrics = compute_metrics(y_test, y_pred)
    print(f"  RMSE: {metrics['rmse']}")
    print(f"  MAE:  {metrics['mae']}")
    print(f"  MAPE: {metrics['mape']}%")

    # Feature importance
    importance = dict(zip(feature_cols, model.feature_importances_.tolist()))
    top_features = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:10]
    print("  Top 10 Features:")
    for fname, fimp in top_features:
        print(f"    {fname}: {fimp:.4f}")

    # Save model and feature columns
    os.makedirs(MODELS_DIR, exist_ok=True)
    model_path = os.path.join(MODELS_DIR, 'xgboost_model.pkl')
    joblib.dump({
        'model': model,
        'feature_cols': feature_cols,
        'feature_importance': importance,
    }, model_path)
    print(f"  Model saved → {model_path}")

    return {
        'name': 'XGBoost',
        'metrics': metrics,
        'model': model,
        'model_path': model_path,
        'feature_cols': feature_cols,
        'feature_importance': importance,
        'forecast_test': y_pred.tolist(),
        'actual_test': y_test.tolist(),
    }


# ======================== LSTM MODEL ========================

def train_lstm(df, target_col='sales', lookback=30, epochs=30, batch_size=64):
    """
    Train LSTM neural network using 30-day lookback windows.
    Uses the total daily sales (aggregated) for sequence modeling.
    """
    print("\n" + "=" * 50)
    print("TRAINING LSTM MODEL")
    print("=" * 50)

    # Aggregate to daily total
    daily_total = df.groupby('date')[target_col].sum().reset_index()
    daily_total = daily_total.sort_values('date')

    values = daily_total[target_col].values.reshape(-1, 1).astype('float32')

    # Scale to [0, 1]
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled = scaler.fit_transform(values)

    # Create lookback sequences
    X, y = [], []
    for i in range(lookback, len(scaled)):
        X.append(scaled[i - lookback:i, 0])
        y.append(scaled[i, 0])

    X = np.array(X)
    y = np.array(y)
    X = X.reshape(X.shape[0], X.shape[1], 1)  # (samples, timesteps, features)

    # Train/test split
    split = len(X) - 90
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    print(f"  Training sequences: {X_train.shape[0]:,}")
    print(f"  Test sequences:     {X_test.shape[0]:,}")
    print(f"  Lookback window:    {lookback} days")

    try:
        # Import TensorFlow/Keras
        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
        import tensorflow as tf
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import LSTM as LSTMLayer, Dense, Dropout
        from tensorflow.keras.callbacks import EarlyStopping

        # Build LSTM
        model = Sequential([
            LSTMLayer(64, return_sequences=True, input_shape=(lookback, 1)),
            Dropout(0.2),
            LSTMLayer(32, return_sequences=False),
            Dropout(0.2),
            Dense(16, activation='relu'),
            Dense(1),
        ])

        model.compile(optimizer='adam', loss='mse')
        print(f"  Model params: {model.count_params():,}")

        # Train
        early_stop = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)

        history = model.fit(
            X_train, y_train,
            validation_data=(X_test, y_test),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=[early_stop],
            verbose=1,
        )

        # Predict
        y_pred_scaled = model.predict(X_test)
        y_pred = scaler.inverse_transform(y_pred_scaled).flatten()
        y_actual = scaler.inverse_transform(y_test.reshape(-1, 1)).flatten()
        y_pred = np.maximum(y_pred, 0)

        # Evaluate
        metrics = compute_metrics(y_actual, y_pred)
        print(f"  RMSE: {metrics['rmse']}")
        print(f"  MAE:  {metrics['mae']}")
        print(f"  MAPE: {metrics['mape']}%")

        # Save
        os.makedirs(MODELS_DIR, exist_ok=True)
        model_path = os.path.join(MODELS_DIR, 'lstm_model.h5')
        model.save(model_path)
        scaler_path = os.path.join(MODELS_DIR, 'lstm_scaler.pkl')
        joblib.dump(scaler, scaler_path)
        print(f"  Model saved → {model_path}")

        return {
            'name': 'LSTM',
            'metrics': metrics,
            'model': model,
            'model_path': model_path,
            'scaler_path': scaler_path,
            'forecast_test': y_pred.tolist(),
            'actual_test': y_actual.tolist(),
        }
    except ImportError:
        print("  ✗ TensorFlow not installed. Skipping LSTM training.")
        return None
    except Exception as e:
        print(f"  ✗ LSTM training failed: {e}")
        return None


# ======================== MODEL SELECTION ========================

def select_best_model(results):
    """Select the best model based on lowest RMSE."""
    valid = [r for r in results if r is not None]
    if not valid:
        raise ValueError("No models were successfully trained!")

    best = min(valid, key=lambda x: x['metrics']['rmse'])
    print("\n" + "=" * 50)
    print("MODEL COMPARISON")
    print("=" * 50)
    print(f"{'Model':<12} {'RMSE':<12} {'MAE':<12} {'MAPE':<10}")
    print("-" * 46)
    for r in valid:
        marker = "  ★ BEST" if r['name'] == best['name'] else ""
        print(f"{r['name']:<12} {r['metrics']['rmse']:<12} {r['metrics']['mae']:<12} {r['metrics']['mape']:<10}{marker}")

    # Save comparison results
    comparison = {
        'best_model': best['name'],
        'trained_at': datetime.now().isoformat(),
        'models': {r['name']: r['metrics'] for r in valid},
    }
    comp_path = os.path.join(MODELS_DIR, 'model_comparison.json')
    with open(comp_path, 'w') as f:
        json.dump(comparison, f, indent=2)

    print(f"\n[RESULT] Best model: {best['name']} (RMSE: {best['metrics']['rmse']})")
    return best, comparison


def train_all_models(df):
    """Train all three models and select the best one."""
    results = []

    # 1. ARIMA
    arima_result = train_arima(df)
    results.append(arima_result)

    # 2. XGBoost
    xgb_result = train_xgboost(df)
    results.append(xgb_result)

    # 3. LSTM
    lstm_result = train_lstm(df)
    results.append(lstm_result)

    # Select best
    best, comparison = select_best_model(results)
    return best, comparison, results

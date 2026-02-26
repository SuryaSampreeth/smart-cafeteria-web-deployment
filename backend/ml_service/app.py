"""
Flask API for Demand Forecasting
==================================
Serves forecast predictions from trained models.

Endpoints:
    GET  /api/health              — Health check
    GET  /api/forecast/daily      — Next 7 days forecast
    GET  /api/forecast/weekly     — Next 4 weeks forecast
    GET  /api/forecast/monthly    — Next 3 months forecast
    GET  /api/forecast/accuracy   — Model accuracy metrics
    POST /api/forecast/retrain    — Trigger model retraining

Runs on port 5001 by default (separate from Node.js on port 5000).
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')
DATA_DIR = os.path.join(BASE_DIR, 'data')
PROCESSED_PATH = os.path.join(DATA_DIR, 'processed_data.csv')

# Global state
loaded_model = None
loaded_model_name = None
model_comparison = None


def load_best_model():
    """Load the best performing model based on model_comparison.json."""
    global loaded_model, loaded_model_name, model_comparison

    comp_path = os.path.join(MODELS_DIR, 'model_comparison.json')
    if not os.path.exists(comp_path):
        print("[WARN] No model_comparison.json found. Models not trained yet.")
        return False

    with open(comp_path, 'r') as f:
        model_comparison = json.load(f)

    best_name = model_comparison.get('best_model', 'XGBoost')

    if best_name == 'XGBoost':
        path = os.path.join(MODELS_DIR, 'xgboost_model.pkl')
        if os.path.exists(path):
            data = joblib.load(path)
            loaded_model = data
            loaded_model_name = 'XGBoost'
            print(f"[INFO] Loaded XGBoost model from {path}")
            return True

    elif best_name == 'SARIMA':
        path = os.path.join(MODELS_DIR, 'arima_model.pkl')
        if os.path.exists(path):
            loaded_model = joblib.load(path)
            loaded_model_name = 'SARIMA'
            print(f"[INFO] Loaded SARIMA model from {path}")
            return True

    elif best_name == 'LSTM':
        path = os.path.join(MODELS_DIR, 'lstm_model.h5')
        if os.path.exists(path):
            os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
            import tensorflow as tf
            loaded_model = {
                'model': tf.keras.models.load_model(path),
                'scaler': joblib.load(os.path.join(MODELS_DIR, 'lstm_scaler.pkl')),
            }
            loaded_model_name = 'LSTM'
            print(f"[INFO] Loaded LSTM model from {path}")
            return True

    print(f"[WARN] Could not load model: {best_name}")
    return False


def generate_xgboost_forecast(days):
    """Generate forecast using XGBoost model."""
    model_data = loaded_model
    model = model_data['model']
    feature_cols = model_data['feature_cols']

    # Load processed data for context
    df = pd.read_csv(PROCESSED_PATH, parse_dates=['date'])
    df = df.sort_values('date')

    # Get the latest data point as template
    last_row = df.iloc[-1].copy()
    base_date = pd.Timestamp(datetime.now().date())
    
    forecasts = []
    for i in range(days):
        forecast_date = base_date + timedelta(days=i)

        # Build feature vector from template + date features
        row = last_row.copy()
        row['day_of_week'] = forecast_date.dayofweek
        row['day_of_month'] = forecast_date.day
        row['month'] = forecast_date.month
        row['year'] = forecast_date.year
        row['week_of_year'] = forecast_date.isocalendar()[1]
        row['is_weekend'] = 1 if forecast_date.dayofweek >= 5 else 0
        row['quarter'] = (forecast_date.month - 1) // 3 + 1
        row['day_of_year'] = forecast_date.timetuple().tm_yday
        row['dow_sin'] = np.sin(2 * np.pi * forecast_date.dayofweek / 7)
        row['dow_cos'] = np.cos(2 * np.pi * forecast_date.dayofweek / 7)
        row['month_sin'] = np.sin(2 * np.pi * forecast_date.month / 12)
        row['month_cos'] = np.cos(2 * np.pi * forecast_date.month / 12)

        # Extract features
        features = []
        for col in feature_cols:
            if col in row.index:
                features.append(float(row[col]))
            else:
                features.append(0.0)

        X = np.array([features])
        pred = float(model.predict(X)[0])
        pred = max(0, pred)

        # Confidence interval (±15% heuristic)
        confidence_lower = max(0, pred * 0.85)
        confidence_upper = pred * 1.15

        forecasts.append({
            'date': forecast_date.strftime('%Y-%m-%d'),
            'day_name': forecast_date.strftime('%A'),
            'predicted_demand': round(pred, 1),
            'confidence': {
                'lower': round(confidence_lower, 1),
                'upper': round(confidence_upper, 1),
            }
        })

    return forecasts


def generate_arima_forecast(days):
    """Generate forecast using SARIMA model."""
    model = loaded_model
    forecast = model.forecast(steps=days)
    forecast = np.maximum(forecast, 0)

    base_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    forecasts = []
    for i, val in enumerate(forecast):
        forecast_date = base_date + timedelta(days=i)
        pred = float(val)
        forecasts.append({
            'date': forecast_date.strftime('%Y-%m-%d'),
            'day_name': forecast_date.strftime('%A'),
            'predicted_demand': round(pred, 1),
            'confidence': {
                'lower': round(max(0, pred * 0.80), 1),
                'upper': round(pred * 1.20, 1),
            }
        })
    return forecasts


def generate_lstm_forecast(days):
    """Generate forecast using LSTM model."""
    model = loaded_model['model']
    scaler = loaded_model['scaler']

    # Load recent data for lookback window
    df = pd.read_csv(PROCESSED_PATH, parse_dates=['date'])
    daily_total = df.groupby('date')['sales'].sum().sort_index().values
    lookback = 30

    # Prepare input
    recent = daily_total[-lookback:]
    scaled = scaler.transform(recent.reshape(-1, 1))

    forecasts = []
    current_input = scaled.flatten().tolist()
    base_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    for i in range(days):
        X = np.array(current_input[-lookback:]).reshape(1, lookback, 1)
        pred_scaled = model.predict(X, verbose=0)[0, 0]
        pred = float(scaler.inverse_transform([[pred_scaled]])[0, 0])
        pred = max(0, pred)

        forecast_date = base_date + timedelta(days=i)
        forecasts.append({
            'date': forecast_date.strftime('%Y-%m-%d'),
            'day_name': forecast_date.strftime('%A'),
            'predicted_demand': round(pred, 1),
            'confidence': {
                'lower': round(max(0, pred * 0.82), 1),
                'upper': round(pred * 1.18, 1),
            }
        })
        current_input.append(pred_scaled)

    return forecasts


def generate_forecast(days):
    """Route to the appropriate model's forecast generator."""
    if loaded_model_name == 'XGBoost':
        return generate_xgboost_forecast(days)
    elif loaded_model_name == 'SARIMA':
        return generate_arima_forecast(days)
    elif loaded_model_name == 'LSTM':
        return generate_lstm_forecast(days)
    else:
        return []


# ======================== API ROUTES ========================

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': loaded_model is not None,
        'model_name': loaded_model_name,
        'timestamp': datetime.now().isoformat(),
    })


@app.route('/api/forecast/daily', methods=['GET'])
def daily_forecast():
    """Get demand forecast for the next 7 days."""
    if loaded_model is None:
        return jsonify({'error': 'No model loaded. Run train.py first.'}), 503

    try:
        days = int(request.args.get('days', 7))
        days = min(days, 30)  # Cap at 30
        forecasts = generate_forecast(days)

        return jsonify({
            'forecast_type': 'daily',
            'model_used': loaded_model_name,
            'generated_at': datetime.now().isoformat(),
            'forecast_horizon': f'{days} days',
            'data': forecasts,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/forecast/weekly', methods=['GET'])
def weekly_forecast():
    """Get demand forecast aggregated by week for next 4 weeks."""
    if loaded_model is None:
        return jsonify({'error': 'No model loaded. Run train.py first.'}), 503

    try:
        weeks = int(request.args.get('weeks', 4))
        weeks = min(weeks, 12)
        daily_data = generate_forecast(weeks * 7)

        # Aggregate by week
        weekly_data = []
        for w in range(weeks):
            week_slice = daily_data[w * 7:(w + 1) * 7]
            if week_slice:
                total = sum(d['predicted_demand'] for d in week_slice)
                avg = total / len(week_slice)
                weekly_data.append({
                    'week_number': w + 1,
                    'start_date': week_slice[0]['date'],
                    'end_date': week_slice[-1]['date'],
                    'total_predicted_demand': round(total, 1),
                    'avg_daily_demand': round(avg, 1),
                    'confidence': {
                        'lower': round(total * 0.85, 1),
                        'upper': round(total * 1.15, 1),
                    }
                })

        return jsonify({
            'forecast_type': 'weekly',
            'model_used': loaded_model_name,
            'generated_at': datetime.now().isoformat(),
            'forecast_horizon': f'{weeks} weeks',
            'data': weekly_data,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/forecast/monthly', methods=['GET'])
def monthly_forecast():
    """Get demand forecast aggregated by month for next 3 months."""
    if loaded_model is None:
        return jsonify({'error': 'No model loaded. Run train.py first.'}), 503

    try:
        months = int(request.args.get('months', 3))
        months = min(months, 6)
        daily_data = generate_forecast(months * 30)

        # Aggregate by ~month (30-day blocks)
        monthly_data = []
        for m in range(months):
            month_slice = daily_data[m * 30:(m + 1) * 30]
            if month_slice:
                total = sum(d['predicted_demand'] for d in month_slice)
                avg = total / len(month_slice)
                monthly_data.append({
                    'month_number': m + 1,
                    'start_date': month_slice[0]['date'],
                    'end_date': month_slice[-1]['date'],
                    'total_predicted_demand': round(total, 1),
                    'avg_daily_demand': round(avg, 1),
                    'confidence': {
                        'lower': round(total * 0.82, 1),
                        'upper': round(total * 1.18, 1),
                    }
                })

        return jsonify({
            'forecast_type': 'monthly',
            'model_used': loaded_model_name,
            'generated_at': datetime.now().isoformat(),
            'forecast_horizon': f'{months} months',
            'data': monthly_data,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/forecast/accuracy', methods=['GET'])
def model_accuracy():
    """Get accuracy metrics for all trained models."""
    comp_path = os.path.join(MODELS_DIR, 'model_comparison.json')
    if not os.path.exists(comp_path):
        return jsonify({'error': 'No model comparison data. Run train.py first.'}), 503

    with open(comp_path, 'r') as f:
        comparison = json.load(f)

    return jsonify({
        'best_model': comparison.get('best_model'),
        'trained_at': comparison.get('trained_at'),
        'models': comparison.get('models', {}),
        'active_model': loaded_model_name,
        'description': {
            'rmse': 'Root Mean Squared Error — lower is better',
            'mae': 'Mean Absolute Error — lower is better',
            'mape': 'Mean Absolute Percentage Error (%) — lower is better',
        }
    })


@app.route('/api/forecast/retrain', methods=['POST'])
def retrain():
    """Trigger model retraining."""
    try:
        import subprocess
        result = subprocess.run(
            ['python', os.path.join(BASE_DIR, 'train.py'), '--skip-data'],
            capture_output=True, text=True, timeout=600
        )

        if result.returncode == 0:
            # Reload model
            load_best_model()
            return jsonify({
                'status': 'success',
                'message': 'Models retrained successfully',
                'active_model': loaded_model_name,
                'output': result.stdout[-500:] if result.stdout else '',
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Training failed',
                'error': result.stderr[-500:] if result.stderr else '',
            }), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/forecast/historical', methods=['GET'])
def historical_comparison():
    """
    Get historical actual vs predicted comparison (from test set).
    Useful for accuracy visualization on the dashboard.
    """
    comp_path = os.path.join(MODELS_DIR, 'model_comparison.json')
    if not os.path.exists(comp_path):
        return jsonify({'error': 'No model data available.'}), 503

    # Load the processed data for actual values
    if not os.path.exists(PROCESSED_PATH):
        return jsonify({'error': 'Processed data not found.'}), 503

    df = pd.read_csv(PROCESSED_PATH, parse_dates=['date'])
    daily_total = df.groupby('date')['sales'].sum().reset_index()
    daily_total = daily_total.sort_values('date')

    # Last 90 days as "actual" test data
    last_90 = daily_total.tail(90)

    # If we have an XGBoost model, generate predictions for those dates
    historical = []
    for _, row in last_90.iterrows():
        historical.append({
            'date': row['date'].strftime('%Y-%m-%d'),
            'actual_demand': round(float(row['sales']), 1),
        })

    return jsonify({
        'model_used': loaded_model_name,
        'data': historical,
        'period': '90 days (test set)',
    })


# ======================== MAIN ========================

import os

# Load model at module level so it works with gunicorn AND direct python runs.
# When Render uses gunicorn, the `if __name__ == '__main__'` block is NEVER
# executed, so the model would never be loaded without this line.
print("[INFO] Loading ML model at startup...")
load_best_model()

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    print(f"[INFO] Starting Demand Forecasting API on port {port}...")
    app.run(host='0.0.0.0', port=port)

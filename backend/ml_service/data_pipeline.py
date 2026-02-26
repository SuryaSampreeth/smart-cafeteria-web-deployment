"""
Data Pipeline for Demand Forecasting
=====================================
Downloads real datasets, fetches weather data from Open-Meteo API,
generates academic calendar features, and produces a merged dataset.

Data Sources:
- Kaggle Store Item Demand Forecasting (5 years, 50 items, 10 stores)
- Open-Meteo Historical Weather API (Hyderabad, India)
- Academic Calendar (VIT University pattern, mapped to dataset dates)
"""

import os
import json
import requests
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
RAW_DATA_PATH = os.path.join(DATA_DIR, 'train.csv')
CALENDAR_PATH = os.path.join(DATA_DIR, 'academic_calendar.json')
WEATHER_PATH = os.path.join(DATA_DIR, 'weather_data.csv')
PROCESSED_PATH = os.path.join(DATA_DIR, 'processed_data.csv')


def load_kaggle_sales_data():
    """
    Load the real Kaggle 'Store Item Demand Forecasting' dataset.
    
    The dataset must be downloaded manually from Kaggle and placed at:
        data/train.csv
    
    Download link:
        https://www.kaggle.com/competitions/demand-forecasting-kernels-only/data
    
    Expected columns: date, store, item, sales
    Dataset: 5 years (2013–2017), 10 stores, 50 items, ~913K rows
    """
    if not os.path.exists(RAW_DATA_PATH):
        print("=" * 60)
        print("ERROR: Kaggle dataset not found!")
        print("=" * 60)
        print(f"  Expected file: {RAW_DATA_PATH}")
        print()
        print("  Please download 'train.csv' from:")
        print("  https://www.kaggle.com/competitions/demand-forecasting-kernels-only/data")
        print()
        print("  Save it to:")
        print(f"  {RAW_DATA_PATH}")
        print("=" * 60)
        raise FileNotFoundError(
            f"Kaggle dataset not found at {RAW_DATA_PATH}. "
            "Download train.csv from https://www.kaggle.com/competitions/demand-forecasting-kernels-only/data"
        )

    print("[INFO] Loading Kaggle Store Item Demand Forecasting dataset...")
    df = pd.read_csv(RAW_DATA_PATH, parse_dates=['date'])

    # Shift Kaggle dates from 2013-2017 -> 2020-2024
    df['date'] = df['date'] + pd.DateOffset(years=7)

    # Validate expected columns
    expected_cols = {'date', 'store', 'item', 'sales'}
    actual_cols = set(df.columns)
    if not expected_cols.issubset(actual_cols):
        raise ValueError(
            f"Dataset missing columns. Expected: {expected_cols}, Got: {actual_cols}"
        )

    print(f"  + Loaded {len(df):,} rows")
    print(f"  + Date range: {df['date'].min().date()} to {df['date'].max().date()}")
    print(f"  + Stores: {df['store'].nunique()}, Items: {df['item'].nunique()}")
    return df


def fetch_weather_data(city_lat=17.385, city_lon=78.4867, start='2020-01-01', end='2024-12-31'):
    """
    Fetch historical weather data from Open-Meteo API.
    Default: Hyderabad, India (17.385°N, 78.487°E)

    Returns DataFrame with: date, temperature_max, temperature_min,
    temperature_mean, precipitation, humidity (relative_humidity_2m_mean)
    """
    if os.path.exists(WEATHER_PATH):
        print("[INFO] Weather data already cached. Loading from file.")
        return pd.read_csv(WEATHER_PATH, parse_dates=['date'])

    print(f"[INFO] Fetching weather data from Open-Meteo ({start} to {end})...")

    # Open-Meteo free historical weather API
    # Split into yearly chunks to stay within API limits
    all_weather = []
    current_start = datetime.strptime(start, '%Y-%m-%d')
    final_end = datetime.strptime(end, '%Y-%m-%d')

    while current_start <= final_end:
        chunk_end = min(current_start + timedelta(days=364), final_end)

        url = (
            f"https://archive-api.open-meteo.com/v1/archive?"
            f"latitude={city_lat}&longitude={city_lon}"
            f"&start_date={current_start.strftime('%Y-%m-%d')}"
            f"&end_date={chunk_end.strftime('%Y-%m-%d')}"
            f"&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,"
            f"precipitation_sum,rain_sum"
            f"&timezone=Asia/Kolkata"
        )

        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            data = response.json()

            if 'daily' in data:
                chunk_df = pd.DataFrame({
                    'date': pd.to_datetime(data['daily']['time']),
                    'temperature_max': data['daily']['temperature_2m_max'],
                    'temperature_min': data['daily']['temperature_2m_min'],
                    'temperature_mean': data['daily']['temperature_2m_mean'],
                    'precipitation': data['daily']['precipitation_sum'],
                    'rainfall': data['daily']['rain_sum'],
                })
                all_weather.append(chunk_df)
                print(f"  + Fetched {current_start.strftime('%Y-%m-%d')} to {chunk_end.strftime('%Y-%m-%d')}")
        except Exception as e:
            print(f"  - Error fetching weather: {e}")
            print("  -> Generating fallback weather data for this period")
            # Generate realistic fallback weather for Hyderabad
            fallback_dates = pd.date_range(current_start, chunk_end, freq='D')
            fallback_df = _generate_fallback_weather(fallback_dates)
            all_weather.append(fallback_df)

        current_start = chunk_end + timedelta(days=1)

    weather_df = pd.concat(all_weather, ignore_index=True)

    # Fill any missing values
    weather_df = weather_df.fillna(method='ffill').fillna(method='bfill')

    weather_df.to_csv(WEATHER_PATH, index=False)
    print(f"[INFO] Weather data saved → {WEATHER_PATH} ({len(weather_df)} days)")
    return weather_df


def _generate_fallback_weather(dates):
    """Generate realistic weather data for Hyderabad as fallback."""
    np.random.seed(hash(str(dates[0])) % 2**31)
    n = len(dates)

    # Hyderabad typical temperatures by month
    month_temp_mean = {
        1: 22, 2: 25, 3: 29, 4: 33, 5: 35, 6: 30,
        7: 27, 8: 27, 9: 27, 10: 26, 11: 23, 12: 21
    }
    month_rain = {
        1: 2, 2: 5, 3: 8, 4: 15, 5: 25, 6: 100,
        7: 160, 8: 150, 9: 140, 10: 80, 11: 15, 12: 3
    }

    records = []
    for d in dates:
        base_temp = month_temp_mean[d.month]
        temp_mean = base_temp + np.random.normal(0, 2)
        temp_max = temp_mean + np.random.uniform(3, 7)
        temp_min = temp_mean - np.random.uniform(3, 7)
        daily_rain_chance = month_rain[d.month] / 30
        rain = max(0, np.random.exponential(daily_rain_chance))

        records.append({
            'date': d,
            'temperature_max': round(temp_max, 1),
            'temperature_min': round(temp_min, 1),
            'temperature_mean': round(temp_mean, 1),
            'precipitation': round(rain, 1),
            'rainfall': round(rain * 0.9, 1),
        })

    return pd.DataFrame(records)


def load_academic_calendar():
    """
    Load the academic calendar JSON and convert to date-indexed features.
    Returns dict with sets of dates for: semester, exam, holiday, vacation.
    """
    print("[INFO] Loading academic calendar...")

    with open(CALENDAR_PATH, 'r') as f:
        cal = json.load(f)

    # Build date sets
    semester_dates = set()
    for sem in cal.get('semesters', []):
        rng = pd.date_range(sem['start'], sem['end'], freq='D')
        semester_dates.update(rng)

    exam_dates = set()
    for exam in cal.get('exam_periods', []):
        rng = pd.date_range(exam['start'], exam['end'], freq='D')
        exam_dates.update(rng)

    holiday_dates = set()
    for hol in cal.get('holidays', []):
        for d in hol.get('dates', []):
            holiday_dates.add(pd.Timestamp(d))

    vacation_dates = set()
    for vac in cal.get('vacation_periods', []):
        rng = pd.date_range(vac['start'], vac['end'], freq='D')
        vacation_dates.update(rng)

    print(f"  + Semester days: {len(semester_dates)}")
    print(f"  + Exam days: {len(exam_dates)}")
    print(f"  + Holidays: {len(holiday_dates)}")
    print(f"  + Vacation days: {len(vacation_dates)}")

    return semester_dates, exam_dates, holiday_dates, vacation_dates


def engineer_features(df, weather_df, semester_dates, exam_dates, holiday_dates, vacation_dates):
    """
    Create rich feature set by merging sales, weather, and academic calendar data.
    """
    print("[INFO] Engineering features...")

    # Aggregate sales across all stores for each item per day
    # This gives us a cafeteria-level daily demand signal
    daily = df.groupby(['date', 'item']).agg({'sales': 'sum'}).reset_index()

    # --- Temporal features ---
    daily['day_of_week'] = daily['date'].dt.dayofweek
    daily['day_of_month'] = daily['date'].dt.day
    daily['month'] = daily['date'].dt.month
    daily['year'] = daily['date'].dt.year
    daily['week_of_year'] = daily['date'].dt.isocalendar().week.astype(int)
    daily['is_weekend'] = (daily['day_of_week'] >= 5).astype(int)
    daily['quarter'] = daily['date'].dt.quarter
    daily['day_of_year'] = daily['date'].dt.dayofyear

    # Cyclical encoding (sin/cos) for day_of_week and month
    daily['dow_sin'] = np.sin(2 * np.pi * daily['day_of_week'] / 7)
    daily['dow_cos'] = np.cos(2 * np.pi * daily['day_of_week'] / 7)
    daily['month_sin'] = np.sin(2 * np.pi * daily['month'] / 12)
    daily['month_cos'] = np.cos(2 * np.pi * daily['month'] / 12)

    # --- Merge weather ---
    weather_df['date'] = pd.to_datetime(weather_df['date'])
    daily = daily.merge(weather_df, on='date', how='left')

    # Weather interaction features
    daily['is_rainy'] = (daily['rainfall'] > 2.0).astype(int)
    daily['is_hot'] = (daily['temperature_max'] > 35).astype(int)
    daily['temp_range'] = daily['temperature_max'] - daily['temperature_min']

    # --- Academic calendar features ---
    daily['is_semester'] = daily['date'].isin(semester_dates).astype(int)
    daily['is_exam'] = daily['date'].isin(exam_dates).astype(int)
    daily['is_holiday'] = daily['date'].isin(holiday_dates).astype(int)
    daily['is_vacation'] = daily['date'].isin(vacation_dates).astype(int)

    # --- Lag features (per item) ---
    daily = daily.sort_values(['item', 'date'])
    for lag in [1, 7, 14, 28]:
        daily[f'sales_lag_{lag}'] = daily.groupby('item')['sales'].shift(lag)

    # Rolling window features
    for window in [7, 14, 30]:
        daily[f'sales_rolling_mean_{window}'] = (
            daily.groupby('item')['sales']
            .transform(lambda x: x.rolling(window, min_periods=1).mean())
        )
        daily[f'sales_rolling_std_{window}'] = (
            daily.groupby('item')['sales']
            .transform(lambda x: x.rolling(window, min_periods=1).std())
        )

    # Expanding mean (cumulative average up to that point)
    daily['sales_expanding_mean'] = (
        daily.groupby('item')['sales']
        .transform(lambda x: x.expanding(min_periods=1).mean())
    )

    # --- Item category mapping ---
    # Map the 50 items to cafeteria food categories
    item_categories = {}
    categories = ['veg', 'non-veg', 'beverage', 'dessert', 'snack']
    for i in range(1, 51):
        item_categories[i] = categories[(i - 1) % len(categories)]

    daily['item_category'] = daily['item'].map(item_categories)

    # One-hot encode item_category
    cat_dummies = pd.get_dummies(daily['item_category'], prefix='cat')
    daily = pd.concat([daily, cat_dummies], axis=1)

    # Drop rows with NaN from lag features
    daily = daily.dropna()

    print(f"[INFO] Final dataset: {daily.shape[0]:,} rows × {daily.shape[1]} columns")
    return daily


def run_pipeline():
    """Run the complete data pipeline."""
    print("=" * 60)
    print("DEMAND FORECASTING DATA PIPELINE")
    print("=" * 60)

    os.makedirs(DATA_DIR, exist_ok=True)

    # Step 1: Load real Kaggle sales data
    sales_df = load_kaggle_sales_data()

    # Step 2: Fetch/load weather data
    weather_df = fetch_weather_data()

    # Step 3: Load academic calendar
    semester_dates, exam_dates, holiday_dates, vacation_dates = load_academic_calendar()

    # Step 4: Engineer features
    processed_df = engineer_features(
        sales_df, weather_df,
        semester_dates, exam_dates, holiday_dates, vacation_dates
    )

    # Step 5: Save processed data
    processed_df.to_csv(PROCESSED_PATH, index=False)
    print(f"\n[SUCCESS] Processed data saved → {PROCESSED_PATH}")
    print(f"  Date range: {processed_df['date'].min()} to {processed_df['date'].max()}")
    print(f"  Items: {processed_df['item'].nunique()}")
    print(f"  Features: {processed_df.shape[1]}")

    return processed_df


if __name__ == '__main__':
    run_pipeline()

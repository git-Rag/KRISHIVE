from __future__ import annotations

from typing import Any


def _to_float(value: Any, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def get_water_advice(
    crop: str,
    soil_condition: str,
    temperature: float,
    humidity: float,
    rain_forecast: bool,
    location: dict[str, Any] | None = None,
) -> dict[str, str]:
    """
    Returns:
    {
        "decision": "irrigate / wait",
        "reason": "...",
        "water_amount": "...",
        "timing": "..."
    }
    """
    crop_name = (crop or "crop").strip().lower()
    soil = (soil_condition or "medium").strip().lower()
    temp = _to_float(temperature, 28.0)
    hum = _to_float(humidity, 60.0)

    base_liters: dict[str, int] = {
        "wheat": 30,
        "rice": 55,
        "paddy": 55,
        "maize": 35,
        "cotton": 45,
        "sugarcane": 60,
    }
    amount = base_liters.get(crop_name, 35)

    if soil == "dry":
        amount += 12
    elif soil == "wet":
        amount -= 18

    if temp >= 34:
        amount += 8
    elif temp <= 20:
        amount -= 4

    if hum >= 80:
        amount -= 5
    elif hum <= 35:
        amount += 5

    amount = max(10, min(amount, 80))
    district = str((location or {}).get("district") or "").strip()

    if rain_forecast and soil != "dry":
        decision = "wait"
        reason = "Rain is likely soon and soil already has moisture."
        water_amount = "0 liters now"
        timing = "Review after 12-24 hours"
    elif soil == "wet":
        decision = "wait"
        reason = "Soil is wet. Irrigation now can harm roots."
        water_amount = "0 liters now"
        timing = "Check again tomorrow morning"
    else:
        decision = "irrigate"
        reason = "Soil and weather indicate crop needs water."
        water_amount = f"{amount} liters per acre"
        timing = "Early morning or evening"

    if district:
        reason = f"{reason} Location considered: {district}."

    return {
        "decision": decision,
        "reason": reason,
        "water_amount": water_amount,
        "timing": timing,
    }


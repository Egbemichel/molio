"""
Base admin classes.

Every ModelAdmin in the project extends `CustomModelAdmin`, so pointing it at
Unfold's ModelAdmin is what themes the whole admin. Functionality is unchanged —
this only swaps the base class.
"""

from unfold.admin import ModelAdmin as UnfoldModelAdmin


class CustomModelAdmin(UnfoldModelAdmin):
    """Shared base admin — Unfold styling for every registered model."""
    pass


__all__ = ['CustomModelAdmin']

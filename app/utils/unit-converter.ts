import { InventoryItem } from '../types/product';

// Unit categories
export type UnitCategory = 'count' | 'volume' | 'weight';

// Unit definitions with their categories
const UNIT_CATEGORIES: Record<string, UnitCategory> = {
  // Count units
  'pieces': 'count',
  'units': 'count',
  'boxes': 'count',
  'bags': 'count',
  'scoops': 'count',
  'shots': 'count',
  
  // Volume units
  'ml': 'volume',
  'l': 'volume',
  'liters': 'volume',
  'cups': 'volume',
  'fl oz': 'volume',
  'tbsp': 'volume',
  'tsp': 'volume',
  'oz': 'volume', // fluid ounces
  
  // Weight units
  'g': 'weight',
  'kg': 'weight',
  'lbs': 'weight',
  'pounds': 'weight',
};

// Conversion factors to base units (all conversions go through base unit)
// Base units: pieces (count), ml (volume), g (weight)
const CONVERSION_TO_BASE: Record<string, number> = {
  // Count - base: pieces
  'pieces': 1,
  'units': 1,
  'boxes': 1, // Will use piecesPerUnit
  'bags': 1, // Will use piecesPerUnit
  'scoops': 1, // Will use piecesPerUnit
  'shots': 1,
  
  // Volume - base: ml
  'ml': 1,
  'l': 1000,
  'liters': 1000,
  'cups': 236.588, // US cup to ml
  'fl oz': 29.5735, // US fluid ounce to ml
  'tbsp': 14.7868, // US tablespoon to ml
  'tsp': 4.92892, // US teaspoon to ml
  'oz': 29.5735, // fluid ounces (same as fl oz)
  
  // Weight - base: g
  'g': 1,
  'kg': 1000,
  'lbs': 453.592, // pounds to grams
  'pounds': 453.592,
};

/**
 * Get the category of a unit
 */
export function getUnitCategory(unit: string): UnitCategory | null {
  return UNIT_CATEGORIES[unit.toLowerCase()] || null;
}

/**
 * Check if two units are compatible (same category)
 */
export function areUnitsCompatible(unit1: string, unit2: string): boolean {
  const cat1 = getUnitCategory(unit1);
  const cat2 = getUnitCategory(unit2);
  return cat1 !== null && cat1 === cat2;
}

/**
 * Convert a value from one unit to another
 * Returns null if units are incompatible
 */
export function convertUnit(value: number, fromUnit: string, toUnit: string): number | null {
  if (!fromUnit || !toUnit) return null;
  
  const fromLower = fromUnit.toLowerCase();
  const toLower = toUnit.toLowerCase();
  
  // Same unit, no conversion needed
  if (fromLower === toLower) return value;
  
  // Check compatibility
  if (!areUnitsCompatible(fromUnit, toUnit)) {
    return null;
  }
  
  // Get conversion factors
  const fromFactor = CONVERSION_TO_BASE[fromLower];
  const toFactor = CONVERSION_TO_BASE[toLower];
  
  if (fromFactor === undefined || toFactor === undefined) {
    return null;
  }
  
  // Convert: value -> base unit -> target unit
  const baseValue = value * fromFactor;
  return baseValue / toFactor;
}

/**
 * Get the base unit for an inventory item
 * Returns the baseUnit if set, otherwise returns the unit or 'units'
 */
export function getBaseUnit(inventoryItem: InventoryItem): string {
  if (inventoryItem.baseUnit) {
    return inventoryItem.baseUnit;
  }
  return inventoryItem.unit || 'units';
}

/**
 * Convert a recipe quantity/unit to the inventory item's unit
 * Handles piecesPerUnit conversion for count units
 */
export function convertToInventoryUnit(
  recipeQuantity: number,
  recipeUnit: string | undefined,
  inventoryItem: InventoryItem
): number | null {
  if (!recipeUnit) {
    recipeUnit = 'units';
  }
  
  const inventoryUnit = inventoryItem.unit || 'units';
  
  // Same unit, no conversion needed
  if (recipeUnit.toLowerCase() === inventoryUnit.toLowerCase()) {
    return recipeQuantity;
  }
  
  // Check if units are compatible
  if (!areUnitsCompatible(recipeUnit, inventoryUnit)) {
    return null;
  }
  
  const category = getUnitCategory(recipeUnit);
  
  // For count units, use piecesPerUnit if available
  if (category === 'count' && inventoryItem.piecesPerUnit) {
    const baseUnit = getBaseUnit(inventoryItem);
    
    // If recipe is in base unit (pieces) and inventory is in container unit (bags)
    if (recipeUnit.toLowerCase() === baseUnit.toLowerCase() && 
        inventoryUnit.toLowerCase() !== baseUnit.toLowerCase()) {
      // Convert pieces to containers: pieces / piecesPerUnit
      return recipeQuantity / inventoryItem.piecesPerUnit;
    }
    
    // If recipe is in container unit and inventory is in base unit
    if (recipeUnit.toLowerCase() !== baseUnit.toLowerCase() && 
        inventoryUnit.toLowerCase() === baseUnit.toLowerCase()) {
      // Convert containers to pieces: containers * piecesPerUnit
      return recipeQuantity * inventoryItem.piecesPerUnit;
    }
    
    // Both in container units, convert through base unit
    const recipeInBase = recipeUnit.toLowerCase() === baseUnit.toLowerCase() 
      ? recipeQuantity 
      : recipeQuantity * inventoryItem.piecesPerUnit;
    
    const inventoryInBase = inventoryUnit.toLowerCase() === baseUnit.toLowerCase()
      ? 1
      : inventoryItem.piecesPerUnit;
    
    return recipeInBase / inventoryInBase;
  }
  
  // For volume and weight, use standard conversion
  return convertUnit(recipeQuantity, recipeUnit, inventoryUnit);
}

/**
 * Get the total quantity in base units for an inventory item
 * Returns value rounded to 2 decimal places
 */
export function getTotalBaseQuantity(inventoryItem: InventoryItem): number {
  const quantity = inventoryItem.quantity || 0;
  const unit = inventoryItem.unit || 'units';
  const baseUnit = getBaseUnit(inventoryItem);
  
  let baseQuantity: number;
  
  // If already in base unit
  if (unit.toLowerCase() === baseUnit.toLowerCase()) {
    baseQuantity = quantity;
  } else {
    // For count units with piecesPerUnit
    const category = getUnitCategory(unit);
    if (category === 'count' && inventoryItem.piecesPerUnit) {
      baseQuantity = quantity * inventoryItem.piecesPerUnit;
    } else {
      // For volume/weight, convert to base
      const converted = convertUnit(quantity, unit, baseUnit);
      baseQuantity = converted || quantity;
    }
  }
  
  // Round to 2 decimal places
  return Math.round(baseQuantity * 100) / 100;
}

/**
 * Format inventory quantity with both units displayed
 * Rounds to maximum 2 decimal places
 */
export function formatInventoryQuantity(inventoryItem: InventoryItem): string {
  const quantity = inventoryItem.quantity || 0;
  const roundedQuantity = Math.round(quantity * 100) / 100;
  const unit = inventoryItem.unit || 'units';
  const baseUnit = getBaseUnit(inventoryItem);
  
  // If no base unit or piecesPerUnit, just show the unit
  if (!inventoryItem.baseUnit || !inventoryItem.piecesPerUnit) {
    return `${roundedQuantity} ${unit}`;
  }
  
  // If already in base unit, just show it
  if (unit.toLowerCase() === baseUnit.toLowerCase()) {
    return `${roundedQuantity} ${baseUnit}`;
  }
  
  // Show both units
  const totalBase = getTotalBaseQuantity(inventoryItem);
  const roundedTotalBase = Math.round(totalBase * 100) / 100;
  return `${roundedQuantity} ${unit} (${roundedTotalBase} ${baseUnit})`;
}

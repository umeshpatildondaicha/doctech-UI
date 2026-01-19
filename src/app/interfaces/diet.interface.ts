export interface Diet {
  dietId: string;
  name: string;
  description: string;
  dietType: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  createdByDoctorId: string;
  createdAt: Date;
  isActive: boolean;
  imageUrl?: string;
  videoUrl?: string;
  documentUrl?: string;
  tags?: string[];
  ingredients?: Ingredient[];
  recipe?: Recipe;
  mealPlan?: MealPlan[];
}

export interface MealPlan {
  mealId: string;
  mealName: string;
  mealTime: string;
  foods: FoodItem[];
  totalCalories: number;
}

export interface FoodItem {
  foodId: string;
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Ingredient {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  notes?: string;
}

export interface Recipe {
  recipeId: string;
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  instructions: RecipeStep[];
  tips?: string[];
  notes?: string;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  duration?: number; // in minutes
  tips?: string;
} 

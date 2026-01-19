export interface ExerciseSet {
  setId: string; // PK
  exerciseId: string; // FK
  setNumber: number;
  reps: number;
  holdTime: number; // in seconds
  restTime: number; // in seconds
  tempo?: string; // tempo for the set
}

export interface Exercise {
  exerciseId: string; // PK
  name: string;
  description: string;
  createdByDoctorId: string; // FK
  exerciseType: string;
  category: string; // Strength, Cardio, etc.
  difficulty: string; // Beginner, Intermediate, Advanced
  targetMuscles: string[]; // Array of target muscles
  equipment: string[]; // Array of equipment needed
  tags: string[]; // Array of tags
  coachingCues: string; // Coaching instructions
  contraindications: string; // Contraindications
  sets: ExerciseSet[]; // Array of sets for this exercise
  media?: string[]; // Array of media files (images, videos, gifs)
  imageUrl?: string; // Primary image URL for the exercise
  videoUrl?: string; // Video URL for the exercise
  createdAt: Date;
  updatedAt: Date;
}

export interface ExerciseStats {
  totalExercises: number;
  categories: { [key: string]: number };
  topMuscles: string[];
} 

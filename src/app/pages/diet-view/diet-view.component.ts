import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Diet } from '../../interfaces/diet.interface';
import { SafePipe } from '@lk/core';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';

@Component({
    selector: 'app-diet-view',
    imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SafePipe,
    BreadcrumbComponent
],
    templateUrl: './diet-view.component.html',
    styleUrl: './diet-view.component.scss'
})
export class DietViewComponent implements OnInit {
  diet: Diet | null = null;
  activeTab: string = 'nutrition';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    // Get diet data from route params or state
    console.log('DietViewComponent initialized');
    this.route.params.subscribe(params => {
      const dietId = params['id'];
      console.log('Diet ID from route:', dietId);
      this.loadDietData(dietId);
    });
  }

  loadDietData(dietId: string) {
    console.log('Loading diet data for ID:', dietId);
    // TODO: Replace with actual API call
    // For now, using mock data
    const mockDiets = [
      {
        dietId: '1',
        name: 'Balanced Veg Bowl',
        description: 'Quinoa, chickpeas, mixed veggies, olive oil dressing.',
        dietType: 'Mediterranean',
        calories: 520,
        protein: 22,
        carbs: 68,
        fat: 18,
        fiber: 11,
        createdByDoctorId: 'doc1',
        createdAt: new Date(),
        isActive: true,
        imageUrl: 'https://arohanyoga.com/wp-content/uploads/2024/03/The-Yogic-Diet-Food-for-Mind-and-Body-.jpg',
        videoUrl: 'https://youtu.be/oX_iH0CbZzg?si=jkzW8WP0xBasAYdB',
        documentUrl: 'https://morth.nic.in/sites/default/files/dd12-13_0.pdf',
        tags: ['lunch', 'quick'],
        ingredients: [
          { ingredientId: '1', name: 'Quinoa', quantity: 1, unit: 'cup', category: 'Grains' },
          { ingredientId: '2', name: 'Chickpeas', quantity: 1, unit: 'can', category: 'Legumes' },
          { ingredientId: '3', name: 'Mixed Vegetables', quantity: 2, unit: 'cups', category: 'Vegetables' },
          { ingredientId: '4', name: 'Olive Oil', quantity: 2, unit: 'tbsp', category: 'Oils' },
          { ingredientId: '5', name: 'Lemon Juice', quantity: 1, unit: 'tbsp', category: 'Condiments' },
          { ingredientId: '6', name: 'Fresh Herbs', quantity: 0.25, unit: 'cup', category: 'Herbs' }
        ],
        recipe: {
          recipeId: '1',
          prepTime: 15,
          cookTime: 20,
          servings: 4,
          difficulty: 'Easy' as const,
          instructions: [
            { stepNumber: 1, instruction: 'Rinse quinoa thoroughly under cold water', duration: 2 },
            { stepNumber: 2, instruction: 'Cook quinoa according to package instructions', duration: 15 },
            { stepNumber: 3, instruction: 'Drain and rinse chickpeas, set aside', duration: 1 },
            { stepNumber: 4, instruction: 'Chop mixed vegetables into bite-sized pieces', duration: 5 },
            { stepNumber: 5, instruction: 'In a large bowl, combine cooked quinoa, chickpeas, and vegetables', duration: 2 },
            { stepNumber: 6, instruction: 'Drizzle with olive oil and lemon juice, toss gently', duration: 1 },
            { stepNumber: 7, instruction: 'Garnish with fresh herbs and serve immediately', duration: 1 }
          ],
          tips: [
            'You can prepare quinoa ahead of time and store in refrigerator',
            'Add more vegetables for extra nutrition and color',
            'Season with salt and pepper to taste'
          ],
          notes: 'This recipe is perfect for meal prep and can be stored for up to 3 days in the refrigerator.'
        }
      },
      {
        dietId: '2',
        name: 'Keto Chicken Salad',
        description: 'Grilled chicken, avocado, mixed greens, olive oil.',
        dietType: 'Keto',
        calories: 450,
        protein: 35,
        carbs: 8,
        fat: 32,
        fiber: 6,
        createdByDoctorId: 'doc1',
        createdAt: new Date(),
        isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop',
        videoUrl: 'https://youtu.be/oX_iH0CbZzg?si=jkzW8WP0xBasAYdB',
        documentUrl: 'https://morth.nic.in/sites/default/files/dd12-13_0.pdf',
        tags: ['lunch', 'high-protein'],
        ingredients: [
          { ingredientId: '1', name: 'Chicken Breast', quantity: 2, unit: 'pieces', category: 'Protein' },
          { ingredientId: '2', name: 'Avocado', quantity: 1, unit: 'medium', category: 'Fruits' },
          { ingredientId: '3', name: 'Mixed Greens', quantity: 3, unit: 'cups', category: 'Vegetables' },
          { ingredientId: '4', name: 'Olive Oil', quantity: 1, unit: 'tbsp', category: 'Oils' },
          { ingredientId: '5', name: 'Balsamic Vinegar', quantity: 1, unit: 'tbsp', category: 'Condiments' }
        ],
        recipe: {
          recipeId: '2',
          prepTime: 10,
          cookTime: 15,
          servings: 2,
          difficulty: 'Easy' as const,
          instructions: [
            { stepNumber: 1, instruction: 'Season chicken breast with salt and pepper', duration: 2 },
            { stepNumber: 2, instruction: 'Grill chicken for 6-8 minutes per side until cooked through', duration: 15 },
            { stepNumber: 3, instruction: 'Let chicken rest for 5 minutes, then slice', duration: 5 },
            { stepNumber: 4, instruction: 'Wash and prepare mixed greens', duration: 3 },
            { stepNumber: 5, instruction: 'Slice avocado and arrange on greens', duration: 2 },
            { stepNumber: 6, instruction: 'Top with sliced chicken and drizzle with olive oil and balsamic', duration: 1 }
          ],
          tips: [
            'Use a meat thermometer to ensure chicken is cooked to 165°F',
            'You can substitute with turkey or fish for variety',
            'Add nuts or seeds for extra crunch'
          ],
          notes: 'This keto-friendly salad is perfect for a quick lunch or light dinner.'
        }
      },
      {
        dietId: '3',
        name: 'Vegan Buddha Bowl',
        description: 'Brown rice, tofu, vegetables, tahini dressing.',
        dietType: 'Vegan',
        calories: 380,
        protein: 18,
        carbs: 45,
        fat: 15,
        fiber: 12,
        createdByDoctorId: 'doc1',
        createdAt: new Date(),
        isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop',
        videoUrl: 'https://youtu.be/oX_iH0CbZzg?si=jkzW8WP0xBasAYdB',
        documentUrl: 'https://morth.nic.in/sites/default/files/dd12-13_0.pdf',
        tags: ['dinner', 'plant-based'],
        ingredients: [
          { ingredientId: '1', name: 'Brown Rice', quantity: 1, unit: 'cup', category: 'Grains' },
          { ingredientId: '2', name: 'Tofu', quantity: 1, unit: 'block', category: 'Protein' },
          { ingredientId: '3', name: 'Mixed Vegetables', quantity: 2, unit: 'cups', category: 'Vegetables' },
          { ingredientId: '4', name: 'Tahini', quantity: 2, unit: 'tbsp', category: 'Condiments' },
          { ingredientId: '5', name: 'Lemon Juice', quantity: 1, unit: 'tbsp', category: 'Condiments' },
          { ingredientId: '6', name: 'Garlic', quantity: 2, unit: 'cloves', category: 'Vegetables' }
        ],
        recipe: {
          recipeId: '3',
          prepTime: 20,
          cookTime: 25,
          servings: 3,
          difficulty: 'Medium' as const,
          instructions: [
            { stepNumber: 1, instruction: 'Cook brown rice according to package instructions', duration: 25 },
            { stepNumber: 2, instruction: 'Press tofu to remove excess water, then cube', duration: 10 },
            { stepNumber: 3, instruction: 'Sauté tofu until golden brown on all sides', duration: 8 },
            { stepNumber: 4, instruction: 'Steam or sauté mixed vegetables until tender', duration: 5 },
            { stepNumber: 5, instruction: 'Make tahini dressing by mixing tahini, lemon juice, and minced garlic', duration: 3 },
            { stepNumber: 6, instruction: 'Assemble bowl with rice, tofu, vegetables, and drizzle with tahini dressing', duration: 2 }
          ],
          tips: [
            'Press tofu for at least 30 minutes for better texture',
            'You can marinate tofu in soy sauce for extra flavor',
            'Add nutritional yeast for a cheesy flavor'
          ],
          notes: 'This vegan buddha bowl is packed with protein and nutrients, perfect for a satisfying dinner.'
        }
      }
    ];

    this.diet = mockDiets.find(d => d.dietId === dietId) || null;
  }

  getVideoEmbedUrl(videoUrl: string): SafeResourceUrl | null {
    if (!videoUrl) return null;
    
    // Extract video ID from YouTube URL
    const videoId = this.extractYouTubeVideoId(videoUrl);
    if (videoId) {
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }
    
    return null;
  }

  extractYouTubeVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  goBack() {
    this.router.navigate(['/diet']);
  }

  onEdit() {
    if (this.diet) {
      this.router.navigate(['/diet/edit', this.diet.dietId]);
    }
  }

  onDelete() {
    if (this.diet) {
      // TODO: Implement delete confirmation dialog
      console.log('Delete diet:', this.diet);
      // After successful deletion, navigate back
      this.goBack();
    }
  }

  onImageError(event: any) {
    event.target.style.display = 'none';
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  scrollToVideo() {
    this.setActiveTab('video');
    setTimeout(() => {
      const videoSection = document.querySelector('.video-section');
      if (videoSection) {
        videoSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  scrollToDocument() {
    this.setActiveTab('document');
    setTimeout(() => {
      const documentSection = document.querySelector('.document-section');
      if (documentSection) {
        documentSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  getBreadcrumbs() {
    return [
      { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
      { label: 'Diets', path: '/diet', icon: 'restaurant' },
      { label: this.diet?.name || 'Diet Details', icon: 'restaurant_menu', isActive: true }
    ];
  }



  getIngredientIcon(category?: string): string {
    const iconMap: { [key: string]: string } = {
      'Grains': 'grain',
      'Protein': 'fitness_center',
      'Vegetables': 'eco',
      'Fruits': 'local_florist',
      'Legumes': 'grass',
      'Oils': 'oil_barrel',
      'Condiments': 'restaurant',
      'Herbs': 'local_florist',
      'Dairy': 'local_drink',
      'Nuts': 'park'
    };
    return iconMap[category || ''] || 'restaurant';
  }
}

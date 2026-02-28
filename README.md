# Shree Clinic Management System

A modern Angular 17 application built with standalone components for managing patient records in a healthcare clinic.

## Features

- **Standalone Components**: Built using Angular 17's standalone component architecture (no NgModules)
- **Patient Management**: Add, edit, view, and delete patient records
- **Responsive Design**: Mobile-friendly interface with modern UI/UX
- **Form Validation**: Comprehensive form validation with error messages
- **Routing**: Client-side routing with Angular Router
- **Modern UI**: Clean, professional design with gradient backgrounds and smooth animations

## Technology Stack

- **Angular 17**: Latest version with standalone components
- **TypeScript**: Type-safe development
- **CSS3**: Modern styling with Flexbox and Grid
- **Angular Reactive Forms**: Form handling and validation
- **Angular Router**: Client-side navigation

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── header/          # Navigation header
│   │   ├── footer/          # Application footer
│   │   ├── patient-list/    # Patient records table
│   │   └── patient-form/    # Add/Edit patient form
│   ├── app.component.ts     # Main app component
│   ├── app.routes.ts        # Application routing
│   └── app.config.ts        # App configuration
├── assets/                  # Static assets
└── styles.css              # Global styles
```

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd shree-clinic
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
ng serve
```

4. Open your browser and navigate to `https://doctech.solutions`

### Build for Production

```bash
ng build
```

The build artifacts will be stored in the `dist/` directory.

## Application Features

### Patient Management

- **View Patients**: Browse all patient records in a responsive table
- **Add Patient**: Create new patient records with form validation
- **Edit Patient**: Update existing patient information
- **Delete Patient**: Remove patient records from the system

### Form Validation

The patient form includes comprehensive validation for:
- Required fields
- Email format validation
- Phone number format validation
- Age range validation (1-120 years)
- Minimum name length (2 characters)

### Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## Standalone Components

This application demonstrates Angular 17's standalone component architecture:

- **No NgModules**: Each component is self-contained
- **Direct Imports**: Components import only what they need
- **Better Tree Shaking**: Improved bundle optimization
- **Simplified Architecture**: Easier to understand and maintain

## Development

### Adding New Components

```bash
ng generate component components/component-name --standalone
```

### Adding New Routes

Update `app.routes.ts` to add new routes:

```typescript
export const routes: Routes = [
  { path: 'new-route', component: NewComponent },
  // ... existing routes
];
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.

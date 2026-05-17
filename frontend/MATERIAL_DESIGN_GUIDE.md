# Angular Material Design Guide - NutriCare

## Overview
This project has been enhanced with Angular Material Design components. This guide covers best practices, component usage, and customization options.

## Installation & Setup

### Already Installed
- `@angular/material` ^21.2.11
- `@angular/cdk` ^21.2.11

### Theme Configuration
- Custom theme defined in: `src/custom-theme.scss`
- Global styles: `src/styles.css`
- Component-specific styles: Individual component `.css` files

## Available Material Components

### Currently Used
- **MatSidenavModule** - Sidebar navigation
- **MatToolbarModule** - Top header
- **MatButtonModule** - All buttons (raised, stroked, flat)
- **MatIconModule** - Material icons
- **MatListModule** - Navigation lists
- **MatCardModule** - Content cards
- **MatFormFieldModule** - Form inputs
- **MatInputModule** - Input fields
- **MatMenuModule** - Dropdown menus
- **MatBadgeModule** - Notification badges
- **MatChipsModule** - Status chips
- **MatDividerModule** - Visual dividers
- **MatProgressBarModule** - Progress indicators
- **MatTabsModule** - Tabbed content
- **MatGridListModule** - Grid layouts

## Dashboard Component Example

The dashboard demonstrates key Material Design patterns:

### 1. **Stats Cards**
```html
<mat-card *ngFor="let stat of stats" class="stat-card">
  <mat-card-content>
    <div class="stat-header">
      <mat-icon>{{ stat.icon }}</mat-icon>
    </div>
    <div class="stat-body">
      <p class="stat-label">{{ stat.label }}</p>
      <p class="stat-value">{{ stat.value }}</p>
    </div>
  </mat-card-content>
</mat-card>
```

### 2. **Action Buttons**
```html
<button mat-raised-button color="primary" (click)="handleAction()">
  <mat-icon>add</mat-icon>
  Create New
</button>
```

### 3. **Material Lists with Navigation**
```html
<mat-nav-list>
  <mat-list-item routerLink="/dashboard/patients" routerLinkActive="active">
    <mat-icon matListItemIcon>group</mat-icon>
    <span matListItemTitle>Patients</span>
  </mat-list-item>
</mat-nav-list>
```

### 4. **Form Fields**
```html
<mat-form-field appearance="fill">
  <mat-label>Patient Name</mat-label>
  <mat-icon matPrefix>person</mat-icon>
  <input matInput [formControl]="patientName">
</mat-form-field>
```

### 5. **Status Badges**
```html
<mat-chip [color]="status === 'active' ? 'accent' : 'warn'" selected>
  {{ status }}
</mat-chip>
```

## Material Icons

### Common Icons for Healthcare App
- **Navigation**: menu, home, dashboard, arrow_back
- **Patients**: group, person, person_add
- **Appointments**: calendar_today, event, schedule
- **Messages**: mail, chat, notifications
- **Actions**: add, edit, delete, save, close
- **Status**: check_circle, error, warning, info
- **Settings**: settings, tune, more_vert

### Using Icons
```html
<!-- Standalone icon -->
<mat-icon>favorite</mat-icon>

<!-- Icon button -->
<button mat-icon-button>
  <mat-icon>delete</mat-icon>
</button>

<!-- Icon with text button -->
<button mat-raised-button>
  <mat-icon>cloud_upload</mat-icon>
  Upload
</button>
```

## Color System

### Primary Color (Green)
- Used for main actions and primary navigation
- RGB: 106, 181, 107
- Hex: #6ab56b

### Accent Color (Teal)
- Used for secondary actions and highlights
- Available as `color="accent"` on Material components

### Warn Color (Red)
- Used for destructive actions and warnings
- Available as `color="warn"` on Material components

## Best Practices

### 1. Component Structure
```typescript
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './my-component.html',
  styleUrls: ['./my-component.css']
})
export class MyComponent {}
```

### 2. Responsive Grid Layout
```html
<div class="stats-grid">
  <mat-card *ngFor="let item of items" class="stat-card">
    <!-- Card content -->
  </mat-card>
</div>
```

CSS:
```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}
```

### 3. Consistent Spacing
- Use Material spacing scale: 4px, 8px, 12px, 16px, 20px, 24px, 32px
- Applied via: margin, padding, gap

### 4. Hover & Active States
Material components include built-in hover and active states. Customize in `.css` files:
```css
.my-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  transition: all 0.3s ease;
}
```

## Applying to Other Components

### Step 1: Import Material Modules
```typescript
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
```

### Step 2: Add to Component Imports
```typescript
@Component({
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule]
})
```

### Step 3: Update HTML Template
Replace custom HTML with Material equivalents:
```html
<!-- Before -->
<button class="btn btn-primary">Save</button>

<!-- After -->
<button mat-raised-button color="primary">
  <mat-icon>save</mat-icon>
  Save
</button>
```

### Step 4: Update Styles
Use Material Design tokens and shadows:
```css
.my-card {
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  
  &:hover {
    box-shadow: var(--shadow-md);
  }
}
```

## Components to Update Next

1. **Patient Component** - Use MatTableModule for data
2. **Consultation Component** - Use MatFormFieldModule for forms
3. **Calendar/RDV Component** - Consider MatDatepickerModule
4. **Profile Component** - Use MatTabsModule for sections
5. **Chat Component** - Enhance with Material styling

## Typography

### Font Family
- Display: 'Playfair Display' (serif) - For headings
- Body: 'DM Sans' (sans-serif) - For regular text

### Font Sizes
- Page Title: 18px, weight 700
- Section Title: 16px, weight 600
- Card Title: 14px, weight 600
- Body Text: 13px, weight 400
- Small Text: 12px, weight 400
- Label: 12px, weight 600 (uppercase)

## Customization Tips

### Override Material Styles
```css
::ng-deep .mat-mdc-button {
  border-radius: 8px;
  text-transform: uppercase;
}
```

### Theme Variables
All colors are defined in CSS custom properties (`:root`). Update `dashboard.css` to change:
```css
:root {
  --accent: #6ab56b;
  --text-primary: #1a2e1c;
  --shadow-md: 0 4px 12px rgba(0,0,0,0.12);
}
```

## Resources

- [Angular Material Docs](https://material.angular.io)
- [Material Design Guidelines](https://material.io/design)
- [Material Icons Library](https://fonts.google.com/icons)

## Development Server

```bash
npm start
```

The app will automatically reload when you make changes to component files.

## Common Issues & Solutions

### Icon not showing
- Ensure MatIconModule is imported
- Use correct icon name from Material Icons library
- Check browser console for warnings

### Card styling not applying
- Verify CSS file is linked in component
- Check CSS specificity
- Use browser DevTools to inspect

### Theme colors not applying
- Import Material theme in `styles.css`
- Clear browser cache
- Rebuild the project

## Future Enhancements

- [ ] Implement MatTableModule for patient lists
- [ ] Add MatDatepickerModule for appointment scheduling
- [ ] Use MatSnackBarModule for notifications
- [ ] Implement MatDialogModule for confirmations
- [ ] Add MatProgressSpinnerModule for loading states
- [ ] Use MatAutocompleteModule for search suggestions

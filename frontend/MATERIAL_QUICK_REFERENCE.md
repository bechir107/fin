
# Material Components Quick Reference Guide

## 📦 Material Module Imports

```typescript
// Form Controls
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

// Navigation
import { MatNavListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';

// Data Display
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatListModule } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTreeModule } from '@angular/material/tree';

// Buttons & Indicators
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRippleModule } from '@angular/material/core';

// Popups & Modals
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';

// Layout
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';

// Services
import { MatDateFormats, MAT_DATE_FORMATS } from '@angular/material/core';
```

## 🎯 Common Component Patterns

### 1. Form Field with Input

```html
<mat-form-field appearance="fill">
  <mat-label>Name</mat-label>
  <mat-icon matPrefix>person</mat-icon>
  <input matInput [formControl]="nameControl" placeholder="Enter name">
  <mat-error *ngIf="nameControl.hasError('required')">
    Name is required
  </mat-error>
</mat-form-field>
```

### 2. Select Dropdown

```html
<mat-form-field appearance="fill">
  <mat-label>Select Status</mat-label>
  <mat-select [formControl]="statusControl">
    <mat-option value="active">Active</mat-option>
    <mat-option value="inactive">Inactive</mat-option>
    <mat-option value="pending">Pending</mat-option>
  </mat-select>
</mat-form-field>
```

### 3. Button Group

```html
<div class="button-group">
  <button mat-raised-button color="primary">
    <mat-icon>save</mat-icon>
    Save
  </button>
  <button mat-stroked-button (click)="cancel()">
    <mat-icon>close</mat-icon>
    Cancel
  </button>
</div>
```

### 4. Card with Actions

```html
<mat-card>
  <mat-card-header>
    <mat-card-title>Card Title</mat-card-title>
    <mat-card-subtitle>Subtitle</mat-card-subtitle>
  </mat-card-header>
  
  <mat-divider></mat-divider>
  
  <mat-card-content>
    <!-- Content here -->
  </mat-card-content>
  
  <mat-card-actions>
    <button mat-button>Action 1</button>
    <button mat-button>Action 2</button>
  </mat-card-actions>
</mat-card>
```

### 5. Data Table

```html
<mat-table [dataSource]="dataSource" matSort>
  <!-- Name Column -->
  <ng-container matColumnDef="name">
    <mat-header-cell *matHeaderCellDef mat-sort-header>Name</mat-header-cell>
    <mat-cell *matCellDef="let element">{{ element.name }}</mat-cell>
  </ng-container>

  <!-- Email Column -->
  <ng-container matColumnDef="email">
    <mat-header-cell *matHeaderCellDef mat-sort-header>Email</mat-header-cell>
    <mat-cell *matCellDef="let element">{{ element.email }}</mat-cell>
  </ng-container>

  <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
  <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
</mat-table>

<mat-paginator [pageSizeOptions]="[5, 10, 25]" showFirstLastPages></mat-paginator>
```

### 6. Dialog

```typescript
constructor(public dialog: MatDialog) {}

openDialog(): void {
  const dialogRef = this.dialog.open(DialogComponent, {
    width: '400px',
    data: { name: 'test' }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      console.log('Dialog confirmed:', result);
    }
  });
}
```

### 7. Snack Bar Notification

```typescript
constructor(private snackBar: MatSnackBar) {}

showMessage(message: string): void {
  this.snackBar.open(message, 'Close', {
    duration: 3000,
    horizontalPosition: 'end',
    verticalPosition: 'bottom'
  });
}
```

### 8. Menu

```html
<button mat-icon-button [matMenuTriggerFor]="menu">
  <mat-icon>more_vert</mat-icon>
</button>

<mat-menu #menu="matMenu">
  <button mat-menu-item (click)="edit()">
    <mat-icon>edit</mat-icon>
    <span>Edit</span>
  </button>
  <button mat-menu-item (click)="delete()">
    <mat-icon>delete</mat-icon>
    <span>Delete</span>
  </button>
</mat-menu>
```

### 9. Tabs

```html
<mat-tab-group>
  <mat-tab label="Tab 1">
    <ng-template mat-tab-label>
      <mat-icon class="tab-icon">info</mat-icon>
      Tab 1
    </ng-template>
    Content for tab 1
  </mat-tab>
  <mat-tab label="Tab 2">
    Content for tab 2
  </mat-tab>
</mat-tab-group>
```

### 10. Progress Indicator

```html
<!-- Linear Progress -->
<mat-progress-bar mode="determinate" value="40"></mat-progress-bar>

<!-- Spinner -->
<mat-spinner diameter="50"></mat-spinner>

<!-- Progress Bar with Buffer -->
<mat-progress-bar mode="buffer" value="35" bufferValue="55"></mat-progress-bar>
```

## 🎨 Styling Patterns

### Card Hover Effect

```css
.my-card {
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-4px);
  }
}
```

### Responsive Grid

```css
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}
```

### Button with Icon

```css
.action-button {
  display: flex;
  align-items: center;
  gap: 8px;

  mat-icon {
    font-size: 18px;
    width: 18px;
    height: 18px;
  }
}
```

## 📝 TypeScript Patterns

### Form Setup with Validation

```typescript
import { FormControl, Validators } from '@angular/forms';

export class MyComponent {
  nameControl = new FormControl('', [
    Validators.required,
    Validators.minLength(3)
  ]);

  emailControl = new FormControl('', [
    Validators.required,
    Validators.email
  ]);

  isFormValid(): boolean {
    return this.nameControl.valid && this.emailControl.valid;
  }
}
```

### Material Table with Sorting & Pagination

```typescript
import { MatTableDataSource } from '@angular/material/table';

export class MyComponent {
  displayedColumns: string[] = ['name', 'email', 'status'];
  dataSource = new MatTableDataSource(this.data);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
```

## 🎯 CSS Variables Available

```css
/* Colors */
--accent: #6ab56b;
--accent-dark: #4a9a4a;
--accent-light: rgba(106,181,107,0.15);
--text-primary: #1a2e1c;
--text-secondary: #5a7566;
--text-muted: #8aab96;
--card-bg: #ffffff;
--page-bg: #f5faf7;

/* Spacing */
--radius-sm: 8px;
--radius-md: 10px;
--radius-lg: 12px;

/* Shadows */
--shadow-sm: 0 2px 4px rgba(0,0,0,0.08);
--shadow-md: 0 4px 12px rgba(0,0,0,0.12);
--shadow-lg: 0 8px 24px rgba(0,0,0,0.15);
```

## 🔗 Usage Example in Component

```typescript
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <mat-card>
      <mat-card-content>
        <button mat-raised-button color="primary">
          <mat-icon>add</mat-icon>
          Create
        </button>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    mat-card {
      border-radius: 12px;
    }
  `]
})
export class ExampleComponent {}
```

## 🚀 Performance Tips

1. **Lazy Load Material Modules** - Only import what you need
2. **Use OnPush Change Detection** - For large lists
3. **Virtual Scrolling** - For tables with many rows
4. **Tree Shaking** - Unused Material code is removed in production
5. **Bundle Analysis** - Monitor size growth

## 📱 Mobile Responsive Patterns

```css
/* Desktop First Approach */
.component {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

/* Mobile */
@media (max-width: 768px) {
  .component {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
```

## 🎓 Learning Resources

- **Official Docs**: https://material.angular.io
- **Material Icons**: https://fonts.google.com/icons
- **Design System**: https://material.io/design
- **Storybook**: Check Material examples for patterns
- **YouTube**: Search "Angular Material Tutorial"

---

**Version:** 1.0
**Last Updated:** 2024-01-15

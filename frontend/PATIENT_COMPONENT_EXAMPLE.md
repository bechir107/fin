# Patient Component - Material Design Example

This is a reference implementation showing how to implement a Material Design component.

## TypeScript Component

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

interface Patient {
  id: string;
  name: string;
  email: string;
  age: number;
  lastAppointment: Date;
  status: 'actif' | 'inactif';
  avatarColor: string;
  initials: string;
}

@Component({
  selector: 'app-patient',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './patient.html',
  styleUrls: ['./patient.css']
})
export class PatientComponent implements OnInit {

  // Form Controls
  searchControl = new FormControl('');
  sortControl = new FormControl('name');

  // Patient Data
  patients: Patient[] = [
    {
      id: '1',
      name: 'Jean Dupont',
      email: 'jean.dupont@email.com',
      age: 35,
      lastAppointment: new Date('2024-01-15'),
      status: 'actif',
      avatarColor: '#6ab56b',
      initials: 'JD'
    },
    {
      id: '2',
      name: 'Marie Martin',
      email: 'marie.martin@email.com',
      age: 28,
      lastAppointment: new Date('2024-01-14'),
      status: 'actif',
      avatarColor: '#2196f3',
      initials: 'MM'
    }
  ];

  // Filtered patients
  filteredPatients: Patient[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.initializeFiltering();
    this.filteredPatients = [...this.patients];
  }

  /**
   * Initialize search and sort controls
   */
  private initializeFiltering(): void {
    this.searchControl.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    this.sortControl.valueChanges.subscribe(() => {
      this.applySorting();
    });
  }

  /**
   * Apply search filters to patient list
   */
  private applyFilters(): void {
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    
    if (!searchTerm) {
      this.filteredPatients = [...this.patients];
    } else {
      this.filteredPatients = this.patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm) ||
        patient.email.toLowerCase().includes(searchTerm)
      );
    }

    this.applySorting();
  }

  /**
   * Apply sorting to filtered patients
   */
  private applySorting(): void {
    const sortType = this.sortControl.value || 'name';

    switch (sortType) {
      case 'name':
        this.filteredPatients.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        break;
      case 'date':
        this.filteredPatients.sort((a, b) =>
          new Date(b.lastAppointment).getTime() -
          new Date(a.lastAppointment).getTime()
        );
        break;
      case 'status':
        this.filteredPatients.sort((a, b) =>
          a.status.localeCompare(b.status)
        );
        break;
    }
  }

  /**
   * Add new patient
   */
  addPatient(): void {
    this.router.navigate(['/dashboard/patient/new']);
  }

  /**
   * View patient details
   */
  viewPatient(patientId: string): void {
    this.router.navigate(['/dashboard/patient', patientId]);
  }

  /**
   * Edit patient
   */
  editPatient(patientId: string): void {
    this.router.navigate(['/dashboard/patient', patientId, 'edit']);
  }

  /**
   * Delete patient
   */
  deletePatient(patientId: string): void {
    console.log('Delete patient:', patientId);
  }

  /**
   * Schedule appointment
   */
  scheduleAppointment(patientId: string): void {
    this.router.navigate(['/dashboard/rdv/new'], {
      queryParams: { patientId }
    });
  }

  /**
   * View patient notes
   */
  viewNotes(patientId: string): void {
    this.router.navigate(['/dashboard/patient', patientId, 'notes']);
  }
}
```

## Key Points

1. **Module Imports**: All necessary Material modules are imported
2. **Standalone Component**: Uses modern Angular standalone API
3. **Form Controls**: FormControl for search and sort
4. **Data Interface**: Patient interface for type safety
5. **Methods**: Filtering, sorting, and navigation methods
6. **Observable Pattern**: Subscribe to form control changes

## Next Steps

To implement this in your actual patient component:

1. Copy the TypeScript structure (adjusting template/style paths)
2. Use the HTML template from `MATERIAL_COMPONENT_EXAMPLE.html`
3. Use the CSS styles from `MATERIAL_COMPONENT_STYLES.css`
4. Replace data with real service calls
5. Add Material modules to imports array

## Related Files

- **Template**: See `MATERIAL_COMPONENT_EXAMPLE.html`
- **Styles**: See `MATERIAL_COMPONENT_STYLES.css`
- **Guide**: See `MATERIAL_QUICK_REFERENCE.md` for more patterns

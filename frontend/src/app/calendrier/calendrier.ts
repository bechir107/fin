import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Service } from '../nut/service';

@Component({
  selector: 'app-calendrier',
  templateUrl: './calendrier.html',
  styleUrls: ['./calendrier.css'],
  imports: [ReactiveFormsModule, CommonModule]
})
export class Calendrier implements OnInit {
  rdvForm!: FormGroup;
  idNutritionnisteConnecte = 1;

  patients: any[] = [];
  availableSlots: string[] = [];
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private service: Service
  ) {}

  ngOnInit(): void {
    this.rdvForm = this.fb.group({
      id_patient: ['', Validators.required],
      date_rendez_vous: ['', Validators.required],
      heure: [{value: '', disabled: true}, Validators.required]
    });

    this.service.getPatientsDropdown().subscribe({
      next: (data) => this.patients = data,
      error: (err) => console.error('Erreur chargement patients', err)
    });

    this.rdvForm.get('date_rendez_vous')?.valueChanges.subscribe(date => {
      this.onDateChange(date);
    });
  }

  onDateChange(date: string) {
    if (!date) {
      this.availableSlots = [];
      this.rdvForm.get('heure')?.disable();
      this.rdvForm.get('heure')?.setValue('');
      return;
    }
    
    this.service.getAvailableSlots(date).subscribe({
      next: (slots) => {
        this.availableSlots = slots;
        if (slots.length > 0) {
          this.rdvForm.get('heure')?.enable();
        } else {
          this.rdvForm.get('heure')?.disable();
        }
        this.rdvForm.get('heure')?.setValue('');
      },
      error: (err) => console.error('Erreur chargement créneaux', err)
    });
  }

  onSubmit(): void {
    if (this.rdvForm.valid) {
      this.isSubmitting = true;
      const formValues = this.rdvForm.value;

      this.service.createAppointment(
        Number(formValues.id_patient), 
        formValues.date_rendez_vous, 
        formValues.heure,
        this.idNutritionnisteConnecte
      ).subscribe({
        next: (response: any) => {
          this.isSubmitting = false;
          alert('Succès : ' + (response.message || 'Rendez-vous réservé avec succès !'));
          this.rdvForm.reset();
        },
        error: (err: any) => {
          this.isSubmitting = false;
          alert('Erreur : ' + (err.error?.message || 'Une erreur est survenue'));
        }
      });
    }
  }

  annuler(): void {
    this.rdvForm.reset();
  }
}
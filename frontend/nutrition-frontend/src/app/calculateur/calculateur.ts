import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-calculateur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calculateur.html',
  styleUrl: './calculateur.css',
})
export class Calculateur {
  // BMI Inputs
  bmiWeight: number | null = null;
  bmiHeight: number | null = null;
  bmiResult: number | null = null;
  bmiCategory: string = '';

  // Calorie Inputs
  calAge: number | null = null;
  calGender: 'male' | 'female' = 'male';
  calHeight: number | null = null;
  calWeight: number | null = null;
  calActivity: number = 1.2;
  calResult: number | null = null;

  activeTab: 'bmi' | 'calories' = 'bmi';

  calculateBMI() {
    if (this.bmiWeight && this.bmiHeight) {
      const heightInMeters = this.bmiHeight / 100;
      this.bmiResult = Number((this.bmiWeight / (heightInMeters * heightInMeters)).toFixed(1));
      
      if (this.bmiResult < 18.5) this.bmiCategory = 'Insuffisance pondérale';
      else if (this.bmiResult < 25) this.bmiCategory = 'Poids normal';
      else if (this.bmiResult < 30) this.bmiCategory = 'Surpoids';
      else this.bmiCategory = 'Obésité';
    }
  }

  calculateCalories() {
    if (this.calWeight && this.calHeight && this.calAge) {
      let bmr: number;
      if (this.calGender === 'male') {
        bmr = (10 * this.calWeight) + (6.25 * this.calHeight) - (5 * this.calAge) + 5;
      } else {
        bmr = (10 * this.calWeight) + (6.25 * this.calHeight) - (5 * this.calAge) - 161;
      }
      this.calResult = Math.round(bmr * this.calActivity);
    }
  }

  setTab(tab: 'bmi' | 'calories') {
    this.activeTab = tab;
  }
}

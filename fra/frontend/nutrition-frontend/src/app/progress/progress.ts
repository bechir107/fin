import { Component } from '@angular/core';
import { Service } from '../nut/service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-progress',
  imports: [CommonModule, FormsModule],
  templateUrl: './progress.html',
  styleUrl: './progress.css',
})
export class Progress {

}
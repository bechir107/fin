import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Service } from '../nut/service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  role: string = '';
  user: any = null;

  constructor(private router: Router, private service: Service) {}

  ngOnInit() {
    this.user = this.service.cuurrentUser;
    this.role = this.user?.role || 'patient';
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('user_data');
    this.service.cuurrentUser = null;
    this.router.navigate(['/login']);
  }}
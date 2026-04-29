import { Component } from '@angular/core';
import { Footer } from '../footer/footer';
import { Navbar } from '../navbar/navbar';
import { RouterOutlet } from '@angular/router';
RouterOutlet
@Component({
  selector: 'app-layout',
  imports: [Navbar, Footer, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {

}

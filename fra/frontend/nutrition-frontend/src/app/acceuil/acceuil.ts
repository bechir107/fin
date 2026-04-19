import { Component, AfterViewInit, ElementRef, QueryList, ViewChildren, Inject, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Footer } from '../shared/footer/footer';
import { Navbar } from '../shared/navbar/navbar';
@Component({
  selector: 'app-acceuil',
  standalone: true,
  imports: [RouterLink, CommonModule, Navbar, Footer],
  templateUrl: './acceuil.html',
  styleUrl: './acceuil.css'
})
export class Acceuil implements AfterViewInit {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  @ViewChildren('reveal') revealEls!: QueryList<ElementRef>;

  stats = [
    { num: '500+', label: 'Patients suivis' },
    { num: '98%',  label: 'Taux de satisfaction' },
    { num: '10 ans', label: "D'expérience clinique" },
    { num: '3 mois', label: 'Résultats visibles' },
  ];

  services = [
    { icon: '📋', title: 'Dossier patient numérique',      desc: 'Chaque patient dispose d\'un dossier complet : poids, taille, IMC, historique et objectifs enregistrés à chaque consultation.' },
    { icon: '🥗', title: 'Plan alimentaire personnalisé',   desc: 'Le Dr. Mrad rédige directement dans la plateforme un régime sur mesure, accessible par le patient depuis son espace.' },
    { icon: '📈', title: 'Suivi de la progression',         desc: 'Courbes de poids, évolution de l\'IMC et comparaison avant/après visible en temps réel par le patient et le nutritionniste.' },
    { icon: '⚖️', title: 'Gestion poids & mesures',         desc: 'Enregistrement du poids, tour de taille, masse grasse et musculaire à chaque visite pour un suivi anthropométrique précis.' },
    { icon: '🔔', title: 'Rappels & rendez-vous',           desc: 'Le patient reçoit des rappels pour ses consultations et peut consulter son planning de suivi depuis son compte.' },
    { icon: '🔒', title: 'Espace sécurisé & confidentiel',  desc: 'Chaque patient accède uniquement à ses propres données. Les informations médicales sont protégées et cryptées.' },
  ];

  steps = [
    { icon: '🩺', title: 'Consultation au cabinet',  desc: 'Le Dr. Farouk Mrad vous reçoit, prend vos mesures (poids, taille, IMC) et enregistre votre profil dans la plateforme.' },
    { icon: '📝', title: 'Votre plan est rédigé',     desc: 'Le nutritionniste rédige votre programme alimentaire personnalisé directement dans votre dossier numérique.' },
    { icon: '📱', title: 'Accédez à votre espace',    desc: 'Connectez-vous depuis n\'importe quel appareil pour consulter votre régime, votre suivi de poids et votre évolution.' },
  ];

  testimonials = [
    { emoji: '😊', bg: '#e8f5ee', name: 'Sarah M.',  role: 'Perte de poids — -8 kg en 3 mois', stars: 5,
      text: 'Grâce au suivi du Dr. Mrad et à l\'application, j\'ai pu voir mon évolution semaine par semaine. Très motivant !' },
    { emoji: '💪', bg: '#fef6e4', name: 'Karim B.',  role: 'Prise de masse — +4 kg muscle',    stars: 5,
      text: 'Le plan alimentaire est précis, adapté à mes entraînements. Avoir accès à mon dossier en ligne est un vrai plus.' },
    { emoji: '🌿', bg: '#f0f8f4', name: 'Leila H.',  role: 'Rééquilibrage alimentaire',        stars: 5,
      text: 'Pouvoir consulter mon régime et mes résultats depuis mon téléphone a complètement changé ma façon de suivre mon traitement.' },
  ];

  getStars(n: number) { return Array(n).fill('★'); }

  scrollTo(id: string) {
    if (isPlatformBrowser(this.platformId)) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  ngAfterViewInit() {

    if (!isPlatformBrowser(this.platformId)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    setTimeout(() => {
      this.revealEls.forEach(el =>
        observer.observe(el.nativeElement)
      );
    }, 100);
  }
}
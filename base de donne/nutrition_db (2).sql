-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : dim. 05 avr. 2026 à 14:12
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `nutrition_db`
--

-- --------------------------------------------------------

--
-- Structure de la table `patient`
--

CREATE TABLE `patient` (
  `id` int(11) NOT NULL,
  `nom` varchar(255) NOT NULL,
  `prenom` varchar(255) NOT NULL,
  `age` varchar(255) NOT NULL,
  `genre` enum('homme','femme') NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `tel` int(255) NOT NULL,
  `adresse` varchar(255) NOT NULL,
  `note_interne` varchar(255) NOT NULL,
  `taille` int(3) NOT NULL,
  `poids_actuiele` int(3) NOT NULL,
  `allergies` varchar(255) NOT NULL,
  `condition_med` varchar(255) NOT NULL,
  `niveau_act` enum('sédentaire','légére','modérée','intense','extréme') NOT NULL,
  `objectif` enum('perte de poids','prise de masse','maintien','sante cardio','perfermoance','pathlogie') NOT NULL,
  `description` varchar(255) NOT NULL,
  `date_creation` date NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `patient`
--

INSERT INTO `patient` (`id`, `nom`, `prenom`, `age`, `genre`, `email`, `password`, `tel`, `adresse`, `note_interne`, `taille`, `poids_actuiele`, `allergies`, `condition_med`, `niveau_act`, `objectif`, `description`, `date_creation`) VALUES
(53, 'bechir', 'kanzari', '50', 'homme', 'kanzari386@gmail.com', 'admin', 2147483647, 'street hannbal 113', 'rien', 170, 65, 'rien', 'rien', 'légére', 'maintien', 'rien', '2026-04-02'),
(54, 'khlifa', 'ameni', '28', 'femme', 'ameni@gmail.com', 'amenikhlifa123', 98562147, 'morneg', 'rine', 180, 89, 'rine', 'rine', 'intense', 'sante cardio', 'rien', '2026-04-03'),
(55, 'kanzari', 'mohamed bechir', '21', 'femme', 'kanzari386@gmail.com', 'kanzaribechir123', 58902117, 'yassminet ', 'donc', 190, 80, 'rien', 'rien', 'intense', 'sante cardio', 'donc on a', '2026-04-03'),
(56, 'nour', 'gurini', '21', 'femme', 'nour@gmail.com', 'nour123', 2147483647, 'street hannbal 113', 'rine', 180, 81, 'rien', 'rine', 'légére', 'prise de masse', 'rien', '2026-04-03');

-- --------------------------------------------------------

--
-- Structure de la table `rdv`
--

CREATE TABLE `rdv` (
  `id` int(11) NOT NULL,
  `nom` varchar(255) NOT NULL,
  `prenom` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `hrdv` varchar(255) NOT NULL,
  `daterdv` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `rdv`
--

INSERT INTO `rdv` (`id`, `nom`, `prenom`, `email`, `hrdv`, `daterdv`) VALUES
(54, 'nour', 'guieni', 'nourgguirni@gmail.com', '10:00', '2026-03-17'),
(55, 'lamia', 'kanzari', 'kanzari386@gmai.com', '11:45', '2026-03-17'),
(65, 'bechir', 'kanzari', 'kanzari386@gmail.com', '10:00', '2026-03-18'),
(66, 'nour', 'gueini', 'nourgueini@123gmaiol.com', '09:00', '2026-03-18'),
(67, 'nour', 'gueini', 'nour1s3@gamil.com', '10:00', '2026-03-22'),
(68, 'bechir', 'lanzari', 'kanzari386@gmail.com', '09:00', '2026-03-22'),
(69, 'kiki', 'doudu', 'hahha', '12:00', '2026-03-23'),
(70, 'mansour', 'kanzari', 'kanzari', '11:00', '2026-03-24'),
(71, 'am mourad', 'gueinu', 'hhhhh', '09:00', '2026-03-24'),
(72, 'amal', 'kanzari', 'hahah', '10:00', '2026-03-31'),
(73, 'bechir', 'kanzari', 'kanzari386@gmail.com', '09:00', '2026-04-02'),
(74, 'lamia', 'kanzari', 'lamia@gmail.com', '10:00', '2026-04-02'),
(75, 'islem', 'kh', 'iselm@gmail.com', '10:00', '2026-04-03'),
(76, 'lamia', 'kanazri', 'kanzari386@gmail.com', '10:00', '2026-04-04'),
(77, 'nour', 'gueini', 'kanzari386@gmail.com', '09:00', '2026-04-04');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(3) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `role`) VALUES
(1, 'bechir', 'admin123', 'admin');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `patient`
--
ALTER TABLE `patient`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `rdv`
--
ALTER TABLE `rdv`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `patient`
--
ALTER TABLE `patient`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT pour la table `rdv`
--
ALTER TABLE `rdv`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=78;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
